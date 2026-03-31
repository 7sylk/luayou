from fastapi import APIRouter, HTTPException, Request
from database import db
from utils import get_current_user, calculate_level, check_badges
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/daily", tags=["daily"])


@router.get("")
async def get_daily_challenge(request: Request):
    user = await get_current_user(request, db)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    challenge = await db.daily_challenges.find_one({"date": today}, {"_id": 0})

    if not challenge:
        day_of_year = datetime.now(timezone.utc).timetuple().tm_yday
        templates = await db.daily_templates.find({}, {"_id": 0}).to_list(100)

        if templates:
            template = templates[day_of_year % len(templates)]
            challenge = {**template, "date": today}
            await db.daily_challenges.insert_one({**challenge})
            challenge.pop("_id", None)
        else:
            raise HTTPException(status_code=404, detail="No daily challenge available")

    user_daily = await db.user_daily.find_one(
        {"user_id": user["id"], "date": today}, {"_id": 0}
    )
    challenge["completed"] = bool(user_daily and user_daily.get("completed"))

    return challenge


def _calculate_streak(last_active: str | None, current_streak: int, now: datetime) -> int:
    """Increment streak if last activity was yesterday, reset if more than a day ago."""
    if not last_active:
        return 1
    try:
        last_dt = datetime.fromisoformat(last_active)
        days_diff = (now.date() - last_dt.date()).days
        if days_diff == 0:
            return current_streak  # already active today, no change
        elif days_diff == 1:
            return current_streak + 1  # consecutive day
        else:
            return 1  # streak broken
    except (ValueError, TypeError):
        return 1


@router.post("/complete")
async def complete_daily(request: Request):
    user = await get_current_user(request, db)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    now = datetime.now(timezone.utc)

    existing = await db.user_daily.find_one(
        {"user_id": user["id"], "date": today}, {"_id": 0}
    )
    if existing and existing.get("completed"):
        return {"message": "Already completed today", "xp_earned": 0, "new_badges": []}

    challenge = await db.daily_challenges.find_one({"date": today}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="No daily challenge today")

    xp_reward = challenge.get("xp_reward", 75)

    await db.user_daily.update_one(
        {"user_id": user["id"], "date": today},
        {"$set": {"completed": True, "completed_at": now.isoformat()}},
        upsert=True,
    )

    new_xp = user.get("xp", 0) + xp_reward
    new_level = calculate_level(new_xp)
    new_daily_completed = user.get("daily_completed", 0) + 1

    # Update streak based on daily activity, not just login
    new_streak = _calculate_streak(user.get("last_active"), user.get("streak", 0), now)

    update = {
        "xp": new_xp,
        "level": new_level,
        "daily_completed": new_daily_completed,
        "streak": new_streak,
        "last_active": now.isoformat(),
    }

    temp_user = {**user, **update}
    badges, new_badges = check_badges(temp_user)
    if new_badges:
        update["badges"] = badges

    await db.users.update_one({"id": user["id"]}, {"$set": update})

    return {
        "message": "Daily challenge completed!",
        "xp_earned": xp_reward,
        "new_xp": new_xp,
        "new_level": new_level,
        "new_streak": new_streak,
        "new_badges": new_badges,
    }