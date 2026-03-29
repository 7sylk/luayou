from fastapi import APIRouter, HTTPException, Request
from models import QuizSubmission, QuizResult
from database import db
from utils import get_current_user, calculate_level, check_badges

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

    if xp_earned > 0:
        new_xp = user.get("xp", 0) + xp_earned
        new_level = calculate_level(new_xp)
        update = {"xp": new_xp, "level": new_level}

        if correct == total:
            update["perfect_quizzes"] = user.get("perfect_quizzes", 0) + 1

        temp_user = {**user, **update}
        badges, new_badges = check_badges(temp_user)
        if new_badges:
            update["badges"] = badges

        await db.users.update_one({"id": user["id"]}, {"$set": update})

    return QuizResult(
        score=correct, total=total, xp_earned=xp_earned, results=results
    )
