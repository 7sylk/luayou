import base64
import binascii
import imghdr
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request

from database import db
from models import AdminUserUpdate, FriendRequestCreate, ProfileUpdate, PublicUserResponse, UserResponse
from utils import (
    calculate_level,
    get_current_user,
    normalize_username,
    require_admin,
    serialize_user,
    validate_username,
    xp_for_next_level,
)

router = APIRouter(prefix="/api/user", tags=["user"])
UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads" / "avatars"
MAX_AVATAR_BYTES = 500_000
ALLOWED_IMAGE_TYPES = {"png", "jpeg", "gif", "webp"}
BIO_MAX_LENGTH = 160
USERNAME_CHANGE_COOLDOWN_DAYS = 14


def _decode_avatar_data(avatar_data: str) -> tuple[str, bytes]:
    if not avatar_data.startswith("data:image/") or ";base64," not in avatar_data:
        raise HTTPException(status_code=400, detail="Invalid image format")

    header, encoded = avatar_data.split(",", 1)
    try:
        raw_bytes = base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error):
        raise HTTPException(status_code=400, detail="Invalid image data")

    if len(raw_bytes) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=400, detail="Image too large. Max 500KB.")

    kind = imghdr.what(None, raw_bytes)
    if kind not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    return ("jpg" if kind == "jpeg" else kind), raw_bytes


def _remove_existing_avatar(avatar_path: str) -> None:
    if not avatar_path.startswith("/uploads/avatars/"):
        return
    try:
        target = (UPLOADS_DIR / Path(avatar_path).name).resolve()
        if target.parent == UPLOADS_DIR.resolve() and target.exists():
            target.unlink()
    except OSError:
        pass


def _parse_dt(value):
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value)


def _clean_bio(value: str | None) -> str:
    bio = (value or "").strip()
    if len(bio) > BIO_MAX_LENGTH:
        raise HTTPException(status_code=400, detail=f"Bio must be {BIO_MAX_LENGTH} characters or fewer")
    return bio


async def _build_public_user(target: dict, viewer: dict | None, request: Request) -> dict:
    is_me = bool(viewer and target["id"] == viewer["id"])
    is_friend = False
    incoming_request = False
    outgoing_request = False

    if viewer and not is_me:
        friendship = await db.friendships.find_one(
            {"user_id": viewer["id"], "friend_user_id": target["id"]},
            {"_id": 0},
        )
        outgoing = await db.friend_requests.find_one(
            {"from_user_id": viewer["id"], "to_user_id": target["id"]},
            {"_id": 0},
        )
        incoming = await db.friend_requests.find_one(
            {"from_user_id": target["id"], "to_user_id": viewer["id"]},
            {"_id": 0},
        )
        is_friend = friendship is not None
        outgoing_request = outgoing is not None
        incoming_request = incoming is not None

    serialized = serialize_user(target, request)
    return {
        "id": serialized["id"],
        "username": serialized["username"],
        "avatar": serialized.get("avatar", "default"),
        "bio": serialized.get("bio", ""),
        "xp": serialized.get("xp", 0),
        "level": serialized.get("level", 1),
        "streak": serialized.get("streak", 0),
        "badges": serialized.get("badges", []),
        "lessons_completed": serialized.get("lessons_completed", 0),
        "daily_completed": serialized.get("daily_completed", 0),
        "perfect_quizzes": serialized.get("perfect_quizzes", 0),
        "created_at": serialized["created_at"],
        "is_me": is_me,
        "is_friend": is_friend,
        "incoming_request": incoming_request,
        "outgoing_request": outgoing_request,
    }


async def _apply_profile_update(user: dict, data: ProfileUpdate) -> dict:
    update = {}

    if data.bio is not None:
        update["bio"] = _clean_bio(data.bio)

    if data.username is not None:
        username = validate_username(data.username)
        username_normalized = normalize_username(username)
        current_normalized = normalize_username(user.get("username", ""))

        if username_normalized != current_normalized:
            changed_at = user.get("username_changed_at")
            if changed_at:
                next_change = _parse_dt(changed_at) + timedelta(days=USERNAME_CHANGE_COOLDOWN_DAYS)
                now = datetime.now(timezone.utc)
                if next_change > now:
                    remaining_days = max(1, (next_change.date() - now.date()).days)
                    raise HTTPException(
                        status_code=429,
                        detail=f"Username can only be changed every {USERNAME_CHANGE_COOLDOWN_DAYS} days. Try again in {remaining_days} day(s).",
                    )

            duplicate = await db.users.find_one(
                {"username_normalized": username_normalized, "id": {"$ne": user["id"]}},
                {"_id": 0},
            )
            if duplicate:
                raise HTTPException(status_code=400, detail="Username already taken")

            update["username"] = username
            update["username_normalized"] = username_normalized
            update["username_changed_at"] = datetime.now(timezone.utc).isoformat()

    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})

    return await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})


@router.get("/profile", response_model=UserResponse)
async def get_profile(request: Request):
    user = await get_current_user(request, db)
    return UserResponse(**serialize_user(user, request))


@router.put("/profile", response_model=UserResponse)
async def update_profile(data: ProfileUpdate, request: Request):
    user = await get_current_user(request, db)
    updated_user = await _apply_profile_update(user, data)
    return UserResponse(**serialize_user(updated_user, request))


@router.put("/settings", response_model=UserResponse)
async def update_settings(data: ProfileUpdate, request: Request):
    user = await get_current_user(request, db)
    updated_user = await _apply_profile_update(user, data)
    return UserResponse(**serialize_user(updated_user, request))


@router.get("/by-username/{username}", response_model=PublicUserResponse)
async def get_public_profile(username: str, request: Request):
    viewer = None
    try:
        viewer = await get_current_user(request, db)
    except HTTPException:
        viewer = None

    target = await db.users.find_one(
        {"username_normalized": normalize_username(username)},
        {"_id": 0, "password_hash": 0},
    )
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    return PublicUserResponse(**(await _build_public_user(target, viewer, request)))


@router.get("/friends")
async def list_friends(request: Request):
    user = await get_current_user(request, db)
    friendships = await db.friendships.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    friend_ids = [item["friend_user_id"] for item in friendships]
    if not friend_ids:
        return []

    friends = await db.users.find(
        {"id": {"$in": friend_ids}},
        {"_id": 0, "password_hash": 0},
    ).to_list(500)
    friends.sort(key=lambda candidate: candidate.get("username_normalized", candidate.get("username", "").lower()))
    return [await _build_public_user(friend, user, request) for friend in friends]


@router.get("/friend-requests")
async def list_friend_requests(request: Request):
    user = await get_current_user(request, db)

    incoming = await db.friend_requests.find(
        {"to_user_id": user["id"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(100)
    outgoing = await db.friend_requests.find(
        {"from_user_id": user["id"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(100)

    user_ids = {item["from_user_id"] for item in incoming} | {item["to_user_id"] for item in outgoing}
    related = await db.users.find({"id": {"$in": list(user_ids)}}, {"_id": 0, "password_hash": 0}).to_list(200)
    related_by_id = {candidate["id"]: candidate for candidate in related}

    return {
        "incoming": [
            {
                "id": item["id"],
                "created_at": item["created_at"],
                "user": await _build_public_user(related_by_id[item["from_user_id"]], user, request),
            }
            for item in incoming
            if item["from_user_id"] in related_by_id
        ],
        "outgoing": [
            {
                "id": item["id"],
                "created_at": item["created_at"],
                "user": await _build_public_user(related_by_id[item["to_user_id"]], user, request),
            }
            for item in outgoing
            if item["to_user_id"] in related_by_id
        ],
    }


@router.post("/friend-requests")
async def create_friend_request(data: FriendRequestCreate, request: Request):
    user = await get_current_user(request, db)
    target = await db.users.find_one(
        {"username_normalized": normalize_username(data.username)},
        {"_id": 0, "password_hash": 0},
    )
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target["id"] == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot add yourself")

    friendship = await db.friendships.find_one(
        {"user_id": user["id"], "friend_user_id": target["id"]},
        {"_id": 0},
    )
    if friendship:
        raise HTTPException(status_code=400, detail="You are already friends")

    incoming = await db.friend_requests.find_one(
        {"from_user_id": target["id"], "to_user_id": user["id"]},
        {"_id": 0},
    )
    if incoming:
        raise HTTPException(status_code=400, detail="This user has already sent you a friend request")

    outgoing = await db.friend_requests.find_one(
        {"from_user_id": user["id"], "to_user_id": target["id"]},
        {"_id": 0},
    )
    if outgoing:
        raise HTTPException(status_code=400, detail="Friend request already sent")

    now = datetime.now(timezone.utc).isoformat()
    request_doc = {
        "id": str(uuid.uuid4()),
        "from_user_id": user["id"],
        "to_user_id": target["id"],
        "created_at": now,
    }
    await db.friend_requests.insert_one(request_doc)
    return {"message": "Friend request sent"}


@router.post("/friend-requests/{request_id}/accept")
async def accept_friend_request(request_id: str, request: Request):
    user = await get_current_user(request, db)
    friend_request = await db.friend_requests.find_one(
        {"id": request_id, "to_user_id": user["id"]},
        {"_id": 0},
    )
    if not friend_request:
        raise HTTPException(status_code=404, detail="Friend request not found")

    now = datetime.now(timezone.utc).isoformat()
    from_user_id = friend_request["from_user_id"]
    to_user_id = friend_request["to_user_id"]
    await db.friendships.update_one(
        {"user_id": from_user_id, "friend_user_id": to_user_id},
        {"$setOnInsert": {"user_id": from_user_id, "friend_user_id": to_user_id, "created_at": now}},
        upsert=True,
    )
    await db.friendships.update_one(
        {"user_id": to_user_id, "friend_user_id": from_user_id},
        {"$setOnInsert": {"user_id": to_user_id, "friend_user_id": from_user_id, "created_at": now}},
        upsert=True,
    )
    await db.friend_requests.delete_one({"id": request_id})
    return {"message": "Friend request accepted"}


@router.post("/friend-requests/{request_id}/decline")
async def decline_friend_request(request_id: str, request: Request):
    user = await get_current_user(request, db)
    result = await db.friend_requests.delete_one({"id": request_id, "to_user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friend request not found")
    return {"message": "Friend request declined"}


@router.delete("/friends/{username}")
async def remove_friend(username: str, request: Request):
    user = await get_current_user(request, db)
    target = await db.users.find_one(
        {"username_normalized": normalize_username(username)},
        {"_id": 0, "password_hash": 0},
    )
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    await db.friendships.delete_many(
        {
            "$or": [
                {"user_id": user["id"], "friend_user_id": target["id"]},
                {"user_id": target["id"], "friend_user_id": user["id"]},
            ]
        }
    )
    await db.friend_requests.delete_many(
        {
            "$or": [
                {"from_user_id": user["id"], "to_user_id": target["id"]},
                {"from_user_id": target["id"], "to_user_id": user["id"]},
            ]
        }
    )
    return {"message": "Friend removed"}


@router.post("/avatar")
async def upload_avatar(data: dict, request: Request):
    user = await get_current_user(request, db)

    avatar_data = data.get("avatar", "")
    if not avatar_data:
        raise HTTPException(status_code=400, detail="No avatar data provided")

    extension, raw_bytes = _decode_avatar_data(avatar_data)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    previous_avatar = user.get("avatar", "default")
    filename = f"{user['id']}.{extension}"
    target = (UPLOADS_DIR / filename).resolve()
    if target.parent != UPLOADS_DIR.resolve():
        raise HTTPException(status_code=400, detail="Invalid avatar path")

    target.write_bytes(raw_bytes)
    avatar_path = f"/uploads/avatars/{filename}"

    if previous_avatar != avatar_path:
        _remove_existing_avatar(previous_avatar)

    await db.users.update_one({"id": user["id"]}, {"$set": {"avatar": avatar_path}})

    return {
        "message": "Avatar updated",
        "avatar": serialize_user({"avatar": avatar_path}, request)["avatar"],
    }


@router.get("/stats")
async def get_stats(request: Request):
    user = await get_current_user(request, db)

    progress = await db.user_progress.find(
        {"user_id": user["id"], "completed": True}, {"_id": 0}
    ).to_list(200)
    quizzes = await db.quizzes.find({}, {"_id": 0, "id": 1, "lesson_id": 1}).to_list(200)
    quiz_ids = [quiz["id"] for quiz in quizzes]
    quiz_results = await db.user_quiz_results.find(
        {"user_id": user["id"], "quiz_id": {"$in": quiz_ids}}, {"_id": 0, "quiz_id": 1}
    ).to_list(200)
    mastered_lesson_ids = {
        quiz["lesson_id"] for quiz in quizzes if quiz["id"] in {item["quiz_id"] for item in quiz_results}
    }

    return {
        "xp": user.get("xp", 0),
        "level": user.get("level", 1),
        "streak": user.get("streak", 0),
        "lessons_completed": user.get("lessons_completed", 0),
        "daily_completed": user.get("daily_completed", 0),
        "badges": user.get("badges", []),
        "perfect_quizzes": user.get("perfect_quizzes", 0),
        "xp_for_next_level": xp_for_next_level(user.get("xp", 0)),
        "completed_lesson_ids": [p["lesson_id"] for p in progress],
        "mastered_lesson_ids": list(mastered_lesson_ids),
    }


@router.get("/progress")
async def get_progress(request: Request):
    user = await get_current_user(request, db)

    lessons = await db.lessons.find({}, {"_id": 0}).sort("order_index", 1).to_list(200)
    progress = await db.user_progress.find(
        {"user_id": user["id"], "completed": True}, {"_id": 0}
    ).to_list(200)
    completed_ids = {p["lesson_id"] for p in progress}

    total_xp_possible = sum(l.get("xp_reward", 0) for l in lessons)
    earned_xp_from_lessons = sum(
        l.get("xp_reward", 0) for l in lessons if l["id"] in completed_ids
    )

    lesson_map = []
    for lesson in lessons:
        lesson_map.append(
            {
                "id": lesson["id"],
                "title": lesson["title"],
                "difficulty": lesson["difficulty"],
                "order_index": lesson["order_index"],
                "xp_reward": lesson["xp_reward"],
                "completed": lesson["id"] in completed_ids,
                "mastered": False,
            }
        )

    quizzes = await db.quizzes.find({}, {"_id": 0, "id": 1, "lesson_id": 1}).to_list(200)
    quiz_ids = [quiz["id"] for quiz in quizzes]
    quiz_results = await db.user_quiz_results.find(
        {"user_id": user["id"], "quiz_id": {"$in": quiz_ids}}, {"_id": 0, "quiz_id": 1}
    ).to_list(200)
    mastered_lesson_ids = {
        quiz["lesson_id"] for quiz in quizzes if quiz["id"] in {item["quiz_id"] for item in quiz_results}
    }
    for lesson in lesson_map:
        lesson["mastered"] = lesson["id"] in mastered_lesson_ids

    beginner = [l for l in lesson_map if l["difficulty"] == "beginner"]
    intermediate = [l for l in lesson_map if l["difficulty"] == "intermediate"]
    advanced = [l for l in lesson_map if l["difficulty"] == "advanced"]

    return {
        "total_lessons": len(lessons),
        "completed_lessons": len(completed_ids),
        "completion_pct": round(len(completed_ids) / len(lessons) * 100) if lessons else 0,
        "total_xp_possible": total_xp_possible,
        "earned_xp_from_lessons": earned_xp_from_lessons,
        "current_xp": user.get("xp", 0),
        "level": user.get("level", 1),
        "streak": user.get("streak", 0),
        "daily_completed": user.get("daily_completed", 0),
        "perfect_quizzes": user.get("perfect_quizzes", 0),
        "lesson_map": lesson_map,
        "by_difficulty": {
            "beginner": {"total": len(beginner), "completed": sum(1 for l in beginner if l["completed"])},
            "intermediate": {"total": len(intermediate), "completed": sum(1 for l in intermediate if l["completed"])},
            "advanced": {"total": len(advanced), "completed": sum(1 for l in advanced if l["completed"])},
        },
    }


@router.get("/admin/check")
async def admin_check(request: Request):
    user = await get_current_user(request, db)
    return {"is_admin": user.get("role") == "admin"}


@router.get("/admin/users")
async def list_users_admin(request: Request):
    user = await get_current_user(request, db)
    require_admin(user)

    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    users.sort(key=lambda u: u.get("created_at", ""), reverse=True)
    return [serialize_user(candidate, request) for candidate in users]


@router.put("/admin/users/{user_id}")
async def update_user_admin(user_id: str, data: AdminUserUpdate, request: Request):
    user = await get_current_user(request, db)
    require_admin(user)

    existing = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")

    update = {}
    if data.username is not None:
        username = validate_username(data.username)
        duplicate = await db.users.find_one(
            {"username_normalized": normalize_username(username), "id": {"$ne": user_id}},
            {"_id": 0},
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="Username already taken")
        update["username"] = username
        update["username_normalized"] = normalize_username(username)

    for field in [
        "xp",
        "streak",
        "lessons_completed",
        "daily_completed",
        "perfect_quizzes",
    ]:
        value = getattr(data, field)
        if value is not None:
            if value < 0:
                raise HTTPException(status_code=400, detail=f"{field} cannot be negative")
            update[field] = value

    if data.xp is not None:
        update["level"] = calculate_level(data.xp)
    elif data.level is not None:
        if data.level < 1:
            raise HTTPException(status_code=400, detail="level must be at least 1")
        update["level"] = data.level

    if data.badges is not None:
        update["badges"] = [b.strip() for b in data.badges if isinstance(b, str) and b.strip()]

    if not update:
        return serialize_user(existing, request)

    await db.users.update_one({"id": user_id}, {"$set": update})
    updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return serialize_user(updated, request)


@router.delete("/admin/users/{user_id}")
async def delete_user_admin(user_id: str, request: Request):
    user = await get_current_user(request, db)
    require_admin(user)

    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin account")

    _remove_existing_avatar(target.get("avatar", ""))
    await db.users.delete_one({"id": user_id})
    await db.user_progress.delete_many({"user_id": user_id})
    await db.user_daily.delete_many({"user_id": user_id})
    await db.user_quiz_results.delete_many({"user_id": user_id})
    await db.friendships.delete_many(
        {"$or": [{"user_id": user_id}, {"friend_user_id": user_id}]}
    )
    await db.friend_requests.delete_many(
        {"$or": [{"from_user_id": user_id}, {"to_user_id": user_id}]}
    )
    return {"message": "User deleted"}
