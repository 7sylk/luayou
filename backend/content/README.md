## Curriculum Workflow

Lesson content now lives in [curriculum.json](/C:/Users/jantz/Documents/luayou/luayou/backend/content/curriculum.json) instead of inside backend seed code.

### What To Edit

- `lessons`: the main course lessons
- `daily_templates`: the rotating daily challenges
- `quizzes`: quiz data

### Lesson Shape

Each lesson includes:

- `id`
- `title`
- `difficulty`
- `order_index`
- `xp_reward`
- `content`
- `code_examples`
- `challenge_description`
- `challenge_starter_code`
- `challenge_expected_output`

### Recommended Workflow

1. Edit [curriculum.json](/C:/Users/jantz/Documents/luayou/luayou/backend/content/curriculum.json)
2. Restart the backend
3. The seeder will insert any missing lessons automatically
4. Refresh the app and verify the lesson order/content

### Full Rewrite Workflow

If you are replacing or rewriting existing lessons, run:

```powershell
cd C:\Users\jantz\Documents\luayou\luayou\backend
.\venv\Scripts\python.exe sync_curriculum.py --mode overwrite
```

If you only want to add brand-new lessons without touching existing records, run:

```powershell
cd C:\Users\jantz\Documents\luayou\luayou\backend
.\venv\Scripts\python.exe sync_curriculum.py --mode insert-missing
```

### Important Note

The startup sync only adds missing curriculum items with `setOnInsert`. That means:

- new lessons are added automatically
- existing lesson records are not overwritten automatically

That is safer for production data, but if you want to rewrite every lesson later, we should add an explicit "sync and overwrite curriculum" command instead of doing that silently on every startup.
