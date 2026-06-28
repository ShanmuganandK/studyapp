# ARCHITECTURE.md — Living Map of Tinku Math

> Read this after `CLAUDE.md` + `DECISIONS.md` to orient without scanning every file.
> Update it in the SAME commit as any structural change (standing instruction in CLAUDE.md).

---

## Folder map (top level)

New core grows in NEW folders; legacy is FROZEN (never edited) until its replacement is
proven behind a flag, then deleted. See **Migration strategy** below.

| Path                | What lives there                                                       |
|---------------------|------------------------------------------------------------------------|
| `src/recipes/`      | **NEW.** Pure question generators (the recipe contract).               |
| `src/engine/`       | **NEW** (scaffold). Pure core logic: mastery, spaced-rep, composer, remediation. |
| `src/hooks/`        | **NEW** (scaffold). React orchestration: session flow, mastery updates. |
| `src/services/`     | **NEW** SDK boundary (auth/firestore/billing) — but currently also holds **FROZEN** legacy popup-first auth (`authService.js`, `firebaseAdapter.js`, `localAdapter.js`). |
| `src/config/`       | **NEW.** Config modules — `flags.js` (migration feature flags), `masteryConfig.js` (mastery + spaced-rep tunables). |
| `src/components/`   | Presentational React UI (screens, modules, dashboard). The migration bridge. The child-reachable flow is now entirely new (skill-select → recipe quiz); legacy screens stay on disk but FROZEN/unreachable (see **App flow & screens**). |
| `src/contexts/`     | React contexts (e.g. `AuthContext`). Legacy until auth is rebuilt.     |
| `src/lib/`          | **FROZEN.** Legacy Firebase init (`firebase.js`).                       |
| `src/utils/`        | **FROZEN.** Legacy question path (generators, factory) + `masteryEngine.js`. |
| `src/data/`         | **FROZEN.** Legacy stored questions/syllabus (`questions*`, JSON banks). |
| repo root docs      | `CLAUDE.md`, `DECISIONS.md`, `STANDARDS.md`, `RECIPE_TEMPLATE.md`.      |

---

## Migration strategy (legacy → new core)

> Full decision + rationale in **DECISIONS.md "Migration strategy"** (source of truth). Summary here.

The existing Antigravity app is a **validated UI prototype**, not the production foundation:
its core contradicts locked decisions (popup-first auth, localStorage state, slot-based
mastery, `Math.random()`/stored questions, dark Wonder theme). We **keep the good screens**
and **rebuild the core** via **strangler-fig**:

- **`master` stays working** at all times; short task branches, merged frequently.
- **New core in NEW folders** (`recipes/`, `engine/`, `hooks/`, `services/`, `config/`);
  **legacy is FROZEN** (`utils/generators`, `data/questions*`, `masteryEngine.js`, `lib/`,
  localStorage state, popup-first auth in `services/`).
- **New code never imports legacy; legacy is never edited.** `src/components/` is the only
  bridge — screens migrate one at a time.
- **Feature flags** (`src/config/flags.js`: `useRecipeEngine`, `useFirestore`,
  `useNewMastery`, all default `false`) switch each screen legacy↔new. ON to test, OFF for
  instant rollback. A legacy path is deleted only after its flag has run `true` confidently.

**End state:** the new core grows until the old is unused, then legacy is removed.

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
  difficulty. Distractors (canonical tags, see `misconceptions-reference.md`):
  `crossing-ten-misstep`, `add-tens-to-ones`, `operator-mixup`, `off-by-one`, `random-slip`.
  Format `mcq`.
- **`counting.js`** — **multi-skill** (`skillIds: g1.count.1-9, g1.count.1-20`), count
  objects, ranges per skill. Distractors: `double-count-object`, `skip-count-sequence`,
  `count-from-zero`, `random-slip`. Format `count-objects` (carries a `render: { glyph, count }`
  payload).
- **`subtraction.js`** — **multi-skill** (`skillIds: g1.sub.within10, g1.sub.within20`),
  `a - b`. Distractors: `operator-mixup`, `tens-ignored`, `smaller-from-larger-force`,
  `off-by-one`, `random-slip`. Format `mcq`.
- **`compareNumbers.js`** — `skillId: g1.num.compare20`. Pick the sign for `a ? b`. Distractors:
  `alligator-confusion`, `ones-digit-bias`, `digit-length-bias`. Format `compare` (3 operator
  options + `render: { left, right }`).
- **`__tests__/validator.test.js`** — the shared validator (STANDARDS §3). For each recipe and
  each skill it serves (`skillIds ?? [skillId]`), runs `generate` 100× per difficulty and
  asserts the full contract; branches on `format` (numeric vs `compare`). Every recipe must
  pass it before merge.

**Depends on it:** (future) session composer, quiz engine, mastery tracker — all consume
only the contract output, never recipe internals.

### Skill map (`src/recipes/skillMap.js`) — curriculum backbone

Pure data + helpers (no UI/Firebase) defining the Grades 1–2 learning path (`skill-map-spec.md`).
The session composer reads it + a child's mastery to decide what to teach; the recipe factory
reads it to know which recipes to build.

- **`SKILLS`** — object keyed by `skillId`; each entry
  `{ id, name, grade, strand, order, maxDifficulty, prereqs[], recipe, status }`.
  `status` is `'ready'` (recipe file exists) or `'planned'` (recipe to build). Six skills are
  `ready` today — `g1.count.1-9`, `g1.count.1-20`, `g1.num.compare20`, `g1.add.within20`,
  `g1.sub.within10`, `g1.sub.within20` (these are exactly what `SkillSelectScreen` lists);
  all others `planned`. Several skills share one parameterised recipe (e.g. `counting`,
  `addition`, `addition2d`).
- **Helpers** — `getSkill` (throws on unknown), `prereqsMet(id, masteryMap)`,
  `unlockedSkills(masteryMap)`, `frontierSkill(masteryMap, grade)`, `nextSkills(id)`.
  Unlock = prereqs at mastery ≥ `MASTERY_THRESHOLD` (3). These are status-agnostic graph
  helpers; the composer/UI additionally gates on `status:'ready'`.
- **`__tests__/skillMap.test.js`** — graph validity (prereqs exist, no cycles, unique order
  per grade, ready⇒recipe exists) + helper unit tests.

### App flow & screens (`src/components/`) — the single reachable path

The app was collapsed from an old/new mix into ONE coherent flow. There is now exactly one
child-reachable path, all on the new recipe engine, light Wonder theme + Tinku:

```
entry → SkillSelectScreen (home) → RecipeQuizScreen → SessionPlayer (session-end inside)
```

- **`ThemeManager.jsx`** — app root under `AuthProvider`. Holds the view state and routes
  `skills` (default) → `quiz` → gated `parent`. Grade is `currentProfile?.grade ?? 1`
  (`DEFAULT_GRADE`); a profile-less/anonymous child lands cleanly on the skill screen. No
  longer imports any legacy screen.
- **`SkillSelectScreen.jsx`** — the home / only entry into practice. Reads `SKILLS` from the
  skill map, filters `status:'ready'`, sorts by `order`, renders one tappable card per skill
  (friendly `name`). `onSelectSkill(skillId)` → quiz.
- **`RecipeQuizScreen.jsx`** — thin seam: takes the chosen `skillId` + `grade` and renders
  `SessionPlayer` (which owns remediation/scoring/session-end via `useQuizSession`). Skill
  choosing moved out to `SkillSelectScreen`.
- **`Layout.jsx`** — phone frame + bottom nav. Two coherent items: **Home** (→ `skills`) and
  **Parent** (→ parent gate). The legacy **Adventure** nav item was removed.
- **`Mascot.jsx`** — single source of truth for Tinku rendering. Imports lossless WebP poses
  from `assets/mascot/webp/` (≈50% smaller than PNGs, zero visible quality loss; originals
  kept as source). All 6 images preloaded at module init so emotion changes hit cache instantly.
  Outer div reserves container size (no layout shift). Emotion transitions cross-fade via opacity
  (120ms), GPU-only (STANDARDS §5). Breathe float animation stays in `index.css`.
- **Parent zone** (inline in `ThemeManager`) — simple gated placeholder (passcode set/change)
  behind `ParentGateModal`.

**FROZEN / unreachable screens** (kept, never edited, no longer wired into navigation):
`AdventureLadder.jsx`, `Syllabus.jsx`, `PassportDashboard.jsx`, `QuizEngine.jsx`,
`modules/VisualAddition.jsx`, `modules/VisualFractions.jsx`, and `ProfileSetup.jsx` (the old
dark child grade-wall, Grades 1–4). These pull from the legacy question/mastery/syllabus path.
**Deferred:** parent-set grade/profile selection returns later as a proper light-themed,
parent-gated flow (DECISIONS: grade is a parent property, no child grade-wall) — `ProfileSetup`
is the frozen reference until then.

### Mastery engine (`src/engine/mastery.js` + `src/config/masteryConfig.js`)

Pure functions — no Firebase, no localStorage, no React, no `Date.now()` inside. Computes
new skill state from old state + a session result. Persistence is a **separate, later task**;
this module only does the arithmetic.

**Skill state shape** (one record per child per skill; later persisted at
`users/{uid}/children/{childId}/skills/{skillId}`):
```js
{
  skillId,           // e.g. 'g1.add.within20'
  level,             // 0–5 mastery level
  difficulty,        // current working difficulty 1–maxDifficulty (adaptive)
  maxDifficulty,     // skill's curriculum ceiling — stored here so pure fns need no skill-map import
  attempts,          // total questions attempted (all-time)
  correct,           // total correct (all-time)
  lastSeen,          // ISO date string of last practice
  nextReview,        // ISO date string when next due for review (null until first mastery)
  reviewInterval,    // index into MASTERY.REVIEW_INTERVALS (Leitner position)
  recentParams,      // last ~20 question signatures (repeat-avoidance handoff to session layer)
  misconceptions,    // { tag: count } — which mistake patterns this child shows
}
```

**Exports** (`src/engine/mastery.js`):
- `emptySkillState(skillId, maxDifficulty = 3)` — fresh zeroed state
- `applyResult(skillState, sessionResult, config)` — core: returns NEW state (pure, no mutation)
- `isMastered(skillState, config)` — level ≥ MASTERED_LEVEL
- `isUnlockedLevel(skillState, config)` — level ≥ UNLOCK_LEVEL (prereq check for skill map)
- `isDueForReview(skillState, today)` — mastered AND nextReview ≤ today (ISO string compare)
- `nextWorkingDifficulty(skillState)` — what difficulty the next session should use

**Config** (`src/config/masteryConfig.js`) — all tunables in `MASTERY`:
`MAX_LEVEL`, `UNLOCK_LEVEL`, `MASTERED_LEVEL`, `STRONG_RATIO` (0.8), `WEAK_RATIO` (0.5),
`LEVEL_UP_REQUIRES_HARD` (true), `REVIEW_INTERVALS` ([1, 2, 4, 7, 21] days).

**Tests** (`src/engine/__tests__/mastery.test.js`) — 50+ cases: level up/down/hold, the
level-5-hard-difficulty gate, adaptive difficulty bounds, full spaced-rep interval progression,
just-mastered vs in-review, regression recovery, all boundary ratios, 0-attempt edge case,
determinism.

**Depends on it (later tasks):** session composer (reads `nextWorkingDifficulty` +
`isDueForReview`), persistence layer (saves `applyResult` output to Firestore), parent
dashboard (reads `level` + `misconceptions`). None of those are wired yet.

### Feel layer (`src/services/sound.js`) — sound + haptics

The **single source of truth for all audio and haptics**. Components call `playSound(event)` /
`haptic(type)` — they never touch `AudioContext` or `navigator.vibrate` directly (STANDARDS §8).
All calls are fire-and-forget: the service swallows errors silently so autoplay blocks or missing
APIs never crash a child's session.

- **Named events** (callers use these; the service decides the implementation):
  `correct` (rising 3-note chime), `wrong` (single soft low tone — gentle, not a buzzer),
  `tap` (brief soft click on button press), `complete` (4-note celebratory fanfare).
- **Haptic type**: `light` (30 ms vibration via Web Vibration API).
- **Swap points** (marked with `// TODO` in the file):
  - *Sound:* replace each `synthMap` entry with `new Audio(url).play()` to use real files — callers unchanged.
  - *Haptics:* replace `hapticMap` bodies with `Capacitor Haptics.impact(...)` — callers unchanged.
- **Mute**: `setSoundMuted(bool)` / `isSoundMuted()` — one flag silences both sound and haptics
  instantly. Sound is ON by default; the session UI exposes a 🔊/🔇 toggle.
- **Wired into**: `SessionPlayer` — tap on every option press; correct/wrong/complete on phase
  transitions via `useEffect`.

**Tests**: `src/services/__tests__/sound.test.js` (Vitest, node env, globals stubbed) — covers
mute logic, event mapping, note counts, and silent resilience to API failures.

### Legacy core (FROZEN) — being retired

The pre-decisions Antigravity core, kept running as-is and **never edited** until its
new-core replacement is proven behind a flag, then deleted (see Migration strategy):
- `utils/generators/mathGenerators.js` (Math.random generators), `utils/questionFactory.js`
  (router), `data/questions*` + JSON banks (stored questions) → replaced by `src/recipes/`.
- `utils/masteryEngine.js` (slot-based "3-in-a-row") → replaced by `src/engine/`.
- `services/authService.js` + `firebaseAdapter.js`/`localAdapter.js` (popup-first auth),
  `lib/firebase.js`, and localStorage app state → replaced by anonymous-first
  `src/services/` + Firestore.

New work targets the new-core folders; new code never imports these.

---

## Key contracts

### The recipe contract
Defined in `RECIPE_TEMPLATE.md`. Default export `{ skillId | skillIds, maxDifficulty,
generate }`; multi-skill recipes export `skillIds` and take `generate(difficulty, rng,
skillId)` (single-skill recipes keep `skillId` and ignore the 3rd arg). `generate` returns
core fields `{ questionText, correctAnswer, options, format, misconceptions:(string|null)[] }`
plus optional format-specific fields (`render` for `count-objects`/`compare`). `format` is an
extensible open taxonomy (`mcq`, `count-objects`, `compare` shipping; `text-input`,
`true-false` reserved). For option-based formats: fixed distinct options including the answer
(4 numeric for `mcq`/`count-objects`; 3 operator strings for `compare`); `misconceptions`
index-aligned with `options`, correct slot `null`, wrong slots kebab-case tags.

### The skill-map entry
Defined in `skill-map-spec.md`, implemented in `src/recipes/skillMap.js`. `SKILLS[skillId] =
{ id, name, grade, strand, order, maxDifficulty, prereqs:string[], recipe, status }` where
`status ∈ {'ready','planned'}`. The graph is a DAG (prereqs point backward); `order` is unique
per grade. `maxDifficulty` mirrors the powering recipe's ceiling.
`ready` skills additionally carry optional display fields: `displayName` (kid-friendly title),
`subtitle` (curriculum tag shown small/muted), `icon` (single emoji). `SkillSelectScreen` reads
these directly; screens fall back to `name` when absent. Star emoji reserved for rewards only.

---

## Data model (Firestore)

See STANDARDS §4 for the full shape (not yet implemented). Path pattern:
`users/{uid}/children/{childId}/{profile|skills|sessions|streak}`. Recorded here as modules
land.

---

## Tooling

- **Vitest** for tests, configured in `vitest.config.js` (kept separate from
  `vite.config.js`). Scripts: `npm run test` (watch), `npm run test:run` (CI/one-shot).
