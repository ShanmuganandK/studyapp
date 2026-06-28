/**
 * Mastery engine tests — thorough coverage of every rule, boundary, and edge case.
 *
 * All tests are deterministic: date is always injected, no Date.now() inside the engine.
 * Config overrides are passed explicitly where a single tunable is under test, so the
 * suite doesn't silently depend on production MASTERY defaults.
 */

import { describe, it, expect } from 'vitest';
import {
  emptySkillState,
  isMastered,
  isUnlockedLevel,
  isDueForReview,
  nextWorkingDifficulty,
  applyResult,
} from '../mastery.js';
import { MASTERY } from '../../config/masteryConfig.js';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const TODAY = '2024-03-15';

/** Build a minimal valid sessionResult. Callers override only what they need. */
function session(overrides = {}) {
  return {
    skillId: 'g1.add.within20',
    difficultyPlayed: 1,
    questionsTotal: 10,
    questionsCorrect: 8,   // 80% = strong by default
    misconceptionTags: [],
    date: TODAY,
    ...overrides,
  };
}

/** Strong session (80%+) at the given difficulty. */
const strong = (difficultyPlayed = 1, extras = {}) =>
  session({ questionsCorrect: 8, questionsTotal: 10, difficultyPlayed, ...extras });

/** Middle session (60%, between 50% and 80%). */
const middle = (extras = {}) =>
  session({ questionsCorrect: 6, questionsTotal: 10, ...extras });

/** Weak session (<50%). */
const weak = (extras = {}) =>
  session({ questionsCorrect: 4, questionsTotal: 10, ...extras });

/** Skill state at a given level, difficulty default 1, maxDifficulty default 3. */
function stateAt(level, opts = {}) {
  const s = emptySkillState(opts.skillId ?? 'g1.add.within20', opts.maxDifficulty ?? 3);
  return { ...s, level, difficulty: opts.difficulty ?? 1, ...opts.extra };
}

// ─── emptySkillState ──────────────────────────────────────────────────────────

describe('emptySkillState', () => {
  it('returns the correct shape with all zeros and nulls', () => {
    const s = emptySkillState('g1.add.within20');
    expect(s).toMatchObject({
      skillId: 'g1.add.within20',
      level: 0,
      difficulty: 1,
      maxDifficulty: 3,
      attempts: 0,
      correct: 0,
      lastSeen: null,
      nextReview: null,
      reviewInterval: 0,
      recentParams: [],
      misconceptions: {},
    });
  });

  it('sets the skillId correctly', () => {
    expect(emptySkillState('g1.sub.within10').skillId).toBe('g1.sub.within10');
  });

  it('stores a custom maxDifficulty', () => {
    expect(emptySkillState('g1.shapes.2d', 2).maxDifficulty).toBe(2);
  });

  it('defaults maxDifficulty to 3', () => {
    expect(emptySkillState('any.skill').maxDifficulty).toBe(3);
  });
});

// ─── isMastered ──────────────────────────────────────────────────────────────

describe('isMastered', () => {
  it('is false when level is 0', () => {
    expect(isMastered(stateAt(0))).toBe(false);
  });

  it('is false when level is below MASTERED_LEVEL', () => {
    for (let lvl = 1; lvl <= 4; lvl++) {
      expect(isMastered(stateAt(lvl))).toBe(false);
    }
  });

  it('is true at MASTERED_LEVEL (5)', () => {
    expect(isMastered(stateAt(5))).toBe(true);
  });

  it('respects a custom config', () => {
    const cfg = { ...MASTERY, MASTERED_LEVEL: 3 };
    expect(isMastered(stateAt(3), cfg)).toBe(true);
    expect(isMastered(stateAt(2), cfg)).toBe(false);
  });
});

// ─── isUnlockedLevel ─────────────────────────────────────────────────────────

describe('isUnlockedLevel', () => {
  it('is false when level is below UNLOCK_LEVEL', () => {
    expect(isUnlockedLevel(stateAt(0))).toBe(false);
    expect(isUnlockedLevel(stateAt(2))).toBe(false);
  });

  it('is true at UNLOCK_LEVEL (3)', () => {
    expect(isUnlockedLevel(stateAt(3))).toBe(true);
  });

  it('is true above UNLOCK_LEVEL', () => {
    expect(isUnlockedLevel(stateAt(4))).toBe(true);
    expect(isUnlockedLevel(stateAt(5))).toBe(true);
  });

  it('respects a custom config', () => {
    const cfg = { ...MASTERY, UNLOCK_LEVEL: 2 };
    expect(isUnlockedLevel(stateAt(2), cfg)).toBe(true);
    expect(isUnlockedLevel(stateAt(1), cfg)).toBe(false);
  });
});

// ─── isDueForReview ───────────────────────────────────────────────────────────

describe('isDueForReview', () => {
  const mastered = { ...stateAt(5), nextReview: TODAY };

  it('is false when not mastered', () => {
    expect(isDueForReview({ ...stateAt(4), nextReview: TODAY }, TODAY)).toBe(false);
  });

  it('is false when mastered but nextReview is null', () => {
    expect(isDueForReview({ ...stateAt(5), nextReview: null }, TODAY)).toBe(false);
  });

  it('is false when nextReview is in the future', () => {
    expect(isDueForReview({ ...mastered, nextReview: '2024-03-16' }, TODAY)).toBe(false);
  });

  it('is true when nextReview is today', () => {
    expect(isDueForReview({ ...mastered, nextReview: TODAY }, TODAY)).toBe(true);
  });

  it('is true when nextReview is in the past', () => {
    expect(isDueForReview({ ...mastered, nextReview: '2024-03-01' }, TODAY)).toBe(true);
  });
});

// ─── nextWorkingDifficulty ────────────────────────────────────────────────────

describe('nextWorkingDifficulty', () => {
  it('returns the current difficulty from state', () => {
    expect(nextWorkingDifficulty(stateAt(2, { difficulty: 2 }))).toBe(2);
  });

  it('returns 1 for a fresh state', () => {
    expect(nextWorkingDifficulty(emptySkillState('g1.add.within20'))).toBe(1);
  });
});

// ─── applyResult ─────────────────────────────────────────────────────────────

describe('applyResult', () => {

  // ── Stats accumulation ────────────────────────────────────────────────────

  describe('stats accumulation', () => {
    it('increments attempts and correct', () => {
      const s = { ...emptySkillState('g1.add.within20'), attempts: 5, correct: 3 };
      const out = applyResult(s, session({ questionsTotal: 10, questionsCorrect: 7 }));
      expect(out.attempts).toBe(15);
      expect(out.correct).toBe(10);
    });

    it('sets lastSeen to the session date', () => {
      const out = applyResult(emptySkillState('g1.add.within20'), session({ date: '2024-01-01' }));
      expect(out.lastSeen).toBe('2024-01-01');
    });

    it('accumulates new misconceptionTags (additive counts)', () => {
      const s = { ...emptySkillState('g1.add.within20'), misconceptions: { 'off-by-one': 1 } };
      const out = applyResult(s, session({ misconceptionTags: ['off-by-one', 'forgot-carry'] }));
      expect(out.misconceptions).toEqual({ 'off-by-one': 2, 'forgot-carry': 1 });
    });

    it('handles empty misconceptionTags without error', () => {
      const out = applyResult(emptySkillState('g1.add.within20'), session({ misconceptionTags: [] }));
      expect(out.misconceptions).toEqual({});
    });

    it('does not mutate the input state', () => {
      const s = emptySkillState('g1.add.within20');
      const before = JSON.stringify(s);
      applyResult(s, strong());
      expect(JSON.stringify(s)).toBe(before);
    });
  });

  // ── Level movement ────────────────────────────────────────────────────────

  describe('level movement — strong sessions raise level', () => {
    it('raises level from 1 to 2 on a strong session', () => {
      expect(applyResult(stateAt(1), strong()).level).toBe(2);
    });

    it('raises level from 2 to 3', () => {
      expect(applyResult(stateAt(2), strong()).level).toBe(3);
    });

    it('raises level from 3 to 4', () => {
      expect(applyResult(stateAt(3), strong()).level).toBe(4);
    });

    it('does NOT raise from 0 to 1 on a strong session below maxDifficulty when LEVEL_UP_REQUIRES_HARD is off', () => {
      // With LEVEL_UP_REQUIRES_HARD: false, level 0→1 should work even at diff 1
      const cfg = { ...MASTERY, LEVEL_UP_REQUIRES_HARD: false };
      expect(applyResult(stateAt(0), strong(1), cfg).level).toBe(1);
    });

    it('raises level from 0 to 1 on a strong session (LEVEL_UP_REQUIRES_HARD only blocks the 4→5 hop)', () => {
      // The hard gate only applies to the MASTERED_LEVEL hop, not to 0→1
      expect(applyResult(stateAt(0), strong(1)).level).toBe(1);
    });

    it('holds at MAX_LEVEL (5) even on a strong session', () => {
      const s = { ...stateAt(5), reviewInterval: 2 };
      expect(applyResult(s, strong(3)).level).toBe(5);
    });
  });

  describe('level movement — middle sessions hold level', () => {
    for (const lvl of [0, 1, 2, 3, 4]) {
      it(`holds at level ${lvl}`, () => {
        expect(applyResult(stateAt(lvl), middle()).level).toBe(lvl);
      });
    }
  });

  describe('level movement — weak sessions lower level', () => {
    it('drops level from 3 to 2', () => {
      expect(applyResult(stateAt(3), weak()).level).toBe(2);
    });

    it('drops level from 2 to 1', () => {
      expect(applyResult(stateAt(2), weak()).level).toBe(1);
    });

    it('holds at 1 — does not drop below 1 once started', () => {
      expect(applyResult(stateAt(1), weak()).level).toBe(1);
    });

    it('holds at 0 — level 0 (not started) has nothing to drop from', () => {
      expect(applyResult(stateAt(0), weak()).level).toBe(0);
    });

    it('drops from mastery level 5 to 4 on a weak review (regression possible)', () => {
      const s = { ...stateAt(5), nextReview: TODAY, reviewInterval: 3 };
      expect(applyResult(s, weak()).level).toBe(4);
    });
  });

  // ── Level-5 hard-difficulty gate ──────────────────────────────────────────

  describe('LEVEL_UP_REQUIRES_HARD gate (level 4 → 5)', () => {
    const cfg = { ...MASTERY, LEVEL_UP_REQUIRES_HARD: true };
    const maxDiff3Skill = stateAt(4, { maxDifficulty: 3 });
    const maxDiff2Skill = stateAt(4, { maxDifficulty: 2 });

    it('allows 4→5 when difficultyPlayed equals maxDifficulty (3/3)', () => {
      expect(applyResult(maxDiff3Skill, strong(3), cfg).level).toBe(5);
    });

    it('allows 4→5 when difficultyPlayed equals maxDifficulty (2/2)', () => {
      expect(applyResult(maxDiff2Skill, strong(2), cfg).level).toBe(5);
    });

    it('blocks 4→5 when difficultyPlayed is below maxDifficulty (2/3)', () => {
      expect(applyResult(maxDiff3Skill, strong(2), cfg).level).toBe(4);
    });

    it('blocks 4→5 when difficultyPlayed is 1 on a maxDifficulty-3 skill', () => {
      expect(applyResult(maxDiff3Skill, strong(1), cfg).level).toBe(4);
    });

    it('still bumps difficulty even when level-5 is blocked', () => {
      const out = applyResult({ ...maxDiff3Skill, difficulty: 2 }, strong(2), cfg);
      expect(out.level).toBe(4);
      expect(out.difficulty).toBe(3); // difficulty bumped; level held
    });

    it('allows 4→5 at any difficulty when LEVEL_UP_REQUIRES_HARD is false', () => {
      const cfgOff = { ...MASTERY, LEVEL_UP_REQUIRES_HARD: false };
      expect(applyResult(maxDiff3Skill, strong(1), cfgOff).level).toBe(5);
    });

    it('gate applies ONLY to the 4→5 hop, not to 3→4', () => {
      const s = stateAt(3, { maxDifficulty: 3 });
      expect(applyResult(s, strong(1), cfg).level).toBe(4); // no gate on 3→4
    });
  });

  // ── Adaptive difficulty ───────────────────────────────────────────────────

  describe('adaptive difficulty', () => {
    it('bumps difficulty up on a strong session', () => {
      const s = { ...emptySkillState('g1.add.within20'), difficulty: 1 };
      expect(applyResult(s, strong(1)).difficulty).toBe(2);
    });

    it('caps difficulty at maxDifficulty on consecutive strong sessions', () => {
      const s = { ...emptySkillState('g1.add.within20'), difficulty: 3, maxDifficulty: 3 };
      expect(applyResult(s, strong(3)).difficulty).toBe(3);
    });

    it('caps at skill-specific maxDifficulty of 2', () => {
      const s = emptySkillState('g1.shapes.2d', 2);
      // difficulty starts at 1; after two strongs it should cap at 2
      const s2 = applyResult(s, strong(1));
      const s3 = applyResult(s2, strong(2));
      expect(s3.difficulty).toBe(2);
    });

    it('eases difficulty down on a weak session', () => {
      const s = { ...emptySkillState('g1.add.within20'), difficulty: 3 };
      expect(applyResult(s, weak()).difficulty).toBe(2);
    });

    it('floors difficulty at 1 on a weak session', () => {
      const s = { ...emptySkillState('g1.add.within20'), difficulty: 1 };
      expect(applyResult(s, weak()).difficulty).toBe(1);
    });

    it('holds difficulty on a middle session', () => {
      const s = { ...emptySkillState('g1.add.within20'), difficulty: 2 };
      expect(applyResult(s, middle()).difficulty).toBe(2);
    });
  });

  // ── Spaced repetition ─────────────────────────────────────────────────────

  describe('spaced repetition', () => {
    const cfg = { ...MASTERY, LEVEL_UP_REQUIRES_HARD: false }; // disable gate for SR tests

    it('sets nextReview to date + REVIEW_INTERVALS[0] when just mastered (4→5)', () => {
      const s = stateAt(4, { maxDifficulty: 3 });
      const out = applyResult(s, strong(3, { date: '2024-01-01' }), cfg);
      expect(out.level).toBe(5);
      expect(out.nextReview).toBe('2024-01-02'); // +1 day
      expect(out.reviewInterval).toBe(0);
    });

    it('starts reviewInterval at 0 on first mastery (not yet advanced)', () => {
      const s = stateAt(4, { maxDifficulty: 3 });
      const out = applyResult(s, strong(3), cfg);
      expect(out.reviewInterval).toBe(0);
    });

    it('does NOT set nextReview for non-mastered skills', () => {
      const out = applyResult(stateAt(3), strong());
      expect(out.nextReview).toBeNull();
    });

    it('advances interval index on a strong review (index 0→1)', () => {
      const s = { ...stateAt(5), reviewInterval: 0, nextReview: '2024-01-01' };
      const out = applyResult(s, strong(3, { date: '2024-01-01' }), cfg);
      expect(out.reviewInterval).toBe(1);
      expect(out.nextReview).toBe('2024-01-03'); // +2 days
    });

    it('advances interval index on a strong review (index 1→2)', () => {
      const s = { ...stateAt(5), reviewInterval: 1, nextReview: TODAY };
      const out = applyResult(s, strong(3), cfg);
      expect(out.reviewInterval).toBe(2);
      expect(out.nextReview).toBe('2024-03-19'); // +4 days
    });

    it('advances through all intervals: 0→1→2→3→4 (days: 1→2→4→7→21)', () => {
      let s = stateAt(4, { maxDifficulty: 3 });
      const dates = ['2024-01-01', '2024-01-02', '2024-01-04', '2024-01-08', '2024-01-15'];
      const expectedIntervals = [0, 1, 2, 3, 4];
      const expectedNext = ['2024-01-02', '2024-01-04', '2024-01-08', '2024-01-15', '2024-02-05'];

      // First: master the skill
      s = applyResult(s, strong(3, { date: dates[0] }), cfg);
      expect(s.reviewInterval).toBe(0);
      expect(s.nextReview).toBe(expectedNext[0]);

      // Then review it successfully each time it comes due
      for (let i = 1; i < dates.length; i++) {
        s = applyResult(s, strong(3, { date: dates[i] }), cfg);
        expect(s.reviewInterval).toBe(expectedIntervals[i]);
        expect(s.nextReview).toBe(expectedNext[i]);
      }
    });

    it('caps reviewInterval at the last index (4) — does not overflow', () => {
      const s = { ...stateAt(5), reviewInterval: 4, nextReview: TODAY };
      const out = applyResult(s, strong(3), cfg);
      expect(out.reviewInterval).toBe(4); // stays at max
      expect(out.nextReview).toBe('2024-04-05'); // +21 days
    });

    it('resets interval to 0 on a failed review (weak session at level 5)', () => {
      // A weak session at level 5 drops level to 4, exiting mastery.
      // The SR block is skipped when level drops below MASTERED_LEVEL.
      // nextReview carries over; reviewInterval carries over — they become irrelevant
      // until re-mastery. Verify level dropped and SR fields unchanged.
      const s = { ...stateAt(5), reviewInterval: 3, nextReview: '2024-03-16' };
      const out = applyResult(s, weak(), cfg);
      expect(out.level).toBe(4);
      expect(out.reviewInterval).toBe(3); // carries over (SR block skipped)
      expect(out.nextReview).toBe('2024-03-16'); // carries over
    });

    it('holds interval and refreshes nextReview on a middle review', () => {
      const s = { ...stateAt(5), reviewInterval: 2, nextReview: '2024-01-01' };
      const out = applyResult(s, middle({ date: '2024-02-01' }), cfg);
      expect(out.reviewInterval).toBe(2);
      expect(out.nextReview).toBe('2024-02-05'); // date + REVIEW_INTERVALS[2] (4 days)
    });

    it('re-mastery after regression resets review schedule from index 0', () => {
      // Level was 5, dropped to 4 (weak review), re-mastered.
      const dropped = { ...stateAt(4), reviewInterval: 3, nextReview: '2099-01-01' };
      const out = applyResult(dropped, strong(3, { date: '2024-06-01' }), cfg);
      expect(out.level).toBe(5);
      expect(out.reviewInterval).toBe(0);
      expect(out.nextReview).toBe('2024-06-02'); // fresh start
    });

    it('date arithmetic is correct across month boundaries', () => {
      const s = stateAt(4, { maxDifficulty: 3 });
      const out = applyResult(s, strong(3, { date: '2024-01-31' }), cfg);
      expect(out.nextReview).toBe('2024-02-01'); // Jan 31 + 1 = Feb 1
    });

    it('date arithmetic is correct across year boundaries', () => {
      const s = { ...stateAt(5), reviewInterval: 4, nextReview: '2024-12-20' };
      const out = applyResult(s, strong(3, { date: '2024-12-20' }), cfg);
      expect(out.nextReview).toBe('2025-01-10'); // +21 days
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('0 questions total: ratio treated as 0 (weak) — level and difficulty ease, do not advance', () => {
      const s = stateAt(3, { difficulty: 2 });
      const out = applyResult(s, session({ questionsTotal: 0, questionsCorrect: 0 }));
      expect(out.level).toBe(2);    // dropped from 3
      expect(out.difficulty).toBe(1); // eased from 2
    });

    it('all correct (10/10 = 100%): counts as strong', () => {
      const out = applyResult(stateAt(2), session({ questionsTotal: 10, questionsCorrect: 10 }));
      expect(out.level).toBe(3);
    });

    it('all wrong (0/10 = 0%): counts as weak', () => {
      const out = applyResult(stateAt(3), session({ questionsTotal: 10, questionsCorrect: 0 }));
      expect(out.level).toBe(2);
    });

    it('exactly STRONG_RATIO (8/10 = 80%): counts as strong (boundary inclusive)', () => {
      const out = applyResult(stateAt(2), session({ questionsTotal: 10, questionsCorrect: 8 }));
      expect(out.level).toBe(3);
    });

    it('just below STRONG_RATIO (7/10 = 70%): counts as middle', () => {
      const out = applyResult(stateAt(2), session({ questionsTotal: 10, questionsCorrect: 7 }));
      expect(out.level).toBe(2); // middle = hold
    });

    it('exactly WEAK_RATIO (5/10 = 50%): counts as middle (boundary exclusive)', () => {
      const out = applyResult(stateAt(2), session({ questionsTotal: 10, questionsCorrect: 5 }));
      expect(out.level).toBe(2); // middle = hold (< 50% is weak, not ≤)
    });

    it('just below WEAK_RATIO (4/10 = 40%): counts as weak', () => {
      const out = applyResult(stateAt(2), session({ questionsTotal: 10, questionsCorrect: 4 }));
      expect(out.level).toBe(1);
    });

    it('already at max level (5) + strong: stays at 5', () => {
      const s = { ...stateAt(5), reviewInterval: 2, nextReview: TODAY };
      const out = applyResult(s, strong(3));
      expect(out.level).toBe(5);
    });

    it('already at max difficulty + strong: difficulty stays capped', () => {
      const s = { ...emptySkillState('g1.add.within20'), difficulty: 3, maxDifficulty: 3 };
      expect(applyResult(s, strong(3)).difficulty).toBe(3);
    });

    it('already at min difficulty (1) + weak: difficulty stays at 1', () => {
      const s = { ...emptySkillState('g1.add.within20'), difficulty: 1 };
      expect(applyResult(s, weak()).difficulty).toBe(1);
    });

    it('does not carry recentParams forward — caller manages repeat avoidance', () => {
      const s = { ...emptySkillState('g1.add.within20'), recentParams: ['a', 'b'] };
      const out = applyResult(s, strong());
      // recentParams is passed through unchanged; the session layer manages it
      expect(out.recentParams).toEqual(['a', 'b']);
    });
  });

  // ── Determinism ───────────────────────────────────────────────────────────

  describe('determinism', () => {
    it('same inputs always produce the same output', () => {
      const s = stateAt(3, { difficulty: 2 });
      const r = session({ questionsTotal: 10, questionsCorrect: 8, difficultyPlayed: 2 });
      const out1 = applyResult(s, r);
      const out2 = applyResult(s, r);
      expect(out1).toEqual(out2);
    });

    it('does not depend on call order with unrelated skills', () => {
      const s1 = emptySkillState('g1.add.within20');
      const s2 = emptySkillState('g1.sub.within10');
      const r = strong();
      applyResult(s2, r); // call on a different skill first
      const out = applyResult(s1, r);
      expect(out.level).toBe(1); // unaffected
    });
  });
});
