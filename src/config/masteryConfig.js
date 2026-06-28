/**
 * Mastery + spaced-repetition tunables — single source of truth.
 *
 * Every threshold, ratio, and interval lives here so kid-test feedback
 * ("reviews come too often", "mastery too easy") changes a number, not logic.
 * (STANDARDS §8 — centralize constants; DECISIONS — mastery = ~80% at hard across
 * multiple days, then spaced-rep intervals ~1/2/4/7/21 days.)
 */
export const MASTERY = {
  MAX_LEVEL: 5,
  UNLOCK_LEVEL: 3,      // prereq skills unlock at this level (skill map uses this)
  MASTERED_LEVEL: 5,    // enters spaced-rep review, stops appearing in daily practice

  STRONG_RATIO: 0.8,    // ≥ this fraction correct → strong session (level up, bump diff)
  WEAK_RATIO: 0.5,      // < this fraction correct → weak session (level down, ease diff)
  // between WEAK_RATIO and STRONG_RATIO is "middle" — hold level and difficulty

  // When true, reaching MASTERED_LEVEL requires the session to be at the skill's
  // maxDifficulty. Prevents a child reaching mastery on easy questions.
  LEVEL_UP_REQUIRES_HARD: true,

  // Leitner-style review intervals in days.
  // Index advances on a successful review; resets to 0 on a failed review.
  REVIEW_INTERVALS: [1, 2, 4, 7, 21],
};
