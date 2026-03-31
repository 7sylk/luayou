from fastapi import APIRouter, HTTPException, Request
from models import UserCreate, UserLogin, UserResponse, AuthResponse
from database import db
from utils import hash_password, verify_password, create_token, get_current_user, calculate_level
import uuid
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(data: UserCreate):
    if not data.email or not data.password or not data.username:
        raise HTTPException(status_code=400, detail="All fields are required")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = await db.users.find_one({"username": data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "id": user_id,
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "username": data.username,
        "avatar": "default",
        "xp": 0,
        "level": 1,
        "streak": 1,
        "badges": [],
        "lessons_completed": 0,
        "daily_completed": 0,
        "perfect_quizzes": 0,
        "last_active": now,
        "created_at": now,
    }

    await db.users.insert_one(user_doc)
    token = create_token(user_id, data.email.lower())
    user_response = {k: v for k, v in user_doc.items() if k not in ("_id", "password_hash")}
    return AuthResponse(token=token, user=UserResponse(**user_response))


@router.post("/login", response_model=AuthResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    now = datetime.now(timezone.utc)
    last_active = user.get("last_active")
    streak = user.get("streak", 0)

    if last_active:
        try:
            last_dt = datetime.fromisoformat(last_active)
            days_diff = (now.date() - last_dt.date()).days
            if days_diff == 1:
                streak += 1
            elif days_diff > 1:
                streak = 1
        except (ValueError, TypeError):
            streak = 1

    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"streak": streak, "last_active": now.isoformat()}},
    )
    user["streak"] = streak
    user["last_active"] = now.isoformat()

    token = create_token(user["id"], user["email"])
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    return AuthResponse(token=token, user=UserResponse(**user_response))


@router.get("/me", response_model=UserResponse)
async def me(request: Request):
    user = await get_current_user(request, db)
    return UserResponse(**user)


@router.post("/forgot-password")
async def forgot_password(data: dict):
    email = data.get("email", "").lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    user = await db.users.find_one({"email": email}, {"_id": 0})
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If that email exists, a reset token has been generated."}

    reset_token = str(uuid.uuid4())
    expires = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

    await db.password_resets.update_one(
        {"email": email},
        {"$set": {"token": reset_token, "expires": expires, "used": False}},
        upsert=True,
    )

    # In production you'd email this. For now, return it directly.
    return {"message": "Reset token generated.", "reset_token": reset_token}


@router.post("/reset-password")
async def reset_password(data: dict):
    token = data.get("token", "")
    new_password = data.get("password", "")

    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    reset = await db.password_resets.find_one({"token": token}, {"_id": 0})
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if reset.get("used"):
        raise HTTPException(status_code=400, detail="Reset token already used")

    expires = datetime.fromisoformat(reset["expires"])
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    await db.users.update_one(
        {"email": reset["email"]},
        {"$set": {"password_hash": hash_password(new_password)}},
    )
    await db.password_resets.update_one({"token": token}, {"$set": {"used": True}})

    return {"message": "Password reset successfully"}