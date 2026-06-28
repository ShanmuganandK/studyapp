/**
 * Mastery + spaced-repetition engine — pure functions, no side effects.
 *
 * Rules:
 * - No Firebase, no localStorage, no auth, no React.
 * - Date is always passed in (from sessionResult.date) — never Date.now() — so every
 *   function is deterministic and trivially testable.
 * - maxDifficulty is stored in the skill state (set at creation time from the skill map)
 *   so these functions need no skill-map import, preserving layer separation.
 *
 * The persistence layer (a later task) loads skill states before a session and saves the
 * applyResult output after. This module only computes; it never stores.
 */

import { MASTERY } from '../config/masteryConfig.js';

// ─── Date helpers ────────────────────────────────────────────────────────────

/**
 * Add `days` to an ISO date string (YYYY-MM-DD). Operates in UTC to avoid DST
 * surprises when crossing midnight boundaries.
 */
function addDays(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── State constructor ────────────────────────────────────────────────────────

/**
 * Return a fresh, zeroed skill state.
 *
 * @param {string} skillId
 * @param {number} [maxDifficulty=3] - the skill's curriculum ceiling (from the skill map).
 *   Stored in state so applyResult can cap adaptive difficulty and enforce the
 *   level-5-requires-hard rule without importing skillMap.js.
 * @returns {SkillState}
 */
export function emptySkillState(skillId, maxDifficulty = 3) {
  return {
    skillId,
    level: 0,
    difficulty: 1,        // current working difficulty (1–maxDifficulty)
    maxDifficulty,
    attempts: 0,
    correct: 0,
    lastSeen: null,
    nextReview: null,     // ISO date string; null until first mastery
    reviewInterval: 0,    // index into MASTERY.REVIEW_INTERVALS
    recentParams: [],     // last ~20 question signatures (repeat-avoidance handoff)
    misconceptions: {},   // { tag: count } — which mistakes this child makes
  };
}

// ─── Simple predicates ────────────────────────────────────────────────────────

/** True when the skill is fully mastered (level ≥ MASTERED_LEVEL). */
export function isMastered(skillState, config = MASTERY) {
  return skillState.level >= config.MASTERED_LEVEL;
}

/** True when the skill is at or above the unlock threshold (level ≥ UNLOCK_LEVEL).
 *  Used by the skill map's prereq helpers to determine if dependent skills open up. */
export function isUnlockedLevel(skillState, config = MASTERY) {
  return skillState.level >= config.UNLOCK_LEVEL;
}

/**
 * True when the skill is mastered AND its next review date is today or in the past.
 * ISO date strings sort lexicographically the same as chronologically (YYYY-MM-DD),
 * so string comparison is correct here.
 *
 * @param {SkillState} skillState
 * @param {string} today - ISO date string (YYYY-MM-DD), injected by caller
 */
export function isDueForReview(skillState, today) {
  return (
    isMastered(skillState) &&
    skillState.nextReview !== null &&
    skillState.nextReview <= today
  );
}

/** The difficulty the next session should use for this skill (1–maxDifficulty). */
export function nextWorkingDifficulty(skillState) {
  return skillState.difficulty;
}

// ─── Core engine ─────────────────────────────────────────────────────────────

/**
 * Apply a finished session result to a skill state and return the NEW state.
 * Pure: the input state is never mutated.
 *
 * @param {SkillState} skillState - current state (from persistence or emptySkillState)
 * @param {SessionResult} sessionResult
 *   { skillId, difficultyPlayed, questionsTotal, questionsCorrect,
 *     misconceptionTags: string[], date: string (YYYY-MM-DD) }
 * @param {object} [config] - defaults to MASTERY; pass an override in tests to vary tunables
 * @returns {SkillState} new state
 */
export function applyResult(skillState, sessionResult, config = MASTERY) {
  const {
    questionsTotal,
    questionsCorrect,
    difficultyPlayed,
    misconceptionTags = [],
    date,
  } = sessionResult;

  const {
    MAX_LEVEL,
    MASTERED_LEVEL,
    STRONG_RATIO,
    WEAK_RATIO,
    LEVEL_UP_REQUIRES_HARD,
    REVIEW_INTERVALS,
  } = config;

  // ── 1. Accumulate stats ──────────────────────────────────────────────────

  const attempts = skillState.attempts + questionsTotal;
  const correct = skillState.correct + questionsCorrect;
  const lastSeen = date;

  const misconceptions = { ...skillState.misconceptions };
  for (const tag of misconceptionTags) {
    misconceptions[tag] = (misconceptions[tag] ?? 0) + 1;
  }

  // ── 2. Session strength ──────────────────────────────────────────────────

  // Treat 0-question sessions as weak (ratio = 0) so they never advance progress.
  const ratio = questionsTotal > 0 ? questionsCorrect / questionsTotal : 0;
  const isStrong = ratio >= STRONG_RATIO;
  const isWeak = ratio < WEAK_RATIO;
  // "middle" is the gap between WEAK_RATIO and STRONG_RATIO

  // ── 3. Level movement ────────────────────────────────────────────────────

  let level = skillState.level;

  if (isStrong) {
    const targetLevel = level + 1;
    if (targetLevel <= MAX_LEVEL) {
      if (LEVEL_UP_REQUIRES_HARD && targetLevel === MASTERED_LEVEL) {
        // Reaching mastery requires demonstrating skill at full difficulty.
        if (difficultyPlayed >= skillState.maxDifficulty) {
          level = targetLevel;
        }
        // else: strong session but not at maxDifficulty — hold at current level
      } else {
        level = targetLevel;
      }
    }
    // already at MAX_LEVEL → hold
  } else if (isWeak) {
    // Never below 1 once started; level 0 (not started) has nothing to drop from.
    if (level > 1) {
      level -= 1;
    }
    // level 0 → stays 0; level 1 → stays 1
  }
  // middle → level unchanged

  // ── 4. Adaptive difficulty ───────────────────────────────────────────────

  const maxDiff = skillState.maxDifficulty;
  let difficulty = skillState.difficulty;

  if (isStrong) {
    difficulty = Math.min(difficulty + 1, maxDiff);
  } else if (isWeak) {
    difficulty = Math.max(difficulty - 1, 1);
  }
  // middle → difficulty unchanged

  // ── 5. Spaced repetition ─────────────────────────────────────────────────

  let { nextReview, reviewInterval } = skillState;

  if (level === MASTERED_LEVEL) {
    const wasAlreadyMastered = skillState.level === MASTERED_LEVEL;

    if (!wasAlreadyMastered) {
      // Just reached mastery this session. Start the review schedule from index 0.
      // This was the mastering session, not a review — don't advance the interval yet.
      reviewInterval = 0;
      nextReview = addDays(date, REVIEW_INTERVALS[0]);
    } else {
      // Already mastered: this is a review session.
      if (isStrong) {
        reviewInterval = Math.min(reviewInterval + 1, REVIEW_INTERVALS.length - 1);
      } else if (isWeak) {
        // Weak review: the skill has been forgotten. Reset interval.
        // (Level would normally drop to 4 on a weak session, but this branch is
        // only reachable when level stays at MASTERED_LEVEL — e.g. if config
        // changes make MASTERED_LEVEL < 5. Defensive reset is correct either way.)
        reviewInterval = 0;
      }
      // middle: keep reviewInterval as-is
      nextReview = addDays(date, REVIEW_INTERVALS[reviewInterval]);
    }
  }
  // level < MASTERED_LEVEL: no review scheduling. nextReview carries over from state
  // (it becomes irrelevant since isDueForReview requires isMastered).

  // ── 6. Return new state (never mutate input) ─────────────────────────────

  return {
    ...skillState,
    level,
    difficulty,
    attempts,
    correct,
    lastSeen,
    nextReview,
    reviewInterval,
    misconceptions,
  };
}
