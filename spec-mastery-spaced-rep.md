# Spec — Mastery Tracking + Spaced Repetition (pure engine)

**Goal:** Turn "play a quiz" into "a system that tracks what a child has learned and brings skills back for review at the right time." This is the foundation the parent dashboard, the daily session composer, and progress-saving all build on.

**Critical design rule: PURE LOGIC, NO PERSISTENCE.** This task builds the mastery/spaced-rep logic as pure functions in `src/engine/`. It does NOT touch Firebase, localStorage, or auth — those are a separate, later task. The pure engine computes new state from old state + a result; *where* that state is stored is someone else's job. This lets us build + test mastery NOW, independent of the auth/Firestore/lawyer track.

**Extendability rule: every tunable is a CONFIG CONSTANT.** Thresholds, intervals, level cutoffs all live in a config module so kid-test feedback ("reviews come too often," "mastery too easy/hard") changes a number, not the logic. (STANDARDS §8.)

---

## Concepts

### Mastery level (per skill)
A level **0–5** capturing how well a child knows a skill:
- **0** = not started
- **1–2** = learning (actively practicing, not yet reliable)
- **3** = competent — **this is the threshold that unlocks dependent skills** (skill map `prereqs` use this)
- **4** = strong
- **5** = mastered — enters long-interval spaced-repetition review, stops appearing in daily practice

### Skill state (the per-skill record the engine reads/writes)
```js
{
  skillId: 'g1.add.within20',
  level: 0,              // 0–5 mastery level
  difficulty: 1,         // current working difficulty 1–maxDifficulty (adaptive)
  attempts: 0,           // total questions attempted
  correct: 0,            // total correct
  lastSeen: null,        // ISO date of last practice
  nextReview: null,      // ISO date this skill is next "due" (spaced rep)
  reviewInterval: 0,     // current interval index/days for spaced rep
  recentParams: [],      // last ~20 question signatures (repeat-avoidance handoff)
  misconceptions: {},    // { tag: count } — which mistakes this child makes (feeds dashboard)
}
```
(This is the shape that will later persist to Firestore at `users/{uid}/children/{childId}/skills/{skillId}` — but THIS task only defines/computes it, doesn't store it.)

### Session result (what a finished session reports to the engine)
```js
{
  skillId, difficultyPlayed, questionsTotal, questionsCorrect,
  misconceptionTags: ['forgot-carry', ...],  // tags triggered this session
  date,  // today (injected, not read from system clock inside pure fns — testability)
}
```

---

## What to build (`src/engine/mastery.js` + `src/config/masteryConfig.js`)

### 1. `src/config/masteryConfig.js` — all tunables in one place
```js
export const MASTERY = {
  MAX_LEVEL: 5,
  UNLOCK_LEVEL: 3,            // dependent skills unlock at this level
  MASTERED_LEVEL: 5,
  // What a session result does to level:
  STRONG_RATIO: 0.8,         // ≥80% correct = strong
  WEAK_RATIO: 0.5,           // <50% = weak (level may drop)
  LEVEL_UP_REQUIRES_HARD: true, // must be at max difficulty to reach level 5
  // Spaced repetition intervals (days), Leitner-style:
  REVIEW_INTERVALS: [1, 2, 4, 7, 21],  // index advances on correct review, resets on fail
};
```

### 2. `src/engine/mastery.js` — pure functions (no side effects, no storage, no Date.now() inside)

- **`applyResult(skillState, sessionResult, config) → newSkillState`**
  The core. Pure: takes current state + a session result + today's date (from sessionResult.date), returns the NEW state. Logic:
  - Update attempts/correct, lastSeen, accumulate misconceptions.
  - **Level movement:** strong session (≥STRONG_RATIO) at/raising toward the skill's difficulty → level up (capped at MAX_LEVEL; reaching MASTERED_LEVEL requires playing at hard difficulty if LEVEL_UP_REQUIRES_HARD). Weak session (<WEAK_RATIO) → level may drop by 1 (never below 1 once started — don't crush a struggling kid back to 0). Middle → hold.
  - **Adaptive difficulty:** strong → bump working difficulty (capped at skill's maxDifficulty); weak → ease difficulty down (min 1). (This is the per-skill difficulty the session uses next time.)
  - **Spaced rep:** if the skill is now at MASTERED_LEVEL (or in review), set nextReview = date + REVIEW_INTERVALS[intervalIndex]; advance intervalIndex on a successful review, reset to 0 on a failed review.

- **`isMastered(skillState, config) → bool`** — level ≥ MASTERED_LEVEL.
- **`isUnlockedLevel(skillState, config) → bool`** — level ≥ UNLOCK_LEVEL (for skill-map prereq checks).
- **`isDueForReview(skillState, today) → bool`** — mastered AND nextReview ≤ today.
- **`nextWorkingDifficulty(skillState) → 1..max`** — what difficulty the next session should use for this skill.
- **`emptySkillState(skillId) → skillState`** — a fresh zeroed state.

All pure. Today's date is always **passed in**, never read from the system clock inside the function (so tests are deterministic).

### 3. How it connects (note for later, don't build the integration now)
- The **session composer** (later task) will read each skill's `nextWorkingDifficulty` and `isDueForReview` to decide what to serve.
- The **persistence layer** (later task) will load skill states before a session and save the `applyResult` output after.
- The **parent dashboard** (later) reads `level` + `misconceptions` per skill.
- This task builds ONLY the pure engine + config + tests. Wiring to sessions/persistence/dashboard is explicitly deferred.

---

## Tests (`src/engine/__tests__/mastery.test.js`) — this is mostly-logic, so test it thoroughly (STANDARDS §3)

- `applyResult`: strong session raises level; weak lowers (but not below 1); middle holds.
- Level 5 requires hard difficulty when LEVEL_UP_REQUIRES_HARD.
- Adaptive difficulty bumps/eases within [1, maxDifficulty].
- Spaced rep: mastered skill gets nextReview = date + interval; successful review advances interval (1→2→4→7→21); failed review resets to 1.
- `isMastered`, `isUnlockedLevel`, `isDueForReview` boundary cases.
- Edge cases: 0 attempts, all-correct, all-wrong, already-max-level, already-min.
- Determinism: same inputs → same outputs (no clock/random inside).

---

## Verify
- `npm run test:run` green (new mastery suite + existing).
- No Firebase/localStorage/auth touched (pure logic only). `git status` confirms only new engine + config + test files.
- Update ARCHITECTURE.md: record the mastery engine (purpose, the skill-state shape, the config, that persistence is separate/later).

## Explicitly deferred (do NOT build now)
- Persistence (Firestore/localStorage) — separate task, lawyer-gated for the auth part.
- Session composer integration — separate task.
- Parent dashboard — separate task.
- The actual "save state between sessions" — needs the persistence layer first.

This task = the pure brain. Storing it and wiring it come after. Build the brain, test it hard, keep every threshold in config.
