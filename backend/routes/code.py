import re

from fastapi import APIRouter, Request

from database import db
from models import CodeRequest, CodeResponse
from routes.lessons import award_lesson_completion
from utils import get_current_user

router = APIRouter(prefix="/api/code", tags=["code"])


def _normalize_code(code: str) -> str:
    code = code or ""
    code = re.sub(r"--.*?$", "", code, flags=re.MULTILINE)
    return code.strip()


def _contains_assignment(code: str, variable_name: str, value: str) -> bool:
    pattern = rf"\b(local\s+)?{re.escape(variable_name)}\s*=\s*(['\"]){re.escape(value)}\2"
    return re.search(pattern, code) is not None


def _contains_print_variable(code: str, variable_name: str) -> bool:
    pattern = rf"print\s*\(\s*{re.escape(variable_name)}\s*\)"
    return re.search(pattern, code) is not None


def _validate_structure(lesson: dict, code: str) -> str | None:
    normalized = _normalize_code(code)
    title = (lesson.get("title") or "").lower()
    description = (lesson.get("challenge_description") or "").lower()
    starter = lesson.get("challenge_starter_code") or ""

    variable_match = re.search(
        r"create a variable called [`']?([a-zA-Z_][a-zA-Z0-9_]*)[`']? with value [\"']([^\"']+)[\"'] and print it",
        description,
        flags=re.IGNORECASE,
    )
    if variable_match:
        variable_name = variable_match.group(1)
        value = variable_match.group(2)
        if not _contains_assignment(normalized, variable_name, value):
            return f"Create the variable `{variable_name}` with the value \"{value}\"."
        if not _contains_print_variable(normalized, variable_name):
            return f"Print the variable `{variable_name}` instead of hardcoding the answer."
        return None

    if "if " in description or title.startswith("if ") or "conditional" in title:
        if "if" not in normalized or "then" not in normalized:
            return "Use an `if ... then ... end` statement for this challenge."

    if "while loop" in description or title.startswith("while "):
        if "while" not in normalized or "do" not in normalized:
            return "Use a `while` loop for this challenge."

    if "repeat until" in description or "repeat until" in title:
        if "repeat" not in normalized or "until" not in normalized:
            return "Use a `repeat ... until` loop for this challenge."

    if "for loop" in description or "numeric for" in title or title.startswith("for "):
        if not re.search(r"\bfor\b.+\bdo\b", normalized, flags=re.DOTALL):
            return "Use a `for` loop for this challenge."

    if "function" in description or "function" in title:
        if "function" not in normalized:
            return "Define or use a function for this challenge."

    if "table" in description or "table" in title:
        if "{" not in normalized or "}" not in normalized:
            return "Use a Lua table for this challenge."

    if starter.strip() and starter.strip() not in normalized and "local " in starter and "print(" in description:
        starter_var_match = re.search(r"local\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=", starter)
        if starter_var_match and not _contains_print_variable(normalized, starter_var_match.group(1)):
            return f"Use the provided variable `{starter_var_match.group(1)}` in your solution."

    return None


@router.post("/run", response_model=CodeResponse)
async def run_code(data: CodeRequest, request: Request):
    user = await get_current_user(request, db)

    expected_output = None
    lesson = None
    validation_message = None
    lesson_completed = False
    xp_earned = 0
    new_level = None
    new_badges = []

    if data.lesson_id:
        lesson = await db.lessons.find_one({"id": data.lesson_id}, {"_id": 0})
        if lesson:
            expected_output = lesson.get("challenge_expected_output")

    output_matches = (
        data.success is True
        and expected_output is not None
        and (data.output or "").strip() == (expected_output or "").strip()
    )

    if lesson and output_matches:
        validation_message = _validate_structure(lesson, data.code or "")
        if validation_message is None:
            completion = await award_lesson_completion(user, lesson)
            lesson_completed = completion.get("xp_earned", 0) > 0 or completion.get("message") == "Already completed"
            xp_earned = completion.get("xp_earned", 0)
            new_level = completion.get("new_level")
            new_badges = completion.get("new_badges", [])
        else:
            output_matches = False

    return CodeResponse(
        output=data.output or "",
        success=output_matches if expected_output is not None else (data.success if data.success is not None else True),
        error=data.error or None,
        expected_output=expected_output,
        validation_message=validation_message,
        lesson_completed=lesson_completed,
        xp_earned=xp_earned,
        new_level=new_level,
        new_badges=new_badges,
    )
