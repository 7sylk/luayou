import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from pymongo import UpdateOne

from utils import normalize_username


CURRICULUM_PATH = Path(__file__).parent / "content" / "curriculum.json"


def load_curriculum() -> dict:
    with CURRICULUM_PATH.open("r", encoding="utf-8") as fh:
        return json.load(fh)


async def _sync_collection(collection, items, key="id"):
    operations = [
        UpdateOne({key: item[key]}, {"$setOnInsert": {**item}}, upsert=True)
        for item in items
    ]
    if operations:
        await collection.bulk_write(operations, ordered=False)


async def seed_database(db):
    curriculum = load_curriculum()
    lessons = curriculum.get("lessons", [])
    quizzes = curriculum.get("quizzes", [])
    daily_templates = curriculum.get("daily_templates", [])

    await _sync_collection(db.lessons, lessons)
    await _sync_collection(db.quizzes, quizzes)
    await _sync_collection(db.daily_templates, daily_templates)

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.users.create_index("username_normalized", unique=True)
    await db.users.create_index([("xp", -1)])
    await db.lessons.create_index("id", unique=True)
    await db.lessons.create_index("order_index")
    await db.user_progress.create_index([("user_id", 1), ("lesson_id", 1)], unique=True)
    await db.user_quiz_results.create_index([("user_id", 1), ("quiz_id", 1)], unique=True)
    await db.quizzes.create_index("lesson_id")
    await db.daily_challenges.create_index("date")
    await db.user_daily.create_index([("user_id", 1), ("date", 1)], unique=True)
    await db.daily_templates.create_index("id")
    await db.email_verifications.create_index("email", unique=True)
    await db.password_resets.create_index("email", unique=True)
    await db.auth_rate_limits.create_index("key", unique=True)
    await db.auth_rate_limits.create_index("expires_at", expireAfterSeconds=0)
    await db.friend_requests.create_index([("from_user_id", 1), ("to_user_id", 1)], unique=True)
    await db.friend_requests.create_index("to_user_id")
    await db.friend_requests.create_index("from_user_id")
    await db.friendships.create_index([("user_id", 1), ("friend_user_id", 1)], unique=True)
    await db.friendships.create_index("friend_user_id")

    await db.users.update_many({"bio": {"$exists": False}}, {"$set": {"bio": ""}})
    existing_users = await db.users.find(
        {"username": {"$exists": True}},
        {"_id": 0, "id": 1, "username": 1, "username_normalized": 1},
    ).to_list(2000)
    normalization_ops = []
    for candidate in existing_users:
        desired = normalize_username(candidate.get("username", ""))
        if desired and candidate.get("username_normalized") != desired:
            normalization_ops.append(
                UpdateOne({"id": candidate["id"]}, {"$set": {"username_normalized": desired}})
            )
    if normalization_ops:
        await db.users.bulk_write(normalization_ops, ordered=False)

    # Seed admin user
    from utils import hash_password

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@luayou.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    admin_exists = await db.users.find_one({"email": admin_email})
    if not admin_exists:
        now = datetime.now(timezone.utc).isoformat()
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "username": "Admin",
            "username_normalized": normalize_username("Admin"),
            "avatar": "default",
            "bio": "",
            "xp": 500,
            "level": 3,
            "streak": 5,
            "badges": ["first_lesson", "xp_500"],
            "lessons_completed": 3,
            "daily_completed": 2,
            "perfect_quizzes": 1,
            "email_verified": True,
            "role": "admin",
            "last_active": now,
            "created_at": now,
        }
        await db.users.insert_one(admin_doc)
    else:
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {
                "email_verified": True,
                "role": "admin",
                "username_normalized": normalize_username(admin_exists.get("username", "Admin")),
                "bio": admin_exists.get("bio", ""),
            }},
        )
