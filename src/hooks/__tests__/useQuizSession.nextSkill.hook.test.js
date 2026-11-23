// @vitest-environment jsdom
/**
 * "Next with Tinku →" (celebration screen) must open a DIFFERENT skill the composer recommends, and only
 * after a level-up or mastery. Real hook, real recipe, real jsdom localStorage; only time is faked
 * (same harness as the practice-days and bridge hook tests).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useQuizSession, ADVANCE_DELAY_MS } from '../useQuizSession';
import { saveSkillState } from '../../services/progressStore';
import { emptySkillState } from '../../engine/mastery';
import { MASTERY } from '../../config/masteryConfig';
import { SKILLS } from '../../recipes/skillMap';

const SKILL_ID = 'g1.count.1-9';

function playPerfectSession(result) {
  for (let i = 0; i < 40 && result.current.phase !== 'complete'; i++) {
    const q = result.current.question;
    act(() => result.current.answer(q.options.indexOf(q.correctAnswer)));
    act(() => vi.advanceTimersByTime(ADVANCE_DELAY_MS));
  }
  expect(result.current.phase).toBe('complete');
}

describe('useQuizSession — where "Next with Tinku →" goes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('after mastering a skill, points to a different, ready skill of the same grade, by its kid name', () => {
    const max = SKILLS[SKILL_ID].maxDifficulty;
    saveSkillState(SKILL_ID, {
      ...emptySkillState(SKILL_ID, max),
      level: MASTERY.MASTERED_LEVEL - 1,
      difficulty: max,
    });
    const { result } = renderHook(() => useQuizSession(1, { skillId: SKILL_ID, seed: 'next-1' }));
    playPerfectSession(result);

    const { masteryUp } = result.current;
    expect(masteryUp?.justMastered).toBe(true);
    const next = masteryUp.next;
    expect(next).not.toBeNull();
    expect(next.skillId).not.toBe(SKILL_ID);
    expect(SKILLS[next.skillId].status).toBe('ready');
    expect(SKILLS[next.skillId].grade).toBe(1);
    expect(next.skillName).toBe(SKILLS[next.skillId].displayName);
  });

  it('after a first level-up the skill is still the learning edge, so there is no "next" (Play again leads)', () => {
    const { result } = renderHook(() => useQuizSession(1, { skillId: SKILL_ID, seed: 'next-2' }));
    playPerfectSession(result);
    expect(result.current.masteryUp?.leveledUp).toBe(true);
    expect(result.current.masteryUp.next).toBeNull();
  });
});
