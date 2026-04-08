import argparse
import asyncio
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from seed_data import load_curriculum


async def sync_collection(collection, items, overwrite=False, key="id"):
    for item in items:
        if overwrite:
            await collection.update_one(
                {key: item[key]},
                {"$set": {**item}},
                upsert=True,
            )
        else:
            await collection.update_one(
                {key: item[key]},
                {"$setOnInsert": {**item}},
                upsert=True,
            )


async def prune_collection(collection, items, key="id"):
    valid_keys = [item[key] for item in items if item.get(key)]
    if not valid_keys:
        return
    await collection.delete_many({key: {"$nin": valid_keys}})


async def main():
    parser = argparse.ArgumentParser(description="Sync curriculum content into MongoDB.")
    parser.add_argument(
        "--mode",
        choices=["insert-missing", "overwrite"],
        default="insert-missing",
        help="insert-missing adds only new items; overwrite updates existing items too.",
    )
    args = parser.parse_args()

    load_dotenv()
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    curriculum = load_curriculum()
    overwrite = args.mode == "overwrite"

    await sync_collection(db.lessons, curriculum.get("lessons", []), overwrite=overwrite)
    await sync_collection(db.quizzes, curriculum.get("quizzes", []), overwrite=overwrite)
    await sync_collection(
        db.daily_templates,
        curriculum.get("daily_templates", []),
        overwrite=overwrite,
    )
    await prune_collection(db.lessons, curriculum.get("lessons", []))
    await prune_collection(db.quizzes, curriculum.get("quizzes", []))
    await prune_collection(db.daily_templates, curriculum.get("daily_templates", []))
    await db.user_progress.delete_many(
        {"lesson_id": {"$nin": [lesson["id"] for lesson in curriculum.get("lessons", [])]}}
    )
    await db.user_quiz_results.delete_many(
        {"quiz_id": {"$nin": [quiz["id"] for quiz in curriculum.get("quizzes", [])]}}
    )

    print(f"Curriculum sync complete in mode: {args.mode}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
