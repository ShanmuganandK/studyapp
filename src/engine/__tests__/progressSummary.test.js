import { describe, it, expect } from 'vitest';
import { progressSummary, formatRelativeDate } from '../progressSummary.js';
import { emptySkillState } from '../mastery.js';
import { MASTERY } from '../../config/masteryConfig.js';

// All 6 ready skill IDs (reflects skillMap.js `status:'ready'` set)
const READY_IDS = [
  'g1.count.1-9',
  'g1.count.1-20',
  'g1.num.compare20',
  'g1.add.within20',
  'g1.sub.within10',
  'g1.sub.within20',
];
const TOTAL_READY = READY_IDS.length;

const TODAY = '2026-01-15';

// Build a skill state at a given level, optionally with a lastSeen date.
function stateAt(skillId, level, lastSeen = null) {
  return { ...emptySkillState(skillId), level, lastSeen };
}

// ─── Brand-new child ─────────────────────────────────────────────────────────

describe('empty skill states (brand-new child)', () => {
  const summary = progressSummary({}, TODAY);

  it('puts all ready skills into notStarted', () => {
    expect(summary.notStarted).toHaveLength(TOTAL_READY);
  });

  it('has no mastered or inProgress skills', () => {
    expect(summary.mastered).toHaveLength(0);
    expect(summary.inProgress).toHaveLength(0);
  });

  it('has masteredCount 0 and skillsPractisedCount 0', () => {
    expect(summary.masteredCount).toBe(0);
    expect(summary.skillsPractisedCount).toBe(0);
  });

  it('has null lastActivity', () => {
    expect(summary.lastActivity).toBeNull();
  });
});

// ─── Bucketing ───────────────────────────────────────────────────────────────

describe('skill bucketing', () => {
  it('places level MASTERED_LEVEL skill in mastered', () => {
    const states = { 'g1.count.1-9': stateAt('g1.count.1-9', MASTERY.MASTERED_LEVEL, TODAY) };
    const summary = progressSummary(states, TODAY);
    expect(summary.mastered).toHaveLength(1);
    expect(summary.mastered[0].skillId).toBe('g1.count.1-9');
    expect(summary.inProgress).toHaveLength(0);
    expect(summary.notStarted).toHaveLength(TOTAL_READY - 1);
  });

  it('places level 1–4 skills in inProgress', () => {
    const states = {
      'g1.count.1-9': stateAt('g1.count.1-9', 2, TODAY),
      'g1.add.within20': stateAt('g1.add.within20', 4, TODAY),
    };
    const summary = progressSummary(states, TODAY);
    expect(summary.inProgress).toHaveLength(2);
    expect(summary.mastered).toHaveLength(0);
    expect(summary.notStarted).toHaveLength(TOTAL_READY - 2);
  });

  it('places level 0 skills in notStarted', () => {
    const states = { 'g1.count.1-9': stateAt('g1.count.1-9', 0, null) };
    const summary = progressSummary(states, TODAY);
    expect(summary.notStarted).toHaveLength(TOTAL_READY);
  });

  it('handles a mix of all three buckets', () => {
    const states = {
      'g1.count.1-9': stateAt('g1.count.1-9', MASTERY.MASTERED_LEVEL, TODAY),
      'g1.count.1-20': stateAt('g1.count.1-20', 3, TODAY),
    };
    const summary = progressSummary(states, TODAY);
    expect(summary.masteredCount).toBe(1);
    expect(summary.inProgress).toHaveLength(1);
    expect(summary.notStarted).toHaveLength(TOTAL_READY - 2);
    expect(summary.skillsPractisedCount).toBe(2);
  });
});

// ─── Entry fields ─────────────────────────────────────────────────────────────

describe('SkillEntry fields', () => {
  it('carries displayName and icon from the skill map', () => {
    const states = { 'g1.count.1-9': stateAt('g1.count.1-9', 2, TODAY) };
    const entry = progressSummary(states, TODAY).inProgress[0];
    expect(entry.displayName).toBe('Number Party');
    expect(entry.icon).toBe('🎉');
    expect(entry.subtitle).toBe('Numbers 1–9');
  });

  it('carries the current level on inProgress entries', () => {
    const states = { 'g1.count.1-9': stateAt('g1.count.1-9', 3, TODAY) };
    expect(progressSummary(states, TODAY).inProgress[0].level).toBe(3);
  });

  it('carries level 0 on notStarted entries', () => {
    const entry = progressSummary({}, TODAY).notStarted[0];
    expect(entry.level).toBe(0);
  });
});

// ─── lastActivity ─────────────────────────────────────────────────────────────

describe('lastActivity', () => {
  it('picks the most-recent lastSeen across all skills', () => {
    const states = {
      'g1.count.1-9': stateAt('g1.count.1-9', 2, '2026-01-13'),
      'g1.add.within20': stateAt('g1.add.within20', 1, '2026-01-14'),
    };
    expect(progressSummary(states, TODAY).lastActivity).toBe('yesterday');
  });

  it('is null when all lastSeen fields are null', () => {
    const states = { 'g1.count.1-9': { ...emptySkillState('g1.count.1-9'), level: 0, lastSeen: null } };
    expect(progressSummary(states, TODAY).lastActivity).toBeNull();
  });

  it('includes activity from mastered skills when computing lastActivity', () => {
    const states = {
      'g1.count.1-9': stateAt('g1.count.1-9', MASTERY.MASTERED_LEVEL, '2026-01-10'),
    };
    expect(progressSummary(states, TODAY).lastActivity).toBe('5 days ago');
  });
});

// ─── Output is ordered by curriculum order ────────────────────────────────────

describe('ordering', () => {
  it('notStarted is ordered by curriculum order (grade then order)', () => {
    const summary = progressSummary({}, TODAY);
    const ids = summary.notStarted.map((e) => e.skillId);
    // g1.count.1-9 (order 30) should appear before g1.add.within20 (order 41)
    expect(ids.indexOf('g1.count.1-9')).toBeLessThan(ids.indexOf('g1.add.within20'));
  });
});

// ─── formatRelativeDate ───────────────────────────────────────────────────────

describe('formatRelativeDate', () => {
  it('returns "today" when dates match', () => {
    expect(formatRelativeDate('2026-01-15', '2026-01-15')).toBe('today');
  });

  it('returns "yesterday" for 1 day ago', () => {
    expect(formatRelativeDate('2026-01-14', '2026-01-15')).toBe('yesterday');
  });

  it('returns "N days ago" for 2–6 days', () => {
    expect(formatRelativeDate('2026-01-12', '2026-01-15')).toBe('3 days ago');
    expect(formatRelativeDate('2026-01-09', '2026-01-15')).toBe('6 days ago');
  });

  it('returns "a while ago" for 7+ days', () => {
    expect(formatRelativeDate('2026-01-08', '2026-01-15')).toBe('a while ago');
    expect(formatRelativeDate('2025-12-01', '2026-01-15')).toBe('a while ago');
  });

  it('returns "today" for future dates (defensive, edge case)', () => {
    expect(formatRelativeDate('2026-01-16', '2026-01-15')).toBe('today');
  });
});
