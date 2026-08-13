import { describe, it, expect } from 'vitest';
import { getSkillVisual } from '../skillStateVisual';

/**
 * The shared state→visual grammar — the single source both Home views (cards + path) consume, so
 * they can't drift. Guards the LOCKED colour rule: review-due is NEVER amber; amber only for
 * mastered-not-due. (DECISIONS 2026-07-05 / 2026-07-15.)
 */
describe('getSkillVisual', () => {
  const base = { level: 0, isDue: false, isSuggested: false, isReviewSuggested: false };

  it('suggested-review → teal ring, loud review cue, loud', () => {
    const v = getSkillVisual({ ...base, level: 5, isDue: true, isSuggested: true, isReviewSuggested: true });
    expect(v).toEqual({ state: 'suggested-review', ring: 'border-review', cue: { kind: 'review', tone: 'loud' }, loud: true });
  });

  it('suggested-frontier → sky ring, suggest cue, loud', () => {
    const v = getSkillVisual({ ...base, level: 2, isSuggested: true });
    expect(v).toEqual({ state: 'suggested-frontier', ring: 'border-learn', cue: { kind: 'suggest', tone: 'loud' }, loud: true });
  });

  it('due-not-suggested → NEUTRAL ring (never amber), MUTED review cue, not loud', () => {
    const v = getSkillVisual({ ...base, level: 5, isDue: true });
    expect(v.ring).toBe('border-primary-soft');
    expect(v.ring).not.toBe('border-accent'); // the amber-while-due violation must never recur
    expect(v.cue).toEqual({ kind: 'review', tone: 'muted' });
    expect(v.loud).toBe(false);
  });

  it('mastered-not-due → amber ring, no cue, not loud', () => {
    const v = getSkillVisual({ ...base, level: 5 });
    expect(v).toEqual({ state: 'mastered', ring: 'border-accent', cue: null, loud: false });
  });

  it('started / idle → neutral ring, no cue', () => {
    expect(getSkillVisual({ ...base, level: 0 })).toEqual({ state: 'idle', ring: 'border-primary-soft', cue: null, loud: false });
    expect(getSkillVisual({ ...base, level: 2 })).toEqual({ state: 'idle', ring: 'border-primary-soft', cue: null, loud: false });
  });

  it('exactly one loud state per node (only the suggested ones)', () => {
    expect(getSkillVisual({ ...base, level: 5, isDue: true }).loud).toBe(false); // due but not suggested
    expect(getSkillVisual({ ...base, level: 5 }).loud).toBe(false);              // mastered
    expect(getSkillVisual({ ...base, level: 2, isSuggested: true }).loud).toBe(true);
  });
});
