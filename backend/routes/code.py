from fastapi import APIRouter, Request
from models import CodeRequest, CodeResponse
from database import db
from utils import get_current_user
from lua_simulator import simulate_lua

router = APIRouter(prefix="/api/code", tags=["code"])


@router.post("/run", response_model=CodeResponse)
async def run_code(data: CodeRequest, request: Request):
    await get_current_user(request, db)

    expected_output = None
    if data.lesson_id:
        lesson = await db.lessons.find_one({"id": data.lesson_id}, {"_id": 0})
        if lesson:
            expected_output = lesson.get("challenge_expected_output")

    result = simulate_lua(data.code, expected_output)
    return CodeResponse(**result)
