# GLOSSARY.md — project vocabulary

> **Purpose.** Some terms in this repo mean more than one thing depending on context — "rung" is
> the sharpest example: it names both a difficulty stage and a remediation step, and a session
> once acted on the wrong one. **Resolve an ambiguous term against this table before acting on
> it.** If a term you need is not here, ask the human rather than assuming — do not guess from
> context.

| Term | Means | Canonical file |
|---|---|---|
| rung (difficulty) | One of 3 strategy stages within a skill; NOT a magnitude band as of DECISIONS 2026-08-27. | `src/recipes/*`, `src/config/masteryConfig.js` |
| rung (remediation) | One of 3 steps in the wrong-answer ladder (hint / walkthrough+retry / park+guaranteed-win). DECISIONS 2026-07-04 era; `useQuizSession.js` currently ships only the first two — the guaranteed-win last question is deferred per spec. | `src/hooks/useQuizSession.js` |
| level | 0–5 per-skill counter gating prereq unlock and mastery. Separate axis from difficulty as of DECISIONS 2026-08-27. | `src/engine/mastery.js`, `src/config/masteryConfig.js` |
| session | One run of 8 questions on one skill. | `src/hooks/useQuizSession.js` |
| strong session | A session scoring ≥ `STRONG_RATIO`. | `src/config/masteryConfig.js` |
| mastery | Level 5 reached at the skill's `maxDifficulty`. | `src/engine/mastery.js` |
| skill / skillId | An atomic curriculum unit with a difficulty ceiling, prerequisites, and a recipe. | `src/recipes/skillMap.js` |
| recipe | A generator function producing questions from `difficulty` + a seeded RNG — never a stored question. | `RECIPE_TEMPLATE.md` |
| format | The render shape a question requests: `mcq`, `compare`, `count-objects` are shipped; `text-input` is named in DECISIONS 2026-07-04 as a future blank-bearing format, not yet used by any recipe. | `src/recipes/*`, `src/components/QuestionView.jsx` |
| misconception tag | A kebab-case tag on a distractor, e.g. `forgot-carry`. `misconceptions-reference.md` is canonical for tags and rules; when a recipe and the doc disagree, the doc wins. | `misconceptions-reference.md` |
| frontier | The skill the app suggests next. | `src/engine/composer.js`, `src/config/composerConfig.js` |
| review-due | Spaced-repetition state; rendered teal (`--color-review`), never amber (DECISIONS 2026-07-05). | `src/index.css`, `src/components/skillStateVisual.jsx` |
| band | Wonder (G1–3, launch) or Explorer (G4–5, Phase 2). | `DECISIONS.md` |
| progressStore | The `localStorage` persistence seam. Keys prefixed `tinku:v1:`. | `src/services/progressStore.js` |
| Layer 2 | The deferred tier: accounts, cloud sync, paywall, analytics. Not a backlog — do not build toward it. | DECISIONS 2026-08-14 |
| teach mode | **Proposed, not decided, not built.** Referenced only as a boundary case in DECISIONS 2026-08-27 ("teach mode remains real work, not a coat of paint") — no spec exists. | — |

## Omitted

The task instruction listed `src/config/skillMap.js` as the canonical file for **skill / skillId**.
That file does not exist — the skill map lives at `src/recipes/skillMap.js`. The table above uses
the verified path.
