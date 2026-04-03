from fastapi import APIRouter, Request
from database import db
from utils import get_current_user, serialize_user

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("")
async def get_leaderboard(request: Request):
    await get_current_user(request, db)

    users = (
        await db.users.find({}, {"_id": 0, "password_hash": 0})
        .sort("xp", -1)
        .limit(50)
        .to_list(50)
    )

    result = []
    for i, u in enumerate(users):
        serialized = serialize_user(u, request)
        result.append(
            {
                "rank": i + 1,
                "id": serialized.get("id"),
                "username": serialized.get("username", "Unknown"),
                "xp": serialized.get("xp", 0),
                "level": serialized.get("level", 1),
                "avatar": serialized.get("avatar", "default"),
            }
        )

    return result
