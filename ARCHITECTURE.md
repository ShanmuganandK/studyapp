# ARCHITECTURE.md — Living Map of Tinku Math

> Read this after `CLAUDE.md` + `DECISIONS.md` to orient without scanning every file.
> Update it in the SAME commit as any structural change (standing instruction in CLAUDE.md).

---

## Folder map (top level)

| Path                | What lives there                                                       |
|---------------------|------------------------------------------------------------------------|
| `src/recipes/`      | **NEW engine.** Pure question generators (the recipe contract).        |
| `src/components/`   | Presentational React UI (screens, modules, dashboard).                 |
| `src/contexts/`     | React contexts (e.g. `AuthContext`).                                   |
| `src/services/`     | External SDK boundary (`firebaseAdapter.js`).                          |
| `src/hooks/`        | (planned) React orchestration: session flow, mastery updates.          |
| `src/utils/`        | **LEGACY** question path (generators, factory, masteryEngine, etc.).   |
| `src/data/`         | **LEGACY** stored questions/syllabus (`questions.js`, JSON banks).     |
| repo root docs      | `CLAUDE.md`, `DECISIONS.md`, `STANDARDS.md`, `RECIPE_TEMPLATE.md`.      |

---

## Modules

### Recipes (`src/recipes/`) — the question engine

The core "logic, not questions" architecture. Each recipe generates infinite questions for
one skill from `(difficulty, rng)`, conforming to **the recipe contract**
(`RECIPE_TEMPLATE.md`). Pure functions only — no UI, no Firebase, no `Math.random()`.

- **`_rng.js`** — seedable deterministic RNG. `makeRng(seed)` → `{ int, pick, shuffle, next }`
  (mulberry32 + FNV-1a string-seed hash). All recipe randomness goes through this so output
  is reproducible and testable.
- **`addition.js`** — reference recipe, `skillId: g1.add.within20`, sums capped 5/10/20 by
  difficulty. Distractors: `forgot-carry`, `counted-extra`, `random-slip`. Format `mcq`.
- **`counting.js`** — reference recipe, `skillId: g1.count.1-20`, count objects, ranges
  1–5/10/20. Distractors: `off-by-one`, `miscount-low`, `random-slip`. Format
  `count-objects` (carries a `render: { glyph, count }` payload for drawing the set).
- **`__tests__/validator.test.js`** — the shared validator (STANDARDS §3). Runs any recipe
  100× per difficulty and asserts the full contract; branches on `format`. Every recipe
  (incl. Antigravity's replicas) must pass it before merge.

**Depends on it:** (future) session composer, quiz engine, mastery tracker — all consume
only the contract output, never recipe internals.

### Legacy question path (`src/utils/`, `src/data/`) — being replaced

The pre-recipe approach: `utils/generators/mathGenerators.js` (Math.random-based generators),
`utils/questionFactory.js` (router), `data/questions.js` + JSON banks (stored questions).
Still wired to existing screens. **Not modified** while the new engine is built alongside;
migration is a later task. New work should target `src/recipes/`, not these.

---

## Key contracts

### The recipe contract
Defined in `RECIPE_TEMPLATE.md`. Default export `{ skillId, maxDifficulty, generate }`;
`generate(difficulty, rng)` returns core fields `{ questionText, correctAnswer:number,
options:number[], format, misconceptions:(string|null)[] }` plus optional format-specific
fields (e.g. `render` for `count-objects`). `format` is an extensible open taxonomy (`mcq`,
`count-objects` shipping; `text-input`, `true-false` reserved). For option-based formats:
4 distinct options including the answer; `misconceptions` index-aligned with `options`,
correct slot `null`, wrong slots kebab-case misconception tags.

---

## Data model (Firestore)

See STANDARDS §4 for the full shape (not yet implemented). Path pattern:
`users/{uid}/children/{childId}/{profile|skills|sessions|streak}`. Recorded here as modules
land.

---

## Tooling

- **Vitest** for tests, configured in `vitest.config.js` (kept separate from
  `vite.config.js`). Scripts: `npm run test` (watch), `npm run test:run` (CI/one-shot).
