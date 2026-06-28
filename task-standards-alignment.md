# Task — One-Time Standards Alignment (NEW code only)

A single, bounded pass to bring the **new recipe-engine code** in line with the engineering disciplines now in STANDARDS.md §8. NOT a rewrite, NOT a refactor spree — a targeted cleanup so the new codebase is clean before more is built on it. **Legacy/frozen code is explicitly OUT of scope.**

---

## Scope

**IN scope (new code — clean these):**
- `src/recipes/` (recipes, _rng, skillMap, validator)
- `src/engine/` (sessionLite, hints, anything new)
- `src/hooks/` (useQuizSession, etc.)
- `src/services/` (analytics, and new services only — NOT the frozen legacy auth)
- `src/components/` NEW ones only (Mascot, QuestionView, SessionPlayer, RecipeQuizScreen, SkillSelectScreen)
- `src/config/` (flags, constants)

**OUT of scope (FROZEN — do NOT touch):**
- `src/utils/generators/`, `src/data/questions*`, `masteryEngine.js`, old screens (AdventureLadder, PassportDashboard, QuizEngine, Syllabus, ProfileSetup, Visual*), legacy auth files. These are frozen per DECISIONS.md migration strategy and will be DELETED, not refactored. Leave them exactly as they are.

---

## What to do (apply STANDARDS.md §8 to new code)

Go file-by-file through the in-scope new code and align to §8, conservatively:

1. **Constants centralization** — find magic values / repeated literals in new code; move app-wide ones into `src/config/constants.js` (create if needed), named clearly. Module-local one-offs can stay at the top of their file. Don't over-centralize trivial single-use values.
2. **Error handling** — ensure new code that can fail (anything touching storage, parsing, async, external input) catches specific-to-generic, logs rather than swallows, and degrades gracefully (never crash a child's session). Add boundary validation where external/uncertain input enters.
3. **DRY** — extract logic duplicated 2+ times in new code into shared helpers. (Do NOT touch the recipes' deliberate template repetition.)
4. **Logging** — replace any raw `console.log` in new code with a small `logger` util (create `src/utils/logger.js` with debug/info/warn/error if it doesn't exist; non-PII). The analytics service can use it too.
5. **Single responsibility / naming** — split any new function doing too much; fix unclear names (booleans as predicates, no cryptic abbreviations). Light touch — don't churn names that are already fine.
6. **Async** — ensure new async code uses async/await consistently and handles rejections.

## Constraints (important — right proportion)
- **Conservative.** This is cleanup, not redesign. Don't change behavior. Don't add abstractions/patterns/interfaces (§8 "what NOT to do"). If a file is already clean, leave it.
- **Don't over-engineer.** A kids' app, not a bank. Simple, clean, done.
- **Keep all tests green** (`npm run test:run`) — behavior must not change.
- **Don't touch frozen legacy.** At all.
- One branch (`standards-alignment`), reviewable in pieces.

## Verify
- `npm run test:run` green (behavior unchanged).
- The app still runs and plays on phone exactly as before (this is internal cleanup, no UX change).
- `git status` — only in-scope new files changed; zero frozen-legacy files touched.
- Update `ARCHITECTURE.md` if any new shared module was created (e.g. `config/constants.js`, `utils/logger.js`).

## Process
1. **First, audit and report** — before changing anything, list what you found that violates §8 in the new code (scattered constants, swallowed errors, duplication, raw console.logs, anything over-engineered). Show me the list.
2. I approve / adjust scope.
3. Then implement the cleanup in that bounded list.
4. Tests green, I test on phone, commit.

This is a one-time alignment. After it, §8 applies automatically to all future new code (Claude reads STANDARDS each session), and the §9 self-audit catches drift — no repeat needed.
