# Spec — Practice Composer ("What to practise now?") — pure logic

**Goal:** Use the mastery state across all skills to recommend the best SINGLE skill to practise now, and surface a gentle "suggested next" on the skill screen. Keeps each session focused on one skill (right for ages 5–7 — they learn better focused than blended), while delivering spaced-repetition review and progression by sequencing ACROSS sessions, not within one.

**Design principle (locked):** Single-skill focused sessions. The intelligence is in WHICH skill to recommend (review → frontier → progression), not in blending multiple skills into one session. (Within-session blending is deferred to the older Explorer band, Grades 4–5, where it's age-appropriate.)

**Architecture:** Pure logic in `src/engine/`. Reads skill states (the mastery shape) + the skill map; returns a recommendation. NO persistence, NO UI, NO side effects, date passed in. Config-driven so the priority logic is tunable.

---

## What it does — the recommendation logic

Given all skill states + the skill map + today's date, decide what the child should practise now, in priority order:

1. **DUE REVIEW (highest priority).** Any mastered skill where `isDueForReview(state, today)` → recommend it. (Catch forgetting first — this is spaced repetition delivered as "today, review this.") If several are due, pick the one due longest (most overdue) or lowest interval — config/judgment.

2. **FRONTIER (the main case).** No reviews due → recommend the skill the child is actively learning: a skill that is **unlocked** (prereqs met via `isUnlockedLevel` on prereqs), **started but not mastered** (level 1–4), with the lowest level / most in-progress. This is their current learning edge — where practice does the most good.

3. **NEW UNLOCK (progression).** No frontier in progress (e.g. they mastered everything they've started) → recommend the next **newly unlockable** skill: unlocked (prereqs met) but **not yet started** (level 0), earliest in skill-map order. Start something new.

4. **ALL CAUGHT UP (fallback).** Everything available is mastered and nothing's due → recommend a light review of a mastered skill (e.g. the one closest to due), or signal "all caught up" so the UI can celebrate. No dead end.

Return a structured recommendation, e.g.:
```js
{
  skillId: 'g1.sub.within10',
  reason: 'review' | 'frontier' | 'new' | 'all_caught_up',
  // optional: a kid/parent-friendly label the UI can show
}
```

---

## What to build

### `src/config/composerConfig.js`
```js
export const COMPOSER = {
  // priority order is fixed (review > frontier > new > fallback),
  // but tunables live here:
  PREFER_MOST_OVERDUE_REVIEW: true,   // among due reviews, pick most overdue
  FRONTIER_PICK: 'lowest_level',      // 'lowest_level' | 'skillmap_order'
  // (room to grow: weights, max review backlog, etc.)
};
```

### `src/engine/composer.js` — pure functions
- **`recommendNext(skillStates, skillMap, today, config) → recommendation`**
  The core. Walks the priority logic above. Pure — given the same inputs, same output. `skillStates` is `{ [skillId]: skillState }` (from progressStore, passed in — composer doesn't load it). Uses the mastery helpers (`isMastered`, `isUnlockedLevel`, `isDueForReview`) and the skill map (prereqs, order, status:'ready').
  - Only considers `status:'ready'` skills (don't recommend unbuilt skills).
  - Respects prereqs: a skill is a candidate only if its prereqs are met (prereq skills at `isUnlockedLevel`).
- **`getReviewsDue(skillStates, today) → [skillId]`** — all skills currently due for review (for the UI to badge multiple, and for the recommender).
- **`getFrontierSkills(skillStates, skillMap) → [skillId]`** — unlocked, started-not-mastered skills.
- **(helper) `isPrereqsMet(skillId, skillStates, skillMap) → bool`** — all prereqs at unlock level.

All pure, date passed in, no persistence/UI.

### How the UI uses it later (note — minimal surface this task)
- The SkillSelectScreen can call `recommendNext` (with states from progressStore) to **highlight the suggested skill** — e.g. a gentle "Tinku suggests: [skill] ↻" badge / glow on that card. And `getReviewsDue` to mark due skills (you already show the ↻ pip).
- This task builds the pure recommender + the data; a SMALL UI touch to show the suggestion is in scope (a highlight/badge on the recommended card), but NOT a redesign. Keep it subtle and on-theme.

---

## Tests (`src/engine/__tests__/composer.test.js`) — mostly logic, test thoroughly
- Review priority: a due-for-review skill is recommended even if a frontier skill exists.
- Frontier: no reviews due → recommends the started-not-mastered unlocked skill (lowest level).
- New unlock: no frontier → recommends earliest unlocked-but-unstarted skill.
- All caught up: everything mastered, nothing due → fallback reason 'all_caught_up' (no crash, returns something sensible).
- Prereqs respected: a skill whose prereqs aren't met is never recommended.
- Only ready skills: planned/unbuilt skills never recommended.
- `getReviewsDue` / `getFrontierSkills` return correct sets in mixed states.
- Empty states (brand-new child, no progress) → recommends the first ready, prereq-free skill (the natural starting point).
- Determinism.

## Verify on phone
- Brand-new (no progress): the screen suggests the natural first skill.
- After mastering one skill: the suggestion moves to the next sensible skill (frontier/new).
- When a skill becomes due for review: it gets surfaced as the suggestion (↻).
- The suggestion highlight is gentle/on-theme; the child can still pick ANY skill (suggestion guides, doesn't force).

## Update
- ARCHITECTURE.md: the composer module (purpose, recommendation priority, that it's pure + reads states/skillMap, date passed in), and the suggestion surface on the skill screen.

## Explicitly deferred
- Within-session blending of multiple skills (Explorer band / older kids, later).
- Daily streaks / daily goals / "session of the day" packaging (later).
- The full parent dashboard (separate).
- Forcing the recommendation (we GUIDE via highlight; child retains free choice).

## Why this scope
Turns the mastery data into purposeful guidance — "practise this next" — keeping sessions focused (right for young kids) while ensuring review + progression happen across sessions. Pure, tunable, and it gives the skill screen a warm "Tinku suggests…" without removing the child's agency. Builds directly on the mastery state you just shipped.
