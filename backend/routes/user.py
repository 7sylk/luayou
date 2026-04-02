import base64
import binascii
import imghdr
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request

from database import db
from models import AdminUserUpdate, ProfileUpdate, UserResponse
from utils import get_current_user, require_admin, serialize_user, xp_for_next_level

router = APIRouter(prefix="/api/user", tags=["user"])
UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads" / "avatars"
MAX_AVATAR_BYTES = 500_000
ALLOWED_IMAGE_TYPES = {"png", "jpeg", "gif", "webp"}


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


@router.get("/profile", response_model=UserResponse)
async def get_profile(request: Request):
    user = await get_current_user(request, db)
    return UserResponse(**serialize_user(user, request))


@router.put("/profile")
async def update_profile(data: ProfileUpdate, request: Request):
    user = await get_current_user(request, db)

    update = {}
    if data.username:
        username = data.username.strip()
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        existing = await db.users.find_one(
            {"username": username, "id": {"$ne": user["id"]}}, {"_id": 0}
        )
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        update["username"] = username

    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})

    updated_user = await db.users.find_one(
        {"id": user["id"]}, {"_id": 0, "password_hash": 0}
    )
    return UserResponse(**serialize_user(updated_user, request))


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

    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"avatar": avatar_path}}
    )

    return {"message": "Avatar updated", "avatar": serialize_user({"avatar": avatar_path}, request)["avatar"]}


@router.get("/stats")
async def get_stats(request: Request):
    user = await get_current_user(request, db)

    progress = await db.user_progress.find(
        {"user_id": user["id"], "completed": True}, {"_id": 0}
    ).to_list(100)

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
    }


@router.get("/progress")
async def get_progress(request: Request):
    user = await get_current_user(request, db)

    lessons = await db.lessons.find({}, {"_id": 0}).sort("order_index", 1).to_list(100)
    progress = await db.user_progress.find(
        {"user_id": user["id"], "completed": True}, {"_id": 0}
    ).to_list(100)
    completed_ids = {p["lesson_id"] for p in progress}

    total_xp_possible = sum(l.get("xp_reward", 0) for l in lessons)
    earned_xp_from_lessons = sum(
        l.get("xp_reward", 0) for l in lessons if l["id"] in completed_ids
    )

    lesson_map = []
    for lesson in lessons:
        lesson_map.append({
            "id": lesson["id"],
            "title": lesson["title"],
            "difficulty": lesson["difficulty"],
            "order_index": lesson["order_index"],
            "xp_reward": lesson["xp_reward"],
            "completed": lesson["id"] in completed_ids,
        })

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

    users = await db.users.find(
        {},
        {"_id": 0, "password_hash": 0},
    ).to_list(500)
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
        username = data.username.strip()
        if not username:
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        duplicate = await db.users.find_one(
            {"username": username, "id": {"$ne": user_id}}, {"_id": 0}
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="Username already taken")
        update["username"] = username

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

    if data.level is not None:
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
    return {"message": "User deleted"}
