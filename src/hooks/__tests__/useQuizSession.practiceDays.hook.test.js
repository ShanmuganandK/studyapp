// @vitest-environment jsdom
/**
 * A FINISHED session is what counts as a practice day (DECISIONS 2026-10-20); a session left half-way does not.
 * Real hook, real recipe, real jsdom localStorage; only time is faked (same harness as the bridge hook test).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useQuizSession, ADVANCE_DELAY_MS } from '../useQuizSession';
import { loadPracticeDays, localDateString } from '../../services/practiceDays';

const SKILL_ID = 'g1.add.within10';

function answerCorrectly(result) {
  const q = result.current.question;
  act(() => result.current.answer(q.options.indexOf(q.correctAnswer)));
}
function letAdvance() {
  act(() => vi.advanceTimersByTime(ADVANCE_DELAY_MS));
}

describe('useQuizSession records a practice day when a session is finished', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('a session abandoned part-way records nothing', () => {
    const { result } = renderHook(() => useQuizSession(1, { skillId: SKILL_ID, seed: 'pd-1' }));
    answerCorrectly(result);
    letAdvance();
    answerCorrectly(result);
    expect(loadPracticeDays()).toEqual([]);
  });

  it("finishing a session records today's LOCAL date, once, even across a replay", () => {
    const { result } = renderHook(() => useQuizSession(1, { skillId: SKILL_ID, seed: 'pd-2' }));
    for (let i = 0; i < 40 && result.current.phase !== 'complete'; i++) {
      answerCorrectly(result);
      letAdvance();
    }
    expect(result.current.phase).toBe('complete');
    expect(loadPracticeDays()).toEqual([localDateString()]);

    act(() => result.current.restart());
    for (let i = 0; i < 40 && result.current.phase !== 'complete'; i++) {
      answerCorrectly(result);
      letAdvance();
    }
    expect(loadPracticeDays()).toEqual([localDateString()]); // same day: still one entry
  });
});
