import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path


CURRICULUM_PATH = Path(__file__).parent / "content" / "curriculum.json"


def load_curriculum() -> dict:
    with CURRICULUM_PATH.open("r", encoding="utf-8") as fh:
        return json.load(fh)


async def _sync_collection(collection, items, key="id"):
    for item in items:
        await collection.update_one(
            {key: item[key]},
            {"$setOnInsert": {**item}},
            upsert=True,
        )


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
            "avatar": "default",
            "xp": 500,
            "level": 3,
            "streak": 5,
            "badges": ["first_lesson", "xp_500"],
            "lessons_completed": 3,
            "daily_completed": 2,
            "perfect_quizzes": 1,
            "email_verified": True,
            "last_active": now,
            "created_at": now,
        }
        await db.users.insert_one(admin_doc)
    else:
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"email_verified": True}},
        )
