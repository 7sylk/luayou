from fastapi import APIRouter, HTTPException, Request
from models import QuizSubmission, QuizResult
from database import db
from utils import get_current_user, calculate_level, check_badges
from datetime import datetime, timezone

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.get("/{lesson_id}")
async def get_quiz(lesson_id: str, request: Request):
    await get_current_user(request, db)

    quiz = await db.quizzes.find_one({"lesson_id": lesson_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    safe_questions = []
    for q in quiz["questions"]:
        safe_questions.append(
            {
                "question": q["question"],
                "options": q["options"],
            }
        )

    return {
        "id": quiz["id"],
        "lesson_id": quiz["lesson_id"],
        "questions": safe_questions,
    }


@router.post("/submit")
async def submit_quiz(data: QuizSubmission, request: Request):
    user = await get_current_user(request, db)

    quiz = await db.quizzes.find_one({"id": data.quiz_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = quiz["questions"]
    if len(data.answers) != len(questions):
        raise HTTPException(status_code=400, detail="Wrong number of answers")

    correct = 0
    results = []
    for q, a in zip(questions, data.answers):
        is_correct = a == q["correct"]
        if is_correct:
            correct += 1
        results.append(
            {
                "question": q["question"],
                "your_answer": a,
                "correct_answer": q["correct"],
                "is_correct": is_correct,
                "explanation": q["explanation"],
            }
        )

    total = len(questions)
    score_pct = correct / total if total > 0 else 0
    xp_earned = int(score_pct * 30)
    now = datetime.now(timezone.utc).isoformat()
    previous_result = await db.user_quiz_results.find_one(
        {"user_id": user["id"], "quiz_id": data.quiz_id},
        {"_id": 0},
    )
    already_rewarded = bool(previous_result and previous_result.get("xp_awarded", 0) > 0)
    already_perfect = bool(previous_result and previous_result.get("perfect_score"))

    awarded_xp = 0
    if xp_earned > 0 and not already_rewarded:
        new_xp = user.get("xp", 0) + xp_earned
        new_level = calculate_level(new_xp)
        update = {"xp": new_xp, "level": new_level}
        awarded_xp = xp_earned

        if correct == total and not already_perfect:
            update["perfect_quizzes"] = user.get("perfect_quizzes", 0) + 1

        temp_user = {**user, **update}
        badges, new_badges = check_badges(temp_user)
        if new_badges:
            update["badges"] = badges

        await db.users.update_one({"id": user["id"]}, {"$set": update})
    else:
        new_badges = []

    await db.user_quiz_results.update_one(
        {"user_id": user["id"], "quiz_id": data.quiz_id},
        {
            "$set": {
                "lesson_id": data.lesson_id,
                "score": correct,
                "total": total,
                "last_submitted_at": now,
                "perfect_score": correct == total,
            },
            "$setOnInsert": {
                "first_submitted_at": now,
                "xp_awarded": awarded_xp,
            },
        },
        upsert=True,
    )

    return QuizResult(
        score=correct, total=total, xp_earned=awarded_xp, results=results
    )
