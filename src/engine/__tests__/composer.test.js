/**
 * Practice composer tests.
 *
 * Uses a small mock skill map (independent of real SKILLS) so tests are
 * self-contained and don't break when the curriculum grows.
 *
 * Mock graph:
 *   skill.a  (grade 1, order 1, no prereqs, ready)
 *   skill.b  (grade 1, order 2, prereqs: [skill.a], ready)
 *   skill.c  (grade 1, order 3, prereqs: [skill.b], ready)
 *   skill.planned (grade 1, order 4, no prereqs, planned — never recommended)
 *
 * All dates are injected; no Date.now() anywhere.
 */

import { describe, it, expect } from 'vitest';
import {
  isPrereqsMet,
  getReviewsDue,
  getFrontierSkills,
  recommendNext,
} from '../composer.js';
import { emptySkillState, isMastered } from '../mastery.js';
import { MASTERY } from '../../config/masteryConfig.js';
import { COMPOSER } from '../../config/composerConfig.js';

// ─── Mock skill map ───────────────────────────────────────────────────────────

const MAP = {
  'skill.a': { id: 'skill.a', name: 'A', grade: 1, order: 1, prereqs: [], recipe: 'a', status: 'ready' },
  'skill.b': { id: 'skill.b', name: 'B', grade: 1, order: 2, prereqs: ['skill.a'], recipe: 'b', status: 'ready' },
  'skill.c': { id: 'skill.c', name: 'C', grade: 1, order: 3, prereqs: ['skill.b'], recipe: 'c', status: 'ready' },
  'skill.planned': { id: 'skill.planned', name: 'Planned', grade: 1, order: 4, prereqs: [], recipe: null, status: 'planned' },
};

const TODAY = '2024-06-15';
const YESTERDAY = '2024-06-14';
const TOMORROW = '2024-06-16';
const LAST_WEEK = '2024-06-08';

// ─── State builders ───────────────────────────────────────────────────────────

/** Fresh state at a given level (defaults: maxDifficulty 3, difficulty 1). */
function stateAt(skillId, level, extra = {}) {
  const s = emptySkillState(skillId);
  return { ...s, level, ...extra };
}

/** Mastered state (level === MASTERED_LEVEL) with a review scheduled. */
function masteredState(skillId, nextReview) {
  return stateAt(skillId, MASTERY.MASTERED_LEVEL, {
    nextReview,
    reviewInterval: 0,
  });
}

/** States map shorthand: pass { skillId: level } for non-mastered, or full state objects. */
function states(...entries) {
  const result = {};
  for (const [id, val] of entries) {
    result[id] = typeof val === 'number' ? stateAt(id, val) : val;
  }
  return result;
}

// ─── isPrereqsMet ─────────────────────────────────────────────────────────────

describe('isPrereqsMet', () => {
  it('returns true for a skill with no prerequisites', () => {
    expect(isPrereqsMet('skill.a', {}, MAP)).toBe(true);
    expect(isPrereqsMet('skill.a', states(['skill.a', 2]), MAP)).toBe(true);
  });

  it('returns false when a prereq has no saved state (counts as locked)', () => {
    // skill.b requires skill.a; no state for skill.a → locked
    expect(isPrereqsMet('skill.b', {}, MAP)).toBe(false);
  });

  it('returns false when a prereq is started but below UNLOCK_LEVEL', () => {
    // UNLOCK_LEVEL = 3; level 2 is not enough
    expect(isPrereqsMet('skill.b', states(['skill.a', 2]), MAP)).toBe(false);
  });

  it('returns true when a prereq is exactly at UNLOCK_LEVEL', () => {
    expect(isPrereqsMet('skill.b', states(['skill.a', MASTERY.UNLOCK_LEVEL]), MAP)).toBe(true);
  });

  it('returns true when a prereq is above UNLOCK_LEVEL (mastered)', () => {
    expect(isPrereqsMet('skill.b', states(['skill.a', masteredState('skill.a', TOMORROW)]), MAP)).toBe(true);
  });

  it('returns false for an unknown skillId', () => {
    expect(isPrereqsMet('skill.unknown', {}, MAP)).toBe(false);
  });

  it('requires ALL prereqs met for a skill with multiple prereqs', () => {
    const MAP2 = {
      ...MAP,
      'skill.multi': { id: 'skill.multi', name: 'Multi', grade: 1, order: 99, prereqs: ['skill.a', 'skill.b'], recipe: 'm', status: 'ready' },
    };
    // Only skill.a at unlock level — skill.b has no state
    expect(isPrereqsMet('skill.multi', states(['skill.a', MASTERY.UNLOCK_LEVEL]), MAP2)).toBe(false);
    // Both at unlock level → true
    expect(
      isPrereqsMet(
        'skill.multi',
        states(['skill.a', MASTERY.UNLOCK_LEVEL], ['skill.b', MASTERY.UNLOCK_LEVEL]),
        MAP2
      )
    ).toBe(true);
  });
});

// ─── getReviewsDue ────────────────────────────────────────────────────────────

describe('getReviewsDue', () => {
  it('returns empty array when there are no skill states', () => {
    expect(getReviewsDue({}, TODAY)).toEqual([]);
  });

  it('returns empty array when no skills are mastered', () => {
    expect(getReviewsDue(states(['skill.a', 2]), TODAY)).toEqual([]);
  });

  it('returns empty array when mastered skill is not yet due (nextReview in future)', () => {
    const s = states(['skill.a', masteredState('skill.a', TOMORROW)]);
    expect(getReviewsDue(s, TODAY)).toEqual([]);
  });

  it('returns the skill when nextReview is exactly today', () => {
    const s = states(['skill.a', masteredState('skill.a', TODAY)]);
    expect(getReviewsDue(s, TODAY)).toContain('skill.a');
  });

  it('returns the skill when nextReview is in the past', () => {
    const s = states(['skill.a', masteredState('skill.a', YESTERDAY)]);
    expect(getReviewsDue(s, TODAY)).toContain('skill.a');
  });

  it('returns multiple overdue skills', () => {
    const s = {
      'skill.a': masteredState('skill.a', YESTERDAY),
      'skill.b': masteredState('skill.b', LAST_WEEK),
    };
    const due = getReviewsDue(s, TODAY);
    expect(due).toHaveLength(2);
    expect(due).toContain('skill.a');
    expect(due).toContain('skill.b');
  });

  it('excludes mastered skills that are not due yet', () => {
    const s = {
      'skill.a': masteredState('skill.a', YESTERDAY), // due
      'skill.b': masteredState('skill.b', TOMORROW),  // not due
    };
    const due = getReviewsDue(s, TODAY);
    expect(due).toContain('skill.a');
    expect(due).not.toContain('skill.b');
  });
});

// ─── getFrontierSkills ────────────────────────────────────────────────────────

describe('getFrontierSkills', () => {
  it('returns empty array for brand-new child (nothing started)', () => {
    expect(getFrontierSkills({}, MAP)).toEqual([]);
  });

  it('returns empty array when started skill has locked prereqs', () => {
    // skill.b started but skill.a not at unlock level → not on frontier
    expect(getFrontierSkills(states(['skill.b', 2]), MAP)).toEqual([]);
  });

  it('returns skill that is started and not mastered with prereqs met', () => {
    const s = states(['skill.a', MASTERY.UNLOCK_LEVEL], ['skill.b', 2]);
    expect(getFrontierSkills(s, MAP)).toContain('skill.b');
  });

  it('excludes planned skills', () => {
    // skill.planned has no prereqs but status 'planned'
    const s = states(['skill.planned', 2]);
    expect(getFrontierSkills(s, MAP)).toEqual([]);
  });

  it('excludes mastered skills', () => {
    const s = states(['skill.a', masteredState('skill.a', TOMORROW)]);
    expect(getFrontierSkills(s, MAP)).toEqual([]);
  });

  it('returns multiple frontier skills sorted by curriculum order', () => {
    // Both skill.a (started) and skill.b (started, prereq met) are on the frontier
    const s = states(
      ['skill.a', 2],
      ['skill.b', stateAt('skill.b', 1)] // skill.b started but skill.a not at unlock level
    );
    // skill.a is on frontier (no prereqs, started, not mastered); skill.b is NOT (skill.a level 2 < UNLOCK_LEVEL=3)
    const frontier = getFrontierSkills(s, MAP);
    expect(frontier).toContain('skill.a');
    expect(frontier).not.toContain('skill.b');
  });

  it('returns skills in grade-then-order sequence', () => {
    const MAP2 = {
      'x': { id: 'x', name: 'X', grade: 1, order: 10, prereqs: [], recipe: 'x', status: 'ready' },
      'y': { id: 'y', name: 'Y', grade: 1, order: 5, prereqs: [], recipe: 'y', status: 'ready' },
    };
    const s = states(['x', 2], ['y', 2]);
    expect(getFrontierSkills(s, MAP2)).toEqual(['y', 'x']); // lower order first
  });
});

// ─── recommendNext — core priority chain ─────────────────────────────────────

describe('recommendNext — brand-new child', () => {
  it('recommends the first ready no-prereq skill with reason "new"', () => {
    const rec = recommendNext({}, MAP, TODAY);
    expect(rec.skillId).toBe('skill.a');
    expect(rec.reason).toBe('new');
  });

  it('never recommends a planned skill even when it has no prereqs', () => {
    // skill.planned has no prereqs but is planned — skill.a should still win
    const rec = recommendNext({}, MAP, TODAY);
    expect(rec.skillId).not.toBe('skill.planned');
  });
});

describe('recommendNext — review priority (highest)', () => {
  it('recommends a due-review skill over an active frontier skill', () => {
    const s = {
      'skill.a': masteredState('skill.a', YESTERDAY), // due for review
      'skill.b': stateAt('skill.b', 2),               // frontier (prereq not unlocked but irrelevant — review wins first)
    };
    const rec = recommendNext(s, MAP, TODAY);
    expect(rec.skillId).toBe('skill.a');
    expect(rec.reason).toBe('review');
  });

  it('picks the most overdue when PREFER_MOST_OVERDUE_REVIEW is true', () => {
    const s = {
      'skill.a': masteredState('skill.a', YESTERDAY),  // overdue by 1 day
      'skill.b': masteredState('skill.b', LAST_WEEK),  // overdue by 7 days — more overdue
    };
    const rec = recommendNext(s, MAP, TODAY);
    expect(rec.skillId).toBe('skill.b'); // last week is earlier (more overdue)
    expect(rec.reason).toBe('review');
  });

  it('picks first in map order when PREFER_MOST_OVERDUE_REVIEW is false', () => {
    const s = {
      'skill.a': masteredState('skill.a', YESTERDAY),
      'skill.b': masteredState('skill.b', LAST_WEEK),
    };
    const cfg = { ...COMPOSER, PREFER_MOST_OVERDUE_REVIEW: false };
    const rec = recommendNext(s, MAP, TODAY, cfg);
    // Without overdue preference, just takes whatever getReviewsDue returns first
    expect(rec.reason).toBe('review');
    expect(['skill.a', 'skill.b']).toContain(rec.skillId);
  });

  it('does not recommend a not-yet-due mastered skill as review', () => {
    const s = {
      'skill.a': masteredState('skill.a', TOMORROW), // not due yet
      'skill.b': stateAt('skill.b', 0),
    };
    // skill.a prereqs met vacuously, level 0 → new unlock
    const rec = recommendNext(s, MAP, TODAY);
    expect(rec.reason).not.toBe('review');
  });
});

describe('recommendNext — frontier (second priority)', () => {
  it('recommends the active frontier skill when nothing is due for review', () => {
    const s = {
      'skill.a': masteredState('skill.a', TOMORROW), // mastered, not due
      'skill.b': stateAt('skill.b', 2),              // started, prereqs met (a is mastered)
    };
    const rec = recommendNext(s, MAP, TODAY);
    expect(rec.skillId).toBe('skill.b');
    expect(rec.reason).toBe('frontier');
  });

  it('picks the lowest-level frontier skill with FRONTIER_PICK="lowest_level"', () => {
    // Both skill.a and skill.b are on the frontier (a has no prereqs, b's prereq is met by a at UNLOCK_LEVEL)
    const s = {
      'skill.a': stateAt('skill.a', 3),  // UNLOCK_LEVEL, on frontier
      'skill.b': stateAt('skill.b', 2),  // lower level (but prereq skill.a is at unlock level)
    };
    const cfg = { ...COMPOSER, FRONTIER_PICK: 'lowest_level' };
    const rec = recommendNext(s, MAP, TODAY, cfg);
    // skill.b is level 2 < skill.a level 3 → should pick skill.b
    expect(rec.skillId).toBe('skill.b');
    expect(rec.reason).toBe('frontier');
  });

  it('picks first in curriculum order with FRONTIER_PICK="skillmap_order"', () => {
    const s = {
      'skill.a': stateAt('skill.a', 3), // on frontier, order 1
      'skill.b': stateAt('skill.b', 2), // on frontier, order 2 (prereq skill.a at UNLOCK_LEVEL)
    };
    const cfg = { ...COMPOSER, FRONTIER_PICK: 'skillmap_order' };
    const rec = recommendNext(s, MAP, TODAY, cfg);
    expect(rec.skillId).toBe('skill.a'); // order 1 comes first
    expect(rec.reason).toBe('frontier');
  });
});

describe('recommendNext — new unlock (third priority)', () => {
  it('recommends the next unlockable unstarted skill', () => {
    const s = {
      'skill.a': masteredState('skill.a', TOMORROW), // mastered, not due
    };
    // skill.b is unlocked (skill.a mastered) but not started → new unlock
    const rec = recommendNext(s, MAP, TODAY);
    expect(rec.skillId).toBe('skill.b');
    expect(rec.reason).toBe('new');
  });

  it('picks the earliest in curriculum order among new unlocks', () => {
    // skill.a and skill.b both newly available (a has no prereqs, b's prereq is met)
    const s = {
      'skill.a': masteredState('skill.a', TOMORROW),
      // skill.b not in states at all → level 0 (not started)
    };
    const rec = recommendNext(s, MAP, TODAY);
    expect(rec.skillId).toBe('skill.b'); // order 2, first unlocked unstarted
    expect(rec.reason).toBe('new');
  });

  it('does not recommend a skill whose prereqs are not met', () => {
    // skill.a at level 2 (below UNLOCK_LEVEL=3), so skill.b prereqs not met
    const s = states(['skill.a', 2]);
    const rec = recommendNext(s, MAP, TODAY);
    // skill.a is frontier (started, not mastered); skill.b is blocked
    expect(rec.skillId).toBe('skill.a');
    expect(rec.reason).toBe('frontier');
  });

  it('never recommends a planned skill as new unlock', () => {
    // Everything in MAP except skill.planned is mastered and not due
    const s = {
      'skill.a': masteredState('skill.a', TOMORROW),
      'skill.b': masteredState('skill.b', TOMORROW),
      'skill.c': masteredState('skill.c', TOMORROW),
    };
    // All ready skills mastered → all_caught_up (skill.planned ignored)
    const rec = recommendNext(s, MAP, TODAY);
    expect(rec.reason).toBe('all_caught_up');
    expect(rec.skillId).not.toBe('skill.planned');
  });
});

describe('recommendNext — all caught up (fallback)', () => {
  it('returns reason "all_caught_up" when everything is mastered and nothing is due', () => {
    const s = {
      'skill.a': masteredState('skill.a', TOMORROW),
      'skill.b': masteredState('skill.b', TOMORROW),
      'skill.c': masteredState('skill.c', TOMORROW),
    };
    const rec = recommendNext(s, MAP, TODAY);
    expect(rec.reason).toBe('all_caught_up');
  });

  it('returns the mastered skill with the nearest upcoming review as skillId', () => {
    const s = {
      'skill.a': masteredState('skill.a', '2024-06-20'), // further away
      'skill.b': masteredState('skill.b', '2024-06-17'), // nearer
      'skill.c': masteredState('skill.c', TOMORROW),     // 2024-06-16, nearest
    };
    const rec = recommendNext(s, MAP, TODAY);
    expect(rec.reason).toBe('all_caught_up');
    expect(rec.skillId).toBe('skill.c'); // closest upcoming review
  });

  it('returns skillId null if somehow no mastered states exist in fallback', () => {
    // Construct an impossible real state: no ready unstarted skills, nothing frontier.
    // Easiest: empty MAP with no skills at all.
    const rec = recommendNext({}, {}, TODAY);
    expect(rec.reason).toBe('all_caught_up');
    expect(rec.skillId).toBeNull();
  });

  it('does not crash on empty skill states', () => {
    expect(() => recommendNext({}, MAP, TODAY)).not.toThrow();
  });
});

// ─── Prereq gating (cross-cutting) ───────────────────────────────────────────

describe('prereq gating', () => {
  it('never recommends skill.b if skill.a is below UNLOCK_LEVEL', () => {
    for (let level = 0; level < MASTERY.UNLOCK_LEVEL; level++) {
      const s = states(['skill.a', level]);
      const rec = recommendNext(s, MAP, TODAY);
      expect(rec.skillId).not.toBe('skill.b');
    }
  });

  it('can recommend skill.b once skill.a reaches UNLOCK_LEVEL', () => {
    const s = {
      'skill.a': masteredState('skill.a', TOMORROW), // mastered (above unlock)
      // skill.b not in states → new unlock
    };
    const rec = recommendNext(s, MAP, TODAY);
    expect(rec.skillId).toBe('skill.b');
  });

  it('respects a three-skill chain: skill.c only available after skill.b unlocked', () => {
    const s = {
      'skill.a': masteredState('skill.a', TOMORROW),
      'skill.b': stateAt('skill.b', MASTERY.UNLOCK_LEVEL), // at unlock, not fully mastered
    };
    // skill.b is on frontier; skill.c prereq (skill.b) is at UNLOCK_LEVEL → skill.c available as new
    // but frontier (skill.b) wins over new (skill.c)
    const rec = recommendNext(s, MAP, TODAY);
    expect(rec.skillId).toBe('skill.b');
    expect(rec.reason).toBe('frontier');

    // Now master skill.b → skill.c becomes new unlock
    const s2 = {
      'skill.a': masteredState('skill.a', TOMORROW),
      'skill.b': masteredState('skill.b', TOMORROW),
    };
    const rec2 = recommendNext(s2, MAP, TODAY);
    expect(rec2.skillId).toBe('skill.c');
    expect(rec2.reason).toBe('new');
  });
});

// ─── Only-ready-skills gating ─────────────────────────────────────────────────

describe('only ready skills', () => {
  it('never recommends a planned skill even when started (edge case)', () => {
    // Give skill.planned a non-zero state — should still never surface
    const s = states(['skill.planned', 2]);
    const rec = recommendNext(s, MAP, TODAY);
    expect(rec.skillId).not.toBe('skill.planned');
  });

  it('correctly skips planned skills when finding the first new unlock', () => {
    // skill.planned has no prereqs; skill.a also has no prereqs and is ready
    const rec = recommendNext({}, MAP, TODAY);
    expect(rec.skillId).toBe('skill.a'); // planned is skipped
    expect(rec.reason).toBe('new');
  });
});

// ─── Determinism ─────────────────────────────────────────────────────────────

describe('determinism', () => {
  it('returns identical results on repeated calls with the same inputs', () => {
    const s = {
      'skill.a': masteredState('skill.a', YESTERDAY),
      'skill.b': stateAt('skill.b', 2),
    };
    const r1 = recommendNext(s, MAP, TODAY);
    const r2 = recommendNext(s, MAP, TODAY);
    const r3 = recommendNext(s, MAP, TODAY);
    expect(r1).toEqual(r2);
    expect(r2).toEqual(r3);
  });

  it('does not mutate skillStates', () => {
    const s = { 'skill.a': stateAt('skill.a', 2) };
    const snapshot = JSON.stringify(s);
    recommendNext(s, MAP, TODAY);
    expect(JSON.stringify(s)).toBe(snapshot);
  });
});

// ─── Integration: real MASTERY config defaults ────────────────────────────────

describe('integration with production MASTERY config', () => {
  it('UNLOCK_LEVEL is 3 — skills unlock at level 3', () => {
    // Verify our test assumptions match the config
    expect(MASTERY.UNLOCK_LEVEL).toBe(3);
    expect(MASTERY.MASTERED_LEVEL).toBe(5);
  });

  it('full progression: new → frontier → review covers all four reasons', () => {
    // Step 1: brand new → 'new'
    const r1 = recommendNext({}, MAP, TODAY);
    expect(r1.reason).toBe('new');

    // Step 2: skill.a started → 'frontier'
    const s2 = states(['skill.a', 1]);
    const r2 = recommendNext(s2, MAP, TODAY);
    expect(r2.reason).toBe('frontier');

    // Step 3: skill.a mastered, skill.b available → 'new'
    const s3 = { 'skill.a': masteredState('skill.a', TOMORROW) };
    const r3 = recommendNext(s3, MAP, TODAY);
    expect(r3.reason).toBe('new');

    // Step 4: skill.a due for review → 'review'
    const s4 = { 'skill.a': masteredState('skill.a', YESTERDAY) };
    const r4 = recommendNext(s4, MAP, TODAY);
    expect(r4.reason).toBe('review');

    // Step 5: all mastered, nothing due → 'all_caught_up'
    const s5 = {
      'skill.a': masteredState('skill.a', TOMORROW),
      'skill.b': masteredState('skill.b', TOMORROW),
      'skill.c': masteredState('skill.c', TOMORROW),
    };
    const r5 = recommendNext(s5, MAP, TODAY);
    expect(r5.reason).toBe('all_caught_up');
  });
});
