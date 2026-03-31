from dotenv import load_dotenv
load_dotenv()
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os
import logging

from database import db, client
from seed_data import seed_database

from routes.auth import router as auth_router
from routes.lessons import router as lessons_router
from routes.quiz import router as quiz_router
from routes.daily import router as daily_router
from routes.leaderboard import router as leaderboard_router
from routes.ai_tutor import router as ai_tutor_router
from routes.code import router as code_router
from routes.user import router as user_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await seed_database(db)
    logger.info("LuaYou database seeded")
    yield
    client.close()


app = FastAPI(title="LuaYou API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(lessons_router)
app.include_router(quiz_router)
app.include_router(daily_router)
app.include_router(leaderboard_router)
app.include_router(ai_tutor_router)
app.include_router(code_router)
app.include_router(user_router)