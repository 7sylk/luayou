from fastapi import APIRouter, HTTPException, Request
from models import UserResponse, ProfileUpdate
from database import db
from utils import get_current_user, xp_for_next_level, check_badges

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/profile", response_model=UserResponse)
async def get_profile(request: Request):
    user = await get_current_user(request, db)
    return UserResponse(**user)


@router.put("/profile")
async def update_profile(data: ProfileUpdate, request: Request):
    user = await get_current_user(request, db)

    update = {}
    if data.username:
        existing = await db.users.find_one(
            {"username": data.username, "id": {"$ne": user["id"]}}, {"_id": 0}
        )
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        update["username"] = data.username

    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})

    updated_user = await db.users.find_one(
        {"id": user["id"]}, {"_id": 0, "password_hash": 0}
    )
    return UserResponse(**updated_user)


@router.post("/avatar")
async def upload_avatar(data: dict, request: Request):
    user = await get_current_user(request, db)

    avatar_data = data.get("avatar", "")
    if not avatar_data:
        raise HTTPException(status_code=400, detail="No avatar data provided")

    if not avatar_data.startswith("data:image/"):
        raise HTTPException(status_code=400, detail="Invalid image format")

    if len(avatar_data) > 700_000:
        raise HTTPException(status_code=400, detail="Image too large. Max 500KB.")

    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"avatar": avatar_data}}
    )

    return {"message": "Avatar updated"}


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