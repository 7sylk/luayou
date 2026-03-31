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

    print(f"Curriculum sync complete in mode: {args.mode}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
