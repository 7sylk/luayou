from pydantic import BaseModel
from typing import List, Optional


class UserCreate(BaseModel):
    email: str
    password: str
    username: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    avatar: str = "default"
    bio: str = ""
    xp: int = 0
    level: int = 1
    streak: int = 0
    badges: List[str] = []
    lessons_completed: int = 0
    daily_completed: int = 0
    perfect_quizzes: int = 0
    email_verified: bool = True
    role: str = "user"
    last_active: Optional[str] = None
    created_at: str


class AuthResponse(BaseModel):
    token: Optional[str] = None
    user: UserResponse


class LessonBrief(BaseModel):
    id: str
    title: str
    difficulty: str
    order_index: int
    xp_reward: int
    completed: bool = False
    locked: bool = False


class LessonFull(BaseModel):
    id: str
    title: str
    difficulty: str
    content: str
    code_examples: str
    challenge_description: str
    challenge_starter_code: str
    challenge_expected_output: str
    order_index: int
    xp_reward: int
    completed: bool = False


class QuizSubmission(BaseModel):
    quiz_id: str
    lesson_id: str
    answers: List[int]


class QuizResult(BaseModel):
    score: int
    total: int
    xp_earned: int
    results: list


class CodeRequest(BaseModel):
    code: str
    lesson_id: Optional[str] = None
    output: Optional[str] = None
    success: Optional[bool] = None
    error: Optional[str] = None
    check_only: Optional[bool] = False


class CodeResponse(BaseModel):
    output: str
    success: bool
    error: Optional[str] = None
    expected_output: Optional[str] = None
    validation_message: Optional[str] = None
    lesson_completed: bool = False
    xp_earned: int = 0
    new_level: Optional[int] = None
    new_badges: List[str] = []


class AiTutorRequest(BaseModel):
    code: str
    error_output: Optional[str] = ""
    mode: str = "hint"
    lesson_id: Optional[str] = None


class AiTutorResponse(BaseModel):
    response: str
    mode: str


class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None


class PublicUserResponse(BaseModel):
    id: str
    username: str
    avatar: str = "default"
    bio: str = ""
    xp: int = 0
    level: int = 1
    streak: int = 0
    badges: List[str] = []
    lessons_completed: int = 0
    daily_completed: int = 0
    perfect_quizzes: int = 0
    created_at: str
    is_me: bool = False
    is_friend: bool = False
    incoming_request: bool = False
    outgoing_request: bool = False


class FriendRequestCreate(BaseModel):
    username: str


class AdminUserUpdate(BaseModel):
    username: Optional[str] = None
    xp: Optional[int] = None
    level: Optional[int] = None
    streak: Optional[int] = None
    lessons_completed: Optional[int] = None
    daily_completed: Optional[int] = None
    perfect_quizzes: Optional[int] = None
    badges: Optional[List[str]] = None
