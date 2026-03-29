from fastapi import APIRouter, Request, HTTPException
from models import AiTutorRequest, AiTutorResponse
from database import db
from utils import get_current_user
import os
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/tutor", response_model=AiTutorResponse)
async def ai_tutor(data: AiTutorRequest, request: Request):
    user = await get_current_user(request, db)

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    lesson_context = ""
    if data.lesson_id:
        lesson = await db.lessons.find_one({"id": data.lesson_id}, {"_id": 0})
        if lesson:
            lesson_context = f"\nCurrent lesson: {lesson['title']} ({lesson['difficulty']})\nLesson topic: {lesson['content'][:500]}"

    user_level = user.get("level", 1)
    user_xp = user.get("xp", 0)

    mode_instructions = {
        "hint": "Provide a helpful hint about what might be wrong or how to approach the problem. Do NOT give the full solution. Be concise and encouraging. Max 3-4 sentences.",
        "explanation": "Explain the error or concept in detail. Use simple language appropriate for the user's level. Include Lua syntax references where relevant.",
        "solution": "Provide the complete corrected solution with a detailed explanation of each change and why it was needed.",
    }

    mode = data.mode if data.mode in mode_instructions else "hint"

    if user_level <= 3:
        complexity = "very simple, beginner-friendly"
    elif user_level <= 7:
        complexity = "moderately detailed"
    else:
        complexity = "advanced and technical"

    system_msg = f"""You are LuaYou AI Tutor, an expert Lua programming teacher.

User Level: {user_level} (XP: {user_xp})
Explanation complexity: {complexity}
{lesson_context}

Mode: {mode}
Instructions: {mode_instructions[mode]}

Format your response in clean markdown. Use ```lua code blocks for Lua code.
Be encouraging and supportive."""

    user_msg = f"My code:\n```lua\n{data.code}\n```"
    if data.error_output:
        user_msg += f"\n\nError/Output:\n```\n{data.error_output}\n```"

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        session_id = f"tutor-{user['id']}-{str(uuid.uuid4())[:8]}"
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_msg,
        )
        chat.with_model("openai", "gpt-5.2")

        response = await chat.send_message(UserMessage(text=user_msg))
        return AiTutorResponse(response=response, mode=mode)

    except Exception as e:
        logger.error(f"AI Tutor error: {e}")
        fallback = "I'm having trouble connecting right now. Here are some general Lua tips:\n\n"
        if data.error_output:
            fallback += f"Looking at your output: `{data.error_output[:200]}`\n\n"
        fallback += "- Check for missing `end` keywords\n- Verify variable names are correct\n- Make sure strings are properly quoted\n- Check function call parentheses\n"
        return AiTutorResponse(response=fallback, mode=mode)
