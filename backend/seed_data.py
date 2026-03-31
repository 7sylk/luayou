import uuid
import os
from datetime import datetime, timezone

LESSONS = [

# =========================================================
# 🟢 STAGE 1: ABSOLUTE BASICS
# =========================================================

{
    "id": "lesson-01",
    "title": "What is Lua?",
    "difficulty": "beginner",
    "order_index": 1,
    "xp_reward": 40,
    "content": "Lua is a lightweight programming language used in games like Roblox.\n\nPrograms run top to bottom. The simplest function is print().",
    "code_examples": "print('Hello World')",
    "challenge_description": "Print exactly: Hello World",
    "challenge_starter_code": "",
    "challenge_expected_output": "Hello World",
},

{
    "id": "lesson-02",
    "title": "Your First Code",
    "difficulty": "beginner",
    "order_index": 2,
    "xp_reward": 40,
    "content": "Code runs line by line. print() shows output.\nEverything inside quotes is text.",
    "code_examples": "print('Lua is fun')",
    "challenge_description": "Print: I am learning Lua",
    "challenge_starter_code": "",
    "challenge_expected_output": "I am learning Lua",
},

{
    "id": "lesson-03",
    "title": "Comments",
    "difficulty": "beginner",
    "order_index": 3,
    "xp_reward": 40,
    "content": "Comments are ignored by Lua.\nUse -- for single-line comments.",
    "code_examples": "-- this is a comment\nprint('Hi')",
    "challenge_description": "Add a comment and print Learning Lua",
    "challenge_starter_code": "",
    "challenge_expected_output": "Learning Lua",
},

# =========================================================
# 🟡 STAGE 2: VARIABLES (CORE FOUNDATION)
# =========================================================

{
    "id": "lesson-04",
    "title": "Variables Explained",
    "difficulty": "beginner",
    "order_index": 4,
    "xp_reward": 60,
    "content": "Variables store values.\nWe use local to create them.\nExample: local name = 'John'",
    "code_examples": "local name = 'Lua'\nprint(name)",
    "challenge_description": "Create a variable called language with value Lua and print it.",
    "challenge_starter_code": "",
    "challenge_expected_output": "Lua",
},

{
    "id": "lesson-05",
    "title": "Numbers & Math",
    "difficulty": "beginner",
    "order_index": 5,
    "xp_reward": 60,
    "content": "Lua supports + - * / %\nMath works like normal arithmetic.",
    "code_examples": "print(5 + 5)\nprint(10 * 2)",
    "challenge_description": "Print the result of 12 * 3",
    "challenge_starter_code": "",
    "challenge_expected_output": "36",
},

{
    "id": "lesson-06",
    "title": "String Basics",
    "difficulty": "beginner",
    "order_index": 6,
    "xp_reward": 60,
    "content": "Strings are text inside quotes.\nYou can combine them using ..",
    "code_examples": "print('Hello ' .. 'World')",
    "challenge_description": "Join 'Lua' and 'Coding' with a space",
    "challenge_starter_code": "",
    "challenge_expected_output": "Lua Coding",
},

# =========================================================
# 🟠 STAGE 3: LOGIC (REAL THINKING)
# =========================================================

{
    "id": "lesson-07",
    "title": "If Statements",
    "difficulty": "intermediate",
    "order_index": 7,
    "xp_reward": 80,
    "content": "If statements let your program make decisions.",
    "code_examples": "local age = 18\nif age >= 18 then\n print('Adult')\nend",
    "challenge_description": "If score is 50 or more, print Pass",
    "challenge_starter_code": "local score = 60",
    "challenge_expected_output": "Pass",
},

{
    "id": "lesson-08",
    "title": "Else Statements",
    "difficulty": "intermediate",
    "order_index": 8,
    "xp_reward": 80,
    "content": "Else runs when the if condition is false.",
    "code_examples": "if 5 > 10 then print('yes') else print('no') end",
    "challenge_description": "If health is 0 print Dead, else Alive",
    "challenge_starter_code": "local health = 100",
    "challenge_expected_output": "Alive",
},

{
    "id": "lesson-09",
    "title": "Comparison Operators",
    "difficulty": "intermediate",
    "order_index": 9,
    "xp_reward": 80,
    "content": "== equal, ~= not equal, > < >= <=",
    "code_examples": "if 10 == 10 then print('true') end",
    "challenge_description": "Check if level equals 10 and print Max Level",
    "challenge_starter_code": "local level = 10",
    "challenge_expected_output": "Max Level",
},

# =========================================================
# 🟣 STAGE 4: LOOPS (REPETITION POWER)
# =========================================================

{
    "id": "lesson-10",
    "title": "For Loops",
    "difficulty": "intermediate",
    "order_index": 10,
    "xp_reward": 90,
    "content": "Loops repeat code automatically.",
    "code_examples": "for i = 1, 3 do\n print(i)\nend",
    "challenge_description": "Print numbers 1 to 5",
    "challenge_starter_code": "",
    "challenge_expected_output": "1\n2\n3\n4\n5",
},

{
    "id": "lesson-11",
    "title": "While Loops",
    "difficulty": "intermediate",
    "order_index": 11,
    "xp_reward": 90,
    "content": "While loops repeat while a condition is true.",
    "code_examples": "local i = 1\nwhile i <= 3 do\n print(i)\n i = i + 1\nend",
    "challenge_description": "Print 1 to 3 using a while loop",
    "challenge_starter_code": "",
    "challenge_expected_output": "1\n2\n3",
},

# =========================================================
# 🔵 STAGE 5: FUNCTIONS (REUSABLE CODE)
# =========================================================

{
    "id": "lesson-12",
    "title": "Functions Basics",
    "difficulty": "intermediate",
    "order_index": 12,
    "xp_reward": 100,
    "content": "Functions let you reuse code.",
    "code_examples": "function greet()\n print('Hi')\nend\n\ngreet()",
    "challenge_description": "Create a function that prints Hello Lua",
    "challenge_starter_code": "",
    "challenge_expected_output": "Hello Lua",
},

{
    "id": "lesson-13",
    "title": "Function Parameters",
    "difficulty": "intermediate",
    "order_index": 13,
    "xp_reward": 110,
    "content": "Parameters pass data into functions.",
    "code_examples": "function add(a,b)\n print(a+b)\nend\nadd(2,3)",
    "challenge_description": "Create a function that multiplies two numbers and prints result",
    "challenge_starter_code": "",
    "challenge_expected_output": "20",
},

# =========================================================
# 🟤 STAGE 6: TABLES (MOST IMPORTANT LUA SKILL)
# =========================================================

{
    "id": "lesson-14",
    "title": "Tables (Arrays)",
    "difficulty": "advanced",
    "order_index": 14,
    "xp_reward": 120,
    "content": "Tables store multiple values.",
    "code_examples": "local fruits = {'apple','banana','cherry'}\nprint(fruits[1])",
    "challenge_description": "Print the second item in the table",
    "challenge_starter_code": "local items = {'A','B','C'}",
    "challenge_expected_output": "B",
},

{
    "id": "lesson-15",
    "title": "Tables (Key-Value)",
    "difficulty": "advanced",
    "order_index": 15,
    "xp_reward": 130,
    "content": "Tables can act like dictionaries.",
    "code_examples": "local player = {name='John'}\nprint(player.name)",
    "challenge_description": "Create a table with name = Lua and print it",
    "challenge_starter_code": "",
    "challenge_expected_output": "Lua",
},

# =========================================================
# 🔴 STAGE 7: REAL GAME DEV INTRO
# =========================================================

{
    "id": "lesson-16",
    "title": "Intro to Game Scripting",
    "difficulty": "advanced",
    "order_index": 16,
    "xp_reward": 150,
    "content": "Lua is used in Roblox to control game behavior.\nScripts can control objects, players, and events.",
    "code_examples": "-- Roblox example concept\nprint('Game started')",
    "challenge_description": "Print Game Started",
    "challenge_starter_code": "",
    "challenge_expected_output": "Game Started",
},

]

DAILY_TEMPLATES = [
    {
        "id": "daily-t-01",
        "title": "FizzBuzz",
        "description": "Print 'FizzBuzz' - a classic programming challenge. For this simplified version, just print the word FizzBuzz.",
        "starter_code": "-- Print FizzBuzz\n",
        "difficulty": "beginner",
        "xp_reward": 75,
        "expected_output": "FizzBuzz",
    },
    {
        "id": "daily-t-02",
        "title": "Reverse Greeting",
        "description": "Print the string 'olleH' (Hello reversed).",
        "starter_code": "-- Print a reversed greeting\n",
        "difficulty": "beginner",
        "xp_reward": 75,
        "expected_output": "olleH",
    },
    {
        "id": "daily-t-03",
        "title": "Sum Challenge",
        "description": "Print the sum of 15 + 27.",
        "starter_code": "-- Calculate and print the sum\n",
        "difficulty": "beginner",
        "xp_reward": 75,
        "expected_output": "42",
    },
    {
        "id": "daily-t-04",
        "title": "String Builder",
        "description": "Concatenate 'Lua' and 'You' with a space and print 'Lua You'.",
        "starter_code": "-- Build a string\n",
        "difficulty": "beginner",
        "xp_reward": 75,
        "expected_output": "Lua You",
    },
    {
        "id": "daily-t-05",
        "title": "Power Play",
        "description": "Calculate and print 2 to the power of 10 (1024).",
        "starter_code": "-- Calculate a power\n",
        "difficulty": "intermediate",
        "xp_reward": 100,
        "expected_output": "1024",
    },
    {
        "id": "daily-t-06",
        "title": "Type Check",
        "description": "Print the word 'string' (the type of text values in Lua).",
        "starter_code": "-- What type is a text value?\n",
        "difficulty": "beginner",
        "xp_reward": 75,
        "expected_output": "string",
    },
    {
        "id": "daily-t-07",
        "title": "Lua Version",
        "description": "Print '5.4' - the latest major Lua version.",
        "starter_code": "-- What's the latest Lua version?\n",
        "difficulty": "beginner",
        "xp_reward": 75,
        "expected_output": "5.4",
    },
]

QUIZZES = []


async def seed_database(db):
    existing = await db.lessons.count_documents({})
    if existing > 0:
        return

    for lesson in LESSONS:
        await db.lessons.insert_one({**lesson})

    for quiz in QUIZZES:
        await db.quizzes.insert_one({**quiz})

    for template in DAILY_TEMPLATES:
        await db.daily_templates.insert_one({**template})

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.users.create_index([("xp", -1)])
    await db.lessons.create_index("id", unique=True)
    await db.lessons.create_index("order_index")
    await db.user_progress.create_index([("user_id", 1), ("lesson_id", 1)], unique=True)
    await db.quizzes.create_index("lesson_id")
    await db.daily_challenges.create_index("date")
    await db.user_daily.create_index([("user_id", 1), ("date", 1)], unique=True)
    await db.daily_templates.create_index("id")
    await db.email_verifications.create_index("email", unique=True)
    await db.password_resets.create_index("email", unique=True)

    # Seed admin user
    from utils import hash_password

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@luayou.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    admin_exists = await db.users.find_one({"email": admin_email})
    if not admin_exists:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "username": "Admin",
            "avatar": "default",
            "xp": 500,
            "level": 3,
            "streak": 5,
            "badges": ["first_lesson", "xp_500"],
            "lessons_completed": 3,
            "daily_completed": 2,
            "perfect_quizzes": 1,
            "last_active": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(admin_doc)
