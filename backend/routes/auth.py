from fastapi import APIRouter, HTTPException, Request
from models import UserCreate, UserLogin, UserResponse, AuthResponse
from database import db
from utils import hash_password, verify_password, create_token, get_current_user, calculate_level
import uuid
from datetime import datetime, timezone, timedelta
import random
import os
from email_service import send_verification_code, send_password_reset_code, send_welcome_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _verification_required() -> bool:
    return os.environ.get("REQUIRE_EMAIL_VERIFICATION", "true").strip().lower() in ("1", "true", "yes")


def _make_code() -> str:
    return f"{random.randint(0, 999999):06d}"


@router.post("/register")
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
        "email_verified": False,
        "last_active": now,
        "created_at": now,
    }

    verify_code = _make_code()
    verify_expires = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    try:
        await db.users.insert_one(user_doc)
        await db.email_verifications.update_one(
            {"email": data.email.lower()},
            {
                "$set": {
                    "code": verify_code,
                    "expires": verify_expires,
                    "used": False,
                    "created_at": now,
                }
            },
            upsert=True,
        )
        send_verification_code(data.email.lower(), data.username, verify_code)
    except Exception:
        await db.users.delete_one({"id": user_id})
        await db.email_verifications.delete_one({"email": data.email.lower()})
        raise HTTPException(status_code=500, detail="Unable to send verification email")
    return {"message": "Account created. Check your email for verification code."}


@router.post("/login", response_model=AuthResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if _verification_required() and not user.get("email_verified", False):
        raise HTTPException(status_code=403, detail="Email not verified. Please verify your email first.")

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
        return {"message": "If that email exists, a reset code has been sent."}

    reset_code = _make_code()
    expires = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

    await db.password_resets.update_one(
        {"email": email},
        {"$set": {"code": reset_code, "expires": expires, "used": False}},
        upsert=True,
    )
    try:
        send_password_reset_code(email, user.get("username", "there"), reset_code)
    except Exception:
        raise HTTPException(status_code=500, detail="Unable to send reset email")

    return {"message": "If that email exists, a reset code has been sent."}


@router.post("/reset-password")
async def reset_password(data: dict):
    token = data.get("token", "")
    new_password = data.get("password", "")

    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    reset = await db.password_resets.find_one({"code": token}, {"_id": 0})
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
    await db.password_resets.update_one({"code": token}, {"$set": {"used": True}})

    return {"message": "Password reset successfully"}


@router.post("/verify-email")
async def verify_email(data: dict):
    email = data.get("email", "").lower().strip()
    code = data.get("code", "").strip()
    if not email or not code:
        raise HTTPException(status_code=400, detail="Email and code are required")

    verification = await db.email_verifications.find_one({"email": email}, {"_id": 0})
    if not verification:
        raise HTTPException(status_code=400, detail="Verification code not found")
    if verification.get("used"):
        raise HTTPException(status_code=400, detail="Verification code already used")
    if verification.get("code") != code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    expires = datetime.fromisoformat(verification["expires"])
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Verification code has expired")

    await db.users.update_one({"email": email}, {"$set": {"email_verified": True}})
    await db.email_verifications.update_one({"email": email}, {"$set": {"used": True}})
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user:
        try:
            send_welcome_email(email, user.get("username", "there"))
        except Exception:
            pass
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(data: dict):
    email = data.get("email", "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        return {"message": "If that email exists, a verification code has been sent."}
    if user.get("email_verified", False):
        return {"message": "Email is already verified."}

    code = _make_code()
    expires = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    await db.email_verifications.update_one(
        {"email": email},
        {"$set": {"code": code, "expires": expires, "used": False}},
        upsert=True,
    )
    try:
        send_verification_code(email, user.get("username", "there"), code)
    except Exception:
        raise HTTPException(status_code=500, detail="Unable to send verification email")
    return {"message": "If that email exists, a verification code has been sent."}