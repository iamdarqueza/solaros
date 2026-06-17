# SolarOS Prompt Pack Usage Guide

## Recommended Files to Keep in Your Repository

Create a folder like this:

```text
/docs/ai/
  SOLAROS_PRODUCT_CONTEXT.md
  SOLAROS_FRONTEND_PROMPTS.md
  SOLAROS_BACKEND_PROMPTS.md
  SOLAROS_SUPABASE_SCHEMA.md
```

Optional:

```text
/supabase/migrations/
  001_solaros_mvp_schema.sql
```

## Which file should you paste into Sonnet?

### For frontend work

Paste:
1. Base Context from `SOLAROS_FRONTEND_PROMPTS.md`
2. One task from the same file

Do not paste all frontend tasks at once.

Recommended first frontend runs:

```text
Base Context + Task 6
Base Context + Task 9
Base Context + Task 10
```

Why:
- Task 6 defines Sites, Solar Systems, Equipment, and Installations.
- Task 9 clarifies Work Orders.
- Task 10 clarifies Support Tickets.

### For backend work

Paste:
1. Base Context from `SOLAROS_BACKEND_PROMPTS.md`
2. One step from the same file

Recommended backend run sequence:

```text
1. Base Context + Step 1
2. Base Context + Step 2
3. Base Context + Step 3
4. Base Context + Step 7
5. Base Context + Step 6
6. Base Context + Step 5
7. Base Context + Step 4
8. Base Context + Step 8
9. Base Context + Step 9
10. Base Context + Step 10
11. Base Context + Step 11
12. Base Context + Step 12
13. Base Context + Step 13
```

### For general product clarification

Paste or reference:
- `SOLAROS_PRODUCT_CONTEXT.md`

This is useful when Sonnet forgets what the app is supposed to be.

### For SQL/database setup

Use:
- `001_solaros_mvp_schema.sql`

Run it in Supabase SQL Editor or convert it into a Supabase migration.

## Recommended Prompt Format

```text
Read this context first:
[paste Base Context]

Now implement only this task:
[paste one task/step]

Important:
- Do not implement unrelated modules.
- Do not rewrite the whole app.
- Follow existing project structure.
- After implementation, summarize files changed and remaining TODOs.
```

## Important Reminder

Do not ask the LLM to implement frontend + backend + database in one prompt.

Use this sequence:

```text
1. Frontend structure
2. Supabase schema
3. Backend foundation
4. Backend module-by-module integration
5. Final review
```
