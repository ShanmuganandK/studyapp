# GLOSSARY.md — Project Vocabulary

> **Purpose:** Disambiguate overloaded project terms (especially `rung`, `bridge`, `level`, and `format`) before writing code or specs. If a term you need is not here, confirm with the project owner rather than guessing.

| Term | Meaning | Canonical Source |
|---|---|---|
| **rung (difficulty)** | One of up to 3 difficulty/strategy stages within a skill (e.g. `addition2d` / `subtraction2d` step by strategy across rungs 1–3, not purely by magnitude). | `src/recipes/*`, `src/config/masteryConfig.js` |
| **rung (remediation)** | One of 3 steps in the wrong-answer ladder: targeted hint → warm reveal + advance → park (on any reveal) + one unscored bonus question at session end. | `src/hooks/useQuizSession.js` |
| **bridge (session)** | Optional unscored warm-up questions at rungs below the working rung before the 8 scored questions on `strategyRungs: true` skills (`g2.add.2d-nocarry`). Behind the debug-only Parent Zone toggle (`VITE_TESTER_TOOLS`). | `src/hooks/useQuizSession.js`, `src/recipes/skillMap.js` |
| **level** | `0..5` per-skill mastery counter gating prerequisite unlock (`>= 3`) and mastery (`5`). Decoupled from `difficulty`: one strong session promotes `level` (`LEVEL_UP_REQUIRES_HARD` gates `4 → 5`) and one weak session drops it by 1. `0` = not started. | `src/engine/mastery.js`, `src/config/masteryConfig.js` |
| **session** | One scored run of 8 questions on a single skill. | `src/hooks/useQuizSession.js` |
| **strong session** | A session scoring `>= STRONG_RATIO` (`7/8`). One strong session promotes `level`; `difficulty` requires consecutive strong sessions (`DIFFICULTY_UP_STREAK`). | `src/config/masteryConfig.js` |
| **mastery** | `level === 5` reached at the skill's `maxDifficulty`. | `src/engine/mastery.js` |
| **skill / skillId** | Atomic curriculum unit with a `grade`, `order`, `maxDifficulty`, `prereqs`, `status`, and `recipe`. | `src/recipes/skillMap.js` |
| **recipe** | Pure generator function producing questions from `(difficulty, rng, skillId)` — never stored questions. | `RECIPE_TEMPLATE.md` |
| **format** | Top-level render shape requested by a question. **11 shipping:** `mcq` (plus 16 `render.kind` sub-archetypes), `count-objects`, `compare`, `unit-length`, `shape-mcq`, `spatial-mcq`, `balance-mcq`, `coins-mcq`, `clock`, `pictograph`, `fraction-mcq`. **Reserved:** `text-input`, `true-false`. | `RECIPE_TEMPLATE.md`, `src/components/QuestionView.jsx` |
| **misconception tag** | Kebab-case tag on a wrong option (e.g. `forgot-carry`). Canonical tags live in `misconceptions-reference.md` and map 1:1 to `src/engine/hints.js`. | `misconceptions-reference.md`, `src/engine/hints.js` |
| **frontier** | The next unlocked skill the composer recommends for the active grade. | `src/engine/composer.js`, `src/config/composerConfig.js` |
| **review-due** | Spaced-repetition state rendered in teal (`--color-review`), never amber (amber is rewards-only). | `src/index.css`, `src/components/skillStateVisual.jsx` |
| **band** | **Wonder** (Grades 1–2 at launch; Grade 3 planned) or **Explorer** (Grades 4–5, post-launch). | `ARCHITECTURE.md`, `ROADMAP.md` |
| **progressStore** | Device-local `localStorage` persistence seam (`tinku:v1:skills`). | `src/services/progressStore.js` |
| **Layer 2** | Deferred post-MVP tier (accounts, cloud sync, paywall, analytics). Not an active backlog; revisit only on retention/willingness-to-pay trigger. | `ROADMAP.md`, `archive/decisions/DECISIONS.md` |
| **teach mode** | Proposed concept only — not decided, not specified, not built. | — |
