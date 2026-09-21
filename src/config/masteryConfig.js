/**
 * Mastery + spaced-repetition tunables — single source of truth.
 *
 * Every threshold, ratio, and interval lives here so kid-test feedback
 * ("reviews come too often", "mastery too easy") changes a number, not logic.
 * (STANDARDS §8 — centralize constants; DECISIONS — mastery = ~80% at hard,
 * then spaced-rep intervals ~1/2/4/7/21 days.)
 *
 * How mastery is earned (DECISIONS 2026-08-27, 2026-08-31, 2026-09-01): both `level` and
 * `difficulty` need consecutive strong sessions before they advance, each on its own counter
 * (LEVEL_UP_STREAK / DIFFICULTY_UP_STREAK). Either axis drops on a single weak session. There is
 * NO elapsed-time gate — consolidation is by streak, not by clock. Reaching MASTERED_LEVEL
 * additionally needs a strong session at the skill's maxDifficulty (LEVEL_UP_REQUIRES_HARD).
 */
export const MASTERY = {
  MAX_LEVEL: 5,
  UNLOCK_LEVEL: 3,      // prereq skills unlock at this level (skill map uses this)
  MASTERED_LEVEL: 5,    // enters spaced-rep review, stops appearing in daily practice

  STRONG_RATIO: 0.8,    // ≥ this fraction correct → strong session (extends the level + difficulty streaks)
  WEAK_RATIO: 0.5,      // < this fraction correct → weak session (level down, ease diff)
  // between WEAK_RATIO and STRONG_RATIO is "middle" — hold level and difficulty, but reset both streaks

  // `level` and `difficulty` are separate axes on separate schedules (DECISIONS 2026-08-27).
  // `difficulty` requires this many CONSECUTIVE strong sessions at the current rung before
  // advancing — a non-strong session resets the streak to 0. `level` has its own, independent
  // streak (LEVEL_UP_STREAK below). Revisit trigger: drop to 1 if two sessions per rung
  // visibly drags (children bored, sessions abandoned).
  DIFFICULTY_UP_STREAK: 2,

  // `level` requires this many CONSECUTIVE strong sessions before each hop, at every level (not
  // just the 4→5 mastery hop) — DECISIONS 2026-09-01. Mirrors DIFFICULTY_UP_STREAK but is a
  // separate constant and a separate counter (`levelStreak`), so the axes stay independently
  // tunable (2026-08-27 decoupling). Any non-strong session resets the streak to 0; a weak session
  // still drops `level` by 1 immediately (streak to climb, single session to fall — deliberate).
  // If the streak is met but the mastery hop's hard-difficulty requirement isn't, the streak HOLDS
  // at its cap so the next strong session at hard fires the hop. Revisit trigger: if 2 visibly
  // drags for a strong learner, or fails to meaningfully help archetype-5-shaped children in the
  // simulation (claude-chat/mastery-simulation-report.md), tune on evidence.
  LEVEL_UP_STREAK: 2,

  // When true, reaching MASTERED_LEVEL requires the session to be at the skill's
  // maxDifficulty. Prevents a child reaching mastery on easy questions.
  LEVEL_UP_REQUIRES_HARD: true,

  // Leitner-style review intervals in days.
  // Index advances on a successful review; resets to 0 on a failed review.
  REVIEW_INTERVALS: [1, 2, 4, 7, 21],
};
