import hashlib
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request, Response

from database import db
from email_service import (
    send_password_reset_code,
    send_verification_code,
    send_welcome_email,
    smtp_is_configured,
)
from models import AuthResponse, UserCreate, UserLogin, UserResponse
from utils import (
    clear_auth_cookie,
    create_token,
    get_client_ip,
    get_current_user,
    get_jwt_secret,
    hash_password,
    normalize_username,
    serialize_user,
    set_auth_cookie,
    validate_username,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

PASSWORD_RE = re.compile(r"^.{6,128}$")
RESET_CODE_WINDOW_MINUTES = 15
VERIFY_CODE_WINDOW_MINUTES = 15


def _verification_required() -> bool:
    return os.environ.get("REQUIRE_EMAIL_VERIFICATION", "true").strip().lower() in ("1", "true", "yes")


def _verification_enforced() -> bool:
    return _verification_required() and smtp_is_configured()


def _make_code() -> str:
    return f"{secrets.randbelow(100_000_000):08d}"


def _hash_code(code: str, purpose: str) -> str:
    payload = f"{purpose}:{code}:{get_jwt_secret()}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _parse_iso(value: str) -> datetime:
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value)


def _validate_password(password: str) -> None:
    if not PASSWORD_RE.match(password or ""):
        raise HTTPException(
            status_code=400,
            detail="Password must be between 6 and 128 characters.",
        )


async def _enforce_rate_limit(request: Request, bucket: str, limit: int, window_seconds: int, identity: str = "") -> None:
    ip = get_client_ip(request)
    key = f"{bucket}:{ip}:{identity.strip().lower()}"
    now = datetime.now(timezone.utc)
    existing = await db.auth_rate_limits.find_one({"key": key}, {"_id": 0})

    if existing:
        expires_at = _parse_iso(existing["expires_at"])
        if expires_at > now and existing.get("count", 0) >= limit:
            retry_after = max(1, int((expires_at - now).total_seconds()))
            raise HTTPException(
                status_code=429,
                detail="Too many attempts. Please wait a bit and try again.",
                headers={"Retry-After": str(retry_after)},
            )

        if expires_at > now:
            await db.auth_rate_limits.update_one(
                {"key": key},
                {"$inc": {"count": 1}},
            )
            return

    expires_at = now + timedelta(seconds=window_seconds)
    await db.auth_rate_limits.update_one(
        {"key": key},
        {
            "$set": {
                "key": key,
                "count": 1,
                "expires_at": expires_at,
                "updated_at": now,
            }
        },
        upsert=True,
    )


async def _issue_code(collection, email: str, username: str, purpose: str, window_minutes: int, sender) -> None:
    code = _make_code()
    now = datetime.now(timezone.utc).isoformat()
    expires = (datetime.now(timezone.utc) + timedelta(minutes=window_minutes)).isoformat()
    await collection.update_one(
        {"email": email},
        {
            "$set": {
                "code_hash": _hash_code(code, purpose),
                "expires": expires,
                "used": False,
                "attempts": 0,
                "created_at": now,
            }
        },
        upsert=True,
    )
    sender(email, username, code)


@router.post("/register")
async def register(data: UserCreate, request: Request):
    await _enforce_rate_limit(request, "register", limit=5, window_seconds=15 * 60)
    if not data.email or not data.password or not data.username:
        raise HTTPException(status_code=400, detail="All fields are required")
    _validate_password(data.password)

    email = data.email.lower().strip()
    username = validate_username(data.username)
    username_normalized = normalize_username(username)

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = await db.users.find_one({"username_normalized": username_normalized})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(data.password),
        "username": username,
        "username_normalized": username_normalized,
        "avatar": "default",
        "bio": "",
        "xp": 0,
        "level": 1,
        "streak": 1,
        "badges": [],
        "lessons_completed": 0,
        "daily_completed": 0,
        "perfect_quizzes": 0,
        "email_verified": not _verification_enforced(),
        "role": "user",
        "last_active": now,
        "created_at": now,
    }

    try:
        await db.users.insert_one(user_doc)
        if _verification_enforced():
            await _issue_code(
                db.email_verifications,
                email,
                username,
                "verify",
                VERIFY_CODE_WINDOW_MINUTES,
                send_verification_code,
            )
    except Exception:
        await db.users.delete_one({"id": user_id})
        await db.email_verifications.delete_one({"email": email})
        raise HTTPException(status_code=500, detail="Unable to send verification email")

    if _verification_enforced():
        return {"message": "Account created. Check your email for the verification code."}
    return {"message": "Account created successfully."}


@router.post("/login", response_model=AuthResponse)
async def login(data: UserLogin, request: Request, response: Response):
    await _enforce_rate_limit(request, "login", limit=10, window_seconds=15 * 60, identity=data.email or "")
    user = await db.users.find_one({"email": data.email.lower().strip()}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if _verification_enforced() and not user.get("email_verified", False):
        raise HTTPException(status_code=403, detail="Email not verified. Please verify your email first.")

    now = datetime.now(timezone.utc)
    last_active = user.get("last_active")
    streak = user.get("streak", 0)

    if last_active:
        try:
            last_dt = _parse_iso(last_active)
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
    set_auth_cookie(response, token)
    user_response = serialize_user(user, request)
    return AuthResponse(token=None, user=UserResponse(**user_response))


@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def me(request: Request):
    user = await get_current_user(request, db)
    return UserResponse(**serialize_user(user, request))


@router.post("/forgot-password")
async def forgot_password(data: dict, request: Request):
    email = data.get("email", "").lower().strip()
    await _enforce_rate_limit(request, "forgot-password", limit=5, window_seconds=60 * 60, identity=email)
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not smtp_is_configured():
        raise HTTPException(status_code=503, detail="Password reset email is not configured")

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        return {"message": "If that email exists, a reset code has been sent."}

    try:
        await _issue_code(
            db.password_resets,
            email,
            user.get("username", "there"),
            "reset",
            RESET_CODE_WINDOW_MINUTES,
            send_password_reset_code,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Unable to send reset email")

    return {"message": "If that email exists, a reset code has been sent."}


@router.post("/reset-password")
async def reset_password(data: dict, request: Request):
    token = data.get("token", "").strip()
    new_password = data.get("password", "")
    await _enforce_rate_limit(request, "reset-password", limit=8, window_seconds=15 * 60)

    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required")
    _validate_password(new_password)

    reset = await db.password_resets.find_one({"code_hash": _hash_code(token, "reset")}, {"_id": 0})
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if reset.get("used"):
        raise HTTPException(status_code=400, detail="Reset token already used")
    if reset.get("attempts", 0) >= 5:
        raise HTTPException(status_code=429, detail="Too many reset attempts. Request a new code.")

    expires = _parse_iso(reset["expires"])
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    await db.users.update_one(
        {"email": reset["email"]},
        {"$set": {"password_hash": hash_password(new_password)}},
    )
    await db.password_resets.update_one(
        {"email": reset["email"]},
        {"$set": {"used": True}, "$inc": {"attempts": 1}},
    )

    return {"message": "Password reset successfully"}


@router.post("/verify-email")
async def verify_email(data: dict, request: Request):
    email = data.get("email", "").lower().strip()
    code = data.get("code", "").strip()
    await _enforce_rate_limit(request, "verify-email", limit=8, window_seconds=15 * 60, identity=email)
    if not email or not code:
        raise HTTPException(status_code=400, detail="Email and code are required")

    verification = await db.email_verifications.find_one({"email": email}, {"_id": 0})
    if not verification:
        raise HTTPException(status_code=400, detail="Verification code not found")
    if verification.get("used"):
        raise HTTPException(status_code=400, detail="Verification code already used")
    if verification.get("attempts", 0) >= 5:
        raise HTTPException(status_code=429, detail="Too many verification attempts. Request a new code.")

    if verification.get("code_hash") != _hash_code(code, "verify"):
        await db.email_verifications.update_one({"email": email}, {"$inc": {"attempts": 1}})
        raise HTTPException(status_code=400, detail="Invalid verification code")

    expires = _parse_iso(verification["expires"])
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Verification code has expired")

    await db.users.update_one({"email": email}, {"$set": {"email_verified": True}})
    await db.email_verifications.update_one(
        {"email": email},
        {"$set": {"used": True}, "$inc": {"attempts": 1}},
    )
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user:
        try:
            send_welcome_email(email, user.get("username", "there"))
        except Exception:
            pass
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(data: dict, request: Request):
    email = data.get("email", "").lower().strip()
    await _enforce_rate_limit(request, "resend-verification", limit=5, window_seconds=60 * 60, identity=email)
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not _verification_enforced():
        await db.users.update_one({"email": email}, {"$set": {"email_verified": True}})
        return {"message": "Email verification is currently disabled for this environment."}

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        return {"message": "If that email exists, a verification code has been sent."}
    if user.get("email_verified", False):
        return {"message": "Email is already verified."}

    try:
        await _issue_code(
            db.email_verifications,
            email,
            user.get("username", "there"),
            "verify",
            VERIFY_CODE_WINDOW_MINUTES,
            send_verification_code,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Unable to send verification email")
    return {"message": "If that email exists, a verification code has been sent."}
