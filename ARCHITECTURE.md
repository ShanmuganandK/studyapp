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
| `src/config/`       | **NEW.** Config modules — `constants.js` (app-wide constants, e.g. `FEEDBACK_WHATSAPP_NUMBER`), `flags.js` (migration feature flags), `masteryConfig.js` (mastery + spaced-rep tunables), `composerConfig.js` (composer tunables). |
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

### Design tokens & UI-overhaul primitives — "Tinku's Wonder World"

The visual overhaul (RESKIN only — zero logic change) flows from **named design tokens**, so
future kid-feedback tuning is a token change, not a screen hunt.

- **Tokens** live as CSS custom properties in **`src/index.css`** (`:root` = Wonder-band
  defaults; the Explorer band, Phase 2, will override the SAME properties under a
  `.theme-explorer` scope — no component changes needed). **`tailwind.config.js`** exposes them
  as utilities so components use named tokens, never raw hex. Groups: colour
  (`bg`, `bg-card`, `primary`/`-soft`/`-ink`, `accent`, `success`/`-soft`, `encourage`/`-soft`/`-ink`,
  `learn`/`-soft`/`-ink`, `review`, `ink`, `muted`), `rounded-{button,card}`, `shadow-{button,card}`, fluid
  `text-{question,option,title,prompt,body}` (clamp), and **type families** `font-body` (`--font-body`)
  / `font-display` (`--font-display`). **Locked meanings:** `accent`(amber)=reward ONLY;
  `encourage`(soft coral)=wrong answers (never red/amber); `learn`(sky)=hints/learning;
  `review`(teal, added Screen 3)=review-due only ("come back to this" — NOT amber; kept distinct
  from `learn`/suggests; DECISIONS 2026-07-05). Any future "needs attention/revisit" state inherits
  `review`.
- **Fonts (self-hosted, no CDN — low-end-Android safe):** **Nunito** (body/parent, the default
  `font-sans`) + **Baloo 2** (kid-facing display — big numbers/equations/titles/option tiles),
  via **Fontsource** variable packages imported in `src/main.jsx` (`font-display: swap`, bundled
  woff2, unicode-range subset so only Latin ~72 kB is fetched). *Follow-up:* SW precache glob
  omits `woff2`, so fonts degrade to system fallback offline (add a font `CacheFirst` runtime
  rule later).
- **Depth utilities** (`index.css`): `.kid-tile-idle` (top-lit gradient for the raised "pillow"
  answer tiles, paired with the layered `--shadow-button`), `.count-glyph` (drop-shadow so
  counted objects sit elevated), `.kid-num-3d` (soft depth shadow on big numbers/equations),
  `.tinku-ground` (mascot ground ellipse). All static (no animated shadow/filter).
- **Quiz micro-motion** (also `index.css`, all GPU-safe transform/opacity, reduced-motion off):
  `animate-q-enter` (question slide/fade-in, keyed on questionNumber), `animate-opt-in` (option
  stagger), `animate-correct-pop`, `animate-encourage-nudge` (gentle, not a harsh shake),
  `animate-slot-fill` (compare blank fills with the correct operator — green on a correct answer,
  sky/learn on the wrong-#2 reveal — see the "answer feedback fills the blank" rule, DECISIONS
  2026-07-04). `.tinku-ground` = the soft ground ellipse that stages Tinku "in the world".
- **Celebration motion** (Screen 2, `index.css`, GPU-safe, reduced-motion off): `animate-celebrate-pop`
  (warm scale-in — Tinku, title, mastery beat), `animate-star-pop` (per-star count-up bounce),
  `animate-rise-in` (buttons/score fade+rise), `.confetti-piece` (one `confetti-fall` keyframe driven
  by per-piece inline vars `--dx/--dy/--rot/--dur/--delay`). The session-end sequence is choreographed
  entirely by per-element `animation-delay` (no JS timers); reduced-motion collapses it to
  everything-visible-at-once.
- **Screen transitions** (Screen 5, `index.css`): `animate-view-enter` (opacity 0→1 + translateY
  10→0, 200ms ease-out) fires whenever the active view changes. `Layout` keys its content wrapper
  by `currentView`, so React remounts it with this animation on every nav change. GPU-only;
  reduced-motion collapses to instant. No JS timers or third-party animation libraries.
- **Home card motion** (Screen 3, `index.css`): non-suggested cards reuse `animate-opt-in` for the
  stagger-in; the recommended card uses `animate-card-in-suggest` (entrance + a soft one-shot emphasis
  bump — single keyframe so it never fights the button's `:active` press-squish). Per-card stagger
  delay set inline by index; reduced-motion off.
- **`KidButton.jsx`** — the kid-facing answer-tile primitive. Big, soft-rounded, squishes on
  press (`active:scale-95`); state-driven visuals (`idle`/`correct`/`wrong`) from tokens. Purely
  presentational — all answer logic stays in `useQuizSession`. Used by `SessionPlayer` (4× per
  question). Later kid-facing screens reuse it.
- **`Confetti.jsx`** — reusable, GPU-safe celebration burst primitive (Screen 2). A modest sprinkle
  of pieces fans out from its parent's top-centre via `.confetti-piece`; `palette` (`party` default /
  `amber` for the mastery beat) picks token colours. Purely decorative (aria-hidden, pointer-events-none);
  renders nothing under prefers-reduced-motion. Reused by `CelebrationScreen` (background burst + the
  amber mastery-up beat).
- **`CelebrationScreen.jsx`** — the session-end EVENT (Screen 2), rendered by `SessionPlayer` on
  `sessionComplete`. Beat sequence (Tinku pops in → confetti → score stars count up → "Great job!" →
  optional mastery-up beat → buttons last), choreographed by per-element `animation-delay`. Purely
  presentational: mood floor + mastery-up detection live in the engine/hook; it renders `score`/`total`/
  `masteryUp` and reuses `Confetti`. Uses token-based CTA buttons (not `KidButton`, which is an
  answer-tile primitive — 50% width, idle/correct/wrong — semantically wrong for CTAs). Smoke test:
  `__tests__/CelebrationScreen.test.jsx` (mood-floor title, score read-out, both CTAs, mastery-up beat
  shown only when surfaced).
- **Reskinned so far (Screen 1 — quiz):** `SessionPlayer.jsx`, `QuestionView.jsx`,
  `HintBubble.jsx` are now fully token-based (no raw hex). `QuestionView` takes a
  `blankFill` prop (`SessionPlayer` derives `'correct'`/`'reveal'`/`null` from `phase`, existing
  view-state — no new hook/recipe data) to fill the compare blank with the correct sign
  (`animate-slot-fill`): green on a correct answer, sky/learn on the wrong-#2 reveal.
- **`MasteryPips.jsx`** — shared pip indicator for mastery level 0–MAX_LEVEL. Used by `SkillCard`
  and `ParentDashboard`. Props: `level`, optional `isDue` (shows ↻ glyph in `review` teal), optional
  `className` for call-site layout (e.g. `"mt-1.5"`). NOT used by `SkillPathScreen`'s `PathPips`
  — that duplicate is intentional pending the A/B test decision (see Experiments).
- **`SkillCard.jsx`** — presentational home-screen skill card primitive (Screen 3). Renders one
  skill's icon/`displayName`/`subtitle` + `MasteryPips`, with token styling, press-squish and a
  stagger-in (`animate-opt-in`; the recommended card enters with the `animate-card-in-suggest`
  emphasis pulse). Takes pure view data — `{ skill, level, isDue, isSuggested, isReviewSuggested,
  index, onClick }`; **never calls the engine** (recommendation/review-due are computed upstream and
  handed in as booleans). Colour rule: review-due uses `border-review`/`text-review` (teal), suggest
  uses `learn` (sky), mastered pip uses `accent` (amber = reward). Smoke test:
  `__tests__/SkillCard.test.jsx` (suggest vs review vs plain, pips, review-token-not-amber).
- **Reskinned (Screen 2 — session-end):** the interim in-file `SessionEnd` was replaced by the
  `CelebrationScreen` + `Confetti` primitives above.
- **Reskinned (Screen 3 — home / skill-select):** `SkillSelectScreen.jsx` moved onto tokens and now
  renders `<SkillCard>` per skill; the `MasteryPips` sub-component moved into `SkillCard`. The engine
  data-flow is unchanged — the lazy `useState` initialiser still does `loadAllSkillStates` +
  `recommendNext`, and `isDueForReview` is still called per card (thin delegation to the pure engine,
  deliberately preserved — the reskin only changed rendering).

### App flow & screens (`src/components/`) — the single reachable path

The app was collapsed from an old/new mix into ONE coherent flow. There is now exactly one
child-reachable path, all on the new recipe engine, light Wonder theme + Tinku:

```
entry → SkillPathScreen (default) or SkillSelectScreen (?home=cards) → RecipeQuizScreen → SessionPlayer (session-end inside)
```

- **`ThemeManager.jsx`** — app root under `AuthProvider`. Holds the view state and routes
  `skills` (default) → `quiz` → gated `parent`. Grade is `currentProfile?.grade ?? 1`
  (`DEFAULT_GRADE`); a profile-less/anonymous child lands cleanly on the skill screen. The
  `skills` view renders `SkillPathScreen` by default (kid-test in progress — Screen 3-B);
  `?home=cards` switches to `SkillSelectScreen` for A/B comparison. No legacy screens imported.
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
- **`HintBubble.jsx`** — presentational speech bubble for the remediation hint, rendered below
  Tinku (encourage pose) with an upward tail so it reads as Tinku speaking. Pops in via
  `animate-hint-pop` (transform/opacity, in `index.css`); parent keys it on `hintNonce` to replay
  on each (re)emission. Pure presentation — all hint logic lives in `useQuizSession` (STANDARDS
  §2), so the coming UI overhaul restyles this file without touching the ladder.
- **`PrivacyNotice.jsx`** — parent-facing privacy reassurance; presentational, copy from the
  single-source `PRIVACY_NOTICE` in `config/constants`. Two variants: `card` (prominent, parent
  dashboard) and `footer` (subtle muted text, home/skill-select). Never on kid-facing quiz screens.
  Claims limited to what's true (anonymous, on-device) — no "offline"/"no tracking".
- **`ParentGateModal.jsx`** — the Families-Policy DETERRENT gate (not a security boundary; DECISIONS
  2026-07-14). Rendered via **`createPortal` to `document.body`** so the `fixed inset-0` overlay pins
  to the true viewport regardless of scroll position or ancestor transform (fixes the off-viewport
  bug — it used to live inside Layout's scrolled/`animate-view-enter` wrapper). Internal `mode` state
  `'verify' | 'set' | 'challenge'` (seeded by the `isSettingMode` prop). **Forgot-passcode recovery:**
  a "Forgot passcode?" link → runtime adult arithmetic challenge (`makeAdultChallenge` in
  `parentChallenge.js`, two-digit × one-digit, never stored); correct answer calls `clearPasscode`
  and drops into set-new-passcode; wrong = `animate-shake` + retry, no lockout. Never touches child
  progress. Card is `max-h-[92dvh] overflow-y-auto` for fit-one-viewport at 320px. Background scroll
  lock is Layout's `scrollLocked` prop (the real scroller is Layout's `.flex-1`, not `body`), driven
  by `ThemeManager`'s `isGateOpen`. Tests: `__tests__/ParentGateModal.test.jsx` (portal target,
  verify/set/forgot lifecycle) + `__tests__/parentChallenge.test.js` (pure challenge).
- **`ParentDashboard.jsx`** — encouraging progress snapshot for parents, behind `ParentGateModal`.
  Renders via `progressSummary` (see below): mastered/in-progress/not-started skill list, wins
  highlight, "currently working on" strip, light activity signal, passcode actions. Passcode
  lifecycle in the footer: **Change/Set** (`onSetPasscode`) and **Remove** (`onRemovePasscode` →
  `clearPasscode`, with a two-step inline confirm; removal leaves the zone ungated until a new code is
  set). Reads local mastery data only (no account, no cloud). Test: `__tests__/ParentDashboard.test.jsx`.
  Deferred: misconception-based "areas to support" (post-teacher-review), activity trends, parent
  accounts/cloud sync, multiple child profiles.

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

### Practice composer (`src/engine/composer.js` + `src/config/composerConfig.js`)

Pure functions — no Firebase, no localStorage, no React, no `Date.now()`. Given skill
states + the skill map + today's date, returns the single best skill to practise now.
`skillStates` is passed in by the caller (never loaded here) so the module has zero
side effects and is trivially testable.

**Recommendation priority (fixed):**
1. **review** — any mastered skill where `isDueForReview(state, today)`; most-overdue-first
   when `COMPOSER.PREFER_MOST_OVERDUE_REVIEW` is `true`.
2. **frontier** — unlocked (prereqs met), started (level > 0), not yet mastered; lowest level
   or curriculum order per `COMPOSER.FRONTIER_PICK`.
3. **new** — unlocked, not started (level 0 or no state); earliest in curriculum order.
4. **all_caught_up** — everything available mastered and nothing due; returns the mastered
   skill with the nearest upcoming review date (or `skillId: null`).

Only `status:'ready'` skills are ever recommended. Prereqs are checked with `isUnlockedLevel`
on the prereq's stored state; a missing state counts as locked.

**Returns:** `{ skillId: string | null, reason: 'review' | 'frontier' | 'new' | 'all_caught_up' }`

**Exports:**
- `recommendNext(skillStates, skillMap, today, config)` — core recommender
- `getReviewsDue(skillStates, today)` — all due skillIds (also used for UI badging)
- `getFrontierSkills(skillStates, skillMap)` — started-not-mastered unlocked skills
- `isPrereqsMet(skillId, skillStates, skillMap)` — prereq check helper

**Config** (`src/config/composerConfig.js`): `PREFER_MOST_OVERDUE_REVIEW` (bool),
`FRONTIER_PICK` (`'lowest_level'` | `'skillmap_order'`).

**Tests** (`src/engine/__tests__/composer.test.js`) — 47 cases: full priority chain,
brand-new child, review-over-frontier priority, most-overdue tiebreak, frontier level
picking, curriculum-order new-unlock, all-caught-up fallback, prereq-chain gating at
every level, planned-skill exclusion, determinism, no mutation.

**Depends on it:** `SkillSelectScreen` (recommendation display), future session hooks
(auto-launching the suggested skill).

### Progress store (`src/services/progressStore.js`) — local persistence

The **single place mastery state is saved and loaded**. Callers (hooks, screens) never touch
the storage API directly — only this service does. This is the swap-point: today the backend
is `localStorage` (anonymous, on-device, no account); when cloud sync arrives (Firestore,
separate lawyer-gated task), this service is replaced or augmented without touching any caller.

**Storage:** anonymous, behaviour-only, no PII. Keyed by `skillId` only. DPDP-safe.
Key: `'tinku:v1:skills'`, shape: `{ version: 1, skills: { [skillId]: skillState } }`.

**Exports:**
- `loadAllSkillStates() → { [skillId]: skillState }` — used by SkillSelectScreen on mount
- `loadSkillState(skillId) → skillState | null` — used by `useQuizSession` on session start
- `saveSkillState(skillId, skillState)` — used by `useQuizSession` on session complete

**Error handling:** all three functions catch storage failures (quota, disabled), log a dev
warning, and degrade gracefully — the child can still play, progress just won't persist that
session.

**No feature flag:** the service is purely additive and degrades safely on failure, so it is
called unconditionally. `flags.useNewMastery` is the future switch for retiring the legacy
mastery engine, not this service.

**Cloud/account persistence is explicitly deferred** (separate lawyer-gated task). When that
task lands, `progressStore` is the only file that changes.

**`recentParams` note:** persisted as part of skill state (passed through `applyResult`
unchanged) but currently always `[]` — neither `buildLiteSession` nor `applyResult` populates
it. Cross-session repeat-avoidance is a future nicety.

### `useOnline` hook (`src/hooks/useOnline.js`)

Returns a live `isOnline: boolean` (initialised from `navigator.onLine`, updated via
`window online/offline` events). Used by `Layout` to conditionally render the offline
banner — a gentle `bg-learn-soft` strip that tells the child Tinku can still play and
that progress will sync on reconnect. Non-blocking: the session continues normally.

### Session wiring (`src/hooks/useQuizSession.js`) — mastery in/out

`useQuizSession` is the wiring layer between the pure engine and the React lifecycle.

- **Session start (`build` callback):** calls `loadSkillState(skillId)` (or
  `emptySkillState(skillId, maxDifficulty)` for first play); reads `nextWorkingDifficulty` and
  passes it as the fixed `difficulty` to `buildLiteSession` so the child resumes at their
  adapted level, not always difficulty 1.
- **Session end (`next()` when phase → 'complete'):** reads the real clock here (ISO date
  string), computes `difficultyPlayed` as the max difficulty of questions in the session,
  collects `misconceptionTags` accumulated via a ref during `answer()`, calls `applyResult`
  (pure engine stays clock-free), and saves the new state via `saveSkillState`.
- **`masteryUp` read-out (Screen 2):** on completion the hook derives a read-only
  `{ leveledUp, justMastered, level, skillName }` (or `null`) by comparing the level `applyResult`
  ALREADY produced against the previous level — no new mastery/ladder logic, just surfacing the
  computed result so `CelebrationScreen` can add a mastery-up beat. Attached to the committed
  complete-state and returned as `masteryUp`; view data only.
- The pure engine (`mastery.js`) is NEVER given `Date.now()` — date is always injected by
  this wiring layer.

**Remediation hint — soft read-window (Option 1).** The pure ladder puts hint LOGIC here (not
in the screen): on wrong #1 it sets `phase:'hint'`, the distractor's hint, `hintGrace:true`, and
bumps `hintNonce`. The hook opens a `HINT_GRACE_MS` (1000ms) window then flips `hintGrace` off.
While the window is open, a further WRONG tap RE-SHOWS the tapped distractor's hint (bumps
`hintNonce`, no attempt counted) instead of escalating — so a fast/mashing child never skips the
hint; a CORRECT tap always wins instantly; only a deliberate wrong AFTER the window escalates to
the wrong-#2 reveal. Options are never disabled during the hint. The hint is rendered by the
presentational **`HintBubble`** component (below); `hintNonce` is its React `key` so the pop-in
animation replays each (re)emission. Logic here, presentation in the component (STANDARDS §2).

**`sessionLite.js` change:** `buildLiteSession` gained an optional `difficulty` param. When
provided, all questions use that fixed difficulty (clamped to `maxDifficulty`) instead of the
1→2→3 ramp. Existing ramp behaviour is unchanged when `difficulty` is omitted.

### Mastery pips + suggestion highlight (`SkillSelectScreen.jsx` + `SkillCard.jsx`)

Each skill card shows 5 small round pips reflecting the child's current mastery level (rendered by
`MasteryPips` inside `SkillCard` since Screen 3). Pip colours (tokens): empty = `primary-soft`;
levels 1–2 = `learn` (sky); levels 3–4 = `primary` (indigo); level 5 (mastered) = `accent` (amber =
reward). A `↻` glyph in the `review` token (teal) marks skills due for spaced-rep review — NOT amber
(DECISIONS 2026-07-05).

Deliberately not stars (stars = in-session reward, DECISIONS). This is the verify-it-works
surface; the full parent dashboard is a later task.

**Suggestion highlight:** `SkillSelectScreen` calls `recommendNext` (from the practice
composer) on mount using the same skill-state snapshot, and passes the result to each `SkillCard`
as booleans. The recommended card gets a coloured border + one-line label — `border-review` (teal)
with `↻ Review time!` for a review recommendation, or `border-learn` (sky) with `Tinku suggests!`
otherwise — plus a gentle one-shot entrance pulse (`animate-card-in-suggest`). `all_caught_up` and
`null` skillId produce no highlight. The child can still tap any card; the highlight is guidance,
not a gate.

`SkillSelectScreen` loads state and computes the recommendation together in a single lazy
`useState` initialiser on mount (one storage read). `ThemeManager` conditionally renders it
(`{currentView === 'skills' && ...}`) so it unmounts during play and remounts when the child
returns — the init runs again, always reflecting the latest saved state.

### Progress summary (`src/engine/progressSummary.js`) — dashboard view-model

Pure function — no storage reads, no `Date.now()`. Called by `ParentDashboard` after it loads
skill states; keeps all logic out of the component (STANDARDS §2).

**`progressSummary(skillStates, today)`** → `ProgressSummary`:
- Loops over `status:'ready'` skills from the skill map, sorted by grade then order.
- Buckets each into `mastered` (level ≥ `MASTERED_LEVEL`), `inProgress` (0 < level < `MASTERED_LEVEL`),
  or `notStarted` (level 0 / no saved state).
- Each bucket entry: `{ skillId, displayName, icon, subtitle, level }`.
- `masteredCount`, `skillsPractisedCount` (mastered + inProgress), `lastActivity` (friendly
  relative string from the most-recent `lastSeen` across all states, or `null`).

**`formatRelativeDate(lastSeen, today)`** — exported for testing; returns `'today'`,
`'yesterday'`, `'N days ago'`, or `'a while ago'`.

**Tests** (`src/engine/__tests__/progressSummary.test.js`) — empty states, all-three-bucket
mix, entry fields, lastActivity selection + relative formatting, curriculum ordering.

**Deferred outputs** (not in v1): misconception breakdown, activity trends, streak data.

### Feel layer (`src/services/sound.js`) — sound + haptics

The **single source of truth for all audio and haptics**. Components call `playSound(event)` /
`haptic(type)` — they never touch `AudioContext` or `navigator.vibrate` directly (STANDARDS §8).
All calls are fire-and-forget: the service swallows errors silently so autoplay blocks or missing
APIs never crash a child's session.

- **Named events** (callers use these; the service decides the implementation):
  `correct` (rising 3-note chime), `wrong` (single soft low tone — gentle, not a buzzer),
  `hint` (friendly two-note "let me help", plays with the wrong-#1 hint),
  `tap` (brief soft click on button press), `complete` (4-note celebratory fanfare).
- **Haptic type**: `light` (30 ms vibration via Web Vibration API).
- **Swap points** (marked with `// TODO` in the file):
  - *Sound:* replace each `synthMap` entry with `new Audio(url).play()` to use real files — callers unchanged.
  - *Haptics:* replace `hapticMap` bodies with `Capacitor Haptics.impact(...)` — callers unchanged.
- **Mute**: `setSoundMuted(bool)` / `isSoundMuted()` — one flag silences both sound and haptics
  instantly. Sound is ON by default; the session UI exposes a 🔊/🔇 toggle.
- **Wired into**: `SessionPlayer` — tap on every option press; correct/hint/wrong/complete on
  phase transitions via `useEffect` (keyed off `phase` + `hintNonce` so `hint` replays on re-show).

**Tests**: `src/services/__tests__/sound.test.js` (Vitest, node env, globals stubbed) — covers
mute logic, event mapping, note counts, and silent resilience to API failures.

### Utilities (`src/utils/logger.js`)

**`logger.js`** — the single logging path for all new code (STANDARDS §8). `debug`/`info` are
dev-only (stripped in production builds); `warn`/`error` always log. All callers import this;
raw `console.*` calls are banned in new committed code. Non-PII only (children's app, §6).
Existing `console.*` calls in FROZEN legacy code are left as-is (legacy is never edited).

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

## Experiments (decision-pending — not production)

Parallel variants built for kid-testing, kept trivially removable until a decision. They never
replace production; production stays the default.

- **`SkillPathScreen.jsx` — "Journey Path" Home (Screen 3-B).** A vertical winding-path variant of
  the Home screen (medallions alternating left/right on a soft SVG spine, Tinku beside the suggested
  node). **Currently the DEFAULT Home on master** (kid-test in progress); `SkillSelectScreen` is
  reachable via **`?home=cards`** for A/B comparison — same production build, no deploy needed.
  **Data flow is identical to `SkillSelectScreen`** (copied `loadAllSkillStates` + `recommendNext` +
  per-node `isDueForReview`; no new engine calls/logic); pip/label code is intentionally
  **duplicated**, not shared (de-dup only after the decision, §0.2). Tokens only; review-due =
  `review` (teal), mastered = `accent` (amber). The `locked` medallion style exists but is
  **unwired** (ready-only data yields no locked nodes — mirrors "locked cards deferred"). Motion:
  reuses `animate-opt-in` for the node stagger + a repeating `path-pulse` sonar ring on the suggested
  node (reduced-motion off). Smoke test: `__tests__/SkillPathScreen.test.jsx`. **To retire (if
  cards win the kid-test):** swap the ternary in `ThemeManager`, delete `SkillPathScreen.jsx` +
  its test + the `path-pulse` keyframe in `index.css`. **Status:** kid-test pending.

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
- **Test environments:** `node` by default (pure recipes/engine/hooks — fast, no DOM).
  **Component render tests** use **React Testing Library + jsdom**, opted into per-file with a
  `// @vitest-environment jsdom` docblock; `vitest.config.js` includes `@vitejs/plugin-react` for
  the JSX transform. First render test: `src/components/__tests__/SessionPlayer.test.jsx` — mocks
  `useQuizSession` and asserts hint-bubble render invariants (never stacks, always clears on
  correct / next question), guarding the keyed-remount fix. This is the render-test layer CLAUDE.md
  calls for; logic still lives in the pure node-env suites.
