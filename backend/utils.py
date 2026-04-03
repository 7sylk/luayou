import math
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import HTTPException, Request, Response


AUTH_COOKIE_NAME = "luayou_session"
USERNAME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_.]{2,23}$")
USERNAME_RESERVED = {
    "dashboard",
    "lessons",
    "leaderboard",
    "profile",
    "settings",
    "developer",
    "login",
    "signup",
    "register",
    "admin",
    "api",
    "progress",
}
USERNAME_BLOCKLIST = {
    "admin",
    "asshole",
    "bastard",
    "bitch",
    "cock",
    "cunt",
    "damn",
    "dick",
    "fag",
    "fuck",
    "hitler",
    "motherfucker",
    "nazi",
    "nigger",
    "penis",
    "porn",
    "pussy",
    "rape",
    "retard",
    "sex",
    "shit",
    "slut",
    "suicide",
    "whore",
}


def get_jwt_secret():
    return os.environ["JWT_SECRET"]


def normalize_username(username: str) -> str:
    return (username or "").strip().lower()


def validate_username(username: str) -> str:
    cleaned = (username or "").strip()
    normalized = normalize_username(cleaned)

    if not cleaned:
        raise HTTPException(status_code=400, detail="Username is required")
    if " " in cleaned:
        raise HTTPException(status_code=400, detail="Username cannot contain spaces")
    if len(cleaned) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(cleaned) > 24:
        raise HTTPException(status_code=400, detail="Username must be 24 characters or fewer")
    if not USERNAME_RE.match(cleaned):
        raise HTTPException(
            status_code=400,
            detail="Username must start with a letter and use only letters, numbers, underscores, or periods.",
        )
    if normalized in USERNAME_RESERVED:
        raise HTTPException(status_code=400, detail="That username is reserved")
    if any(blocked in normalized for blocked in USERNAME_BLOCKLIST):
        raise HTTPException(status_code=400, detail="Please choose a different username")

    return cleaned


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


def auth_cookie_secure() -> bool:
    return os.environ.get("AUTH_COOKIE_SECURE", "false").strip().lower() in ("1", "true", "yes")


def auth_cookie_samesite() -> str:
    raw = os.environ.get("AUTH_COOKIE_SAMESITE", "lax").strip().lower()
    if raw not in {"lax", "strict", "none"}:
        return "lax"
    return raw


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=auth_cookie_secure(),
        samesite=auth_cookie_samesite(),
        max_age=7 * 24 * 60 * 60,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        httponly=True,
        secure=auth_cookie_secure(),
        samesite=auth_cookie_samesite(),
        path="/",
    )


def _get_request_token(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]

    cookie_token = request.cookies.get(AUTH_COOKIE_NAME, "")
    if cookie_token:
        return cookie_token

    raise HTTPException(status_code=401, detail="Not authenticated")


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def absolutize_avatar(request: Optional[Request], avatar: str) -> str:
    if not avatar or avatar == "default" or "://" in avatar or not avatar.startswith("/"):
        return avatar
    if request is None:
        return avatar
    return str(request.base_url).rstrip("/") + avatar


def serialize_user(user: dict, request: Optional[Request] = None) -> dict:
    sanitized = {k: v for k, v in user.items() if k != "password_hash"}
    sanitized["avatar"] = absolutize_avatar(request, sanitized.get("avatar", "default"))
    sanitized["role"] = sanitized.get("role", "user")
    sanitized["bio"] = sanitized.get("bio", "")
    return sanitized


def require_admin(user: dict) -> None:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


async def get_current_user(request: Request, db):
    token = _get_request_token(request)
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
