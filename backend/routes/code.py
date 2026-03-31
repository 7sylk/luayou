from fastapi import APIRouter, Request
from models import CodeRequest, CodeResponse
from database import db
from utils import get_current_user

router = APIRouter(prefix="/api/code", tags=["code"])


@router.post("/run", response_model=CodeResponse)
async def run_code(data: CodeRequest, request: Request):
    await get_current_user(request, db)

    # If client just wants the expected output for local comparison
    expected_output = None
    if data.lesson_id:
        lesson = await db.lessons.find_one({"id": data.lesson_id}, {"_id": 0})
        if lesson:
            expected_output = lesson.get("challenge_expected_output")

    # Execution now happens in the browser via Fengari.
    # Backend only returns expected_output for the frontend to compare locally.
    return CodeResponse(
        output=data.output or "",
        success=data.success if data.success is not None else True,
        error=data.error or None,
        expected_output=expected_output,
    )