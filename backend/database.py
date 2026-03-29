from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

mongo_url = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv("DB_NAME")]