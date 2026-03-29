# LuaYou - Product Requirements Document

## Original Problem Statement
Build "LuaYou" — a gamified platform for learning Lua programming with structured lessons, interactive coding challenges, quizzes, daily challenges, and AI-powered tutoring.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (dark IDE theme)
- **Backend**: FastAPI (Python) + MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key
- **Code Execution**: Simulated Lua evaluation (pattern matching)

## User Personas
1. **Beginner Programmer**: Learning Lua from scratch
2. **Intermediate Developer**: Expanding Lua skills
3. **Gamification Enthusiast**: Motivated by XP, levels, streaks

## Core Requirements
- JWT email/password authentication
- 15 structured Lua lessons (beginner/intermediate/advanced)
- Interactive code editor with simulated execution
- Quiz system with instant grading
- XP/Level/Streak gamification
- Daily challenges with 24h reset
- Global leaderboard
- AI Tutor (hint/explanation/solution modes)

## What's Been Implemented (2026-03-29)
- Full auth system (register, login, JWT tokens)
- 15 Lua lessons with progressive unlocking
- Code editor with Lua simulation
- Quiz system (3 questions per lesson, 15 quizzes total)
- XP/Level system (deterministic formula: level = sqrt(xp/100) + 1)
- 11 badge types with automatic checking
- Daily challenge system (7 rotating templates)
- Global XP leaderboard
- AI Tutor with 3 modes (GPT-5.2 powered)
- 6 pages: Landing, Dashboard, Lessons, LessonDetail, Profile, Leaderboard
- Dark IDE-style UI (JetBrains Mono + IBM Plex Sans, pure B&W)

## Prioritized Backlog
### P0 (Done)
- All core features implemented and tested

### P1 (Next)
- Real Lua execution sandbox (e.g., Fengari or server-side sandboxed Lua)
- User avatar upload system
- Password reset flow
- Mobile-responsive improvements

### P2 (Future)
- Social features (follow users, share progress)
- Community challenges (user-created)
- Achievement system expansion
- Code sharing/snippets
- Course completion certificates
