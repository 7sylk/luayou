from fastapi import APIRouter, HTTPException, Request
from models import LessonBrief, LessonFull
from database import db
from utils import get_current_user, calculate_level, check_badges
from datetime import datetime, timezone

router = APIRouter(prefix="/api/lessons", tags=["lessons"])


@router.get("")
async def list_lessons(request: Request):
    user = await get_current_user(request, db)

    lessons = await db.lessons.find({}, {"_id": 0}).sort("order_index", 1).to_list(100)
    progress = await db.user_progress.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).to_list(100)
    completed_ids = {p["lesson_id"] for p in progress if p.get("completed")}

    result = []
    for i, lesson in enumerate(lessons):
        completed = lesson["id"] in completed_ids
        locked = False
        if i > 0 and not completed:
            prev_id = lessons[i - 1]["id"]
            if prev_id not in completed_ids:
                locked = True

        result.append(
            LessonBrief(
                id=lesson["id"],
                title=lesson["title"],
                difficulty=lesson["difficulty"],
                order_index=lesson["order_index"],
                xp_reward=lesson["xp_reward"],
                completed=completed,
                locked=locked,
            )
        )

    return result


@router.get("/{lesson_id}")
async def get_lesson(lesson_id: str, request: Request):
    user = await get_current_user(request, db)

    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    progress = await db.user_progress.find_one(
        {"user_id": user["id"], "lesson_id": lesson_id}, {"_id": 0}
    )
    completed = progress.get("completed", False) if progress else False

    return LessonFull(**lesson, completed=completed)


@router.post("/{lesson_id}/complete")
async def complete_lesson(lesson_id: str, request: Request):
    user = await get_current_user(request, db)

    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    existing = await db.user_progress.find_one(
        {"user_id": user["id"], "lesson_id": lesson_id}, {"_id": 0}
    )
    if existing and existing.get("completed"):
        return {"message": "Already completed", "xp_earned": 0, "new_badges": []}

    now = datetime.now(timezone.utc).isoformat()
    xp_reward = lesson["xp_reward"]

    await db.user_progress.update_one(
        {"user_id": user["id"], "lesson_id": lesson_id},
        {"$set": {"completed": True, "completed_at": now}},
        upsert=True,
    )

    new_xp = user.get("xp", 0) + xp_reward
    new_level = calculate_level(new_xp)
    new_lessons_completed = user.get("lessons_completed", 0) + 1

    update_data = {
        "xp": new_xp,
        "level": new_level,
        "lessons_completed": new_lessons_completed,
    }

    temp_user = {**user, **update_data}
    badges, new_badges = check_badges(temp_user)
    if new_badges:
        update_data["badges"] = badges

    await db.users.update_one({"id": user["id"]}, {"$set": update_data})

    return {
        "message": "Lesson completed!",
        "xp_earned": xp_reward,
        "new_xp": new_xp,
        "new_level": new_level,
        "new_badges": new_badges,
    }
