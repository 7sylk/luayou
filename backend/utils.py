import jwt
import bcrypt
import os
import math
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException


def get_jwt_secret():
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, get_jwt_secret(), algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(request, db):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    payload = decode_token(token)
    user = await db.users.find_one(
        {"id": payload["sub"]}, {"_id": 0, "password_hash": 0}
    )
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def calculate_level(xp: int) -> int:
    if xp <= 0:
        return 1
    return int(math.sqrt(xp / 100)) + 1


def xp_for_level(level: int) -> int:
    return (level - 1) ** 2 * 100


def xp_for_next_level(current_xp: int) -> int:
    current_level = calculate_level(current_xp)
    return xp_for_level(current_level + 1)


def check_badges(user: dict) -> tuple:
    badges = list(user.get("badges", []))
    xp = user.get("xp", 0)
    streak = user.get("streak", 0)
    lessons_completed = user.get("lessons_completed", 0)
    daily_completed = user.get("daily_completed", 0)

    checks = [
        ("first_lesson", lessons_completed >= 1),
        ("five_lessons", lessons_completed >= 5),
        ("ten_lessons", lessons_completed >= 10),
        ("streak_3", streak >= 3),
        ("streak_7", streak >= 7),
        ("streak_30", streak >= 30),
        ("xp_500", xp >= 500),
        ("xp_1000", xp >= 1000),
        ("xp_5000", xp >= 5000),
        ("daily_5", daily_completed >= 5),
        ("quiz_master", user.get("perfect_quizzes", 0) >= 3),
    ]

    new_badges = []
    for badge_id, condition in checks:
        if condition and badge_id not in badges:
            badges.append(badge_id)
            new_badges.append(badge_id)

    return badges, new_badges
