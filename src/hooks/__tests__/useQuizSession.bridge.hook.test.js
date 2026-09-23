// @vitest-environment jsdom
/**
 * useQuizSession — bridge-in HOOK-level integration test (DECISIONS 2026-09-22).
 *
 * The pure functions (initSession/applyAnswer/advance) are fully covered in
 * useQuizSession.test.js via injected stubs — including the "sessionResult identical on/off"
 * proof. This file exists for claims that need the REAL hook: does the toggle/opt-in/working-
 * rung combination in `build()` actually produce the right bridge (not just `bridgeRungsFor`'s
 * decision in isolation), and does a WRONG bridge answer's misconception tag actually reach
 * mastery's `applyResult` input? `misconceptionTagsRef` is a hook-private ref with no public
 * getter, so the only black-box way to check the second one is to play a full session through
 * completion and read back what actually got SAVED via `progressStore`.
 *
 * Uses REAL timers via `vi.useFakeTimers` (`ADVANCE_DELAY_MS` / `HINT_GRACE_MS`), a REAL skill
 * (`g2.add.2d-nocarry`, real recipe, opted into `strategyRungs`), and REAL jsdom localStorage —
 * nothing about the engine is mocked, only time.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useQuizSession, ADVANCE_DELAY_MS, HINT_GRACE_MS } from '../useQuizSession';
import { emptySkillState } from '../../engine/mastery';
import { saveSkillState, loadSkillState } from '../../services/progressStore';

const SKILL_ID = 'g2.add.2d-nocarry'; // opted into strategyRungs
const OTHER_SKILL_ID = 'g2.add.2d-carry'; // same recipe family, NOT opted in
const GRADE = 2;

function seedWorkingDifficulty(skillId, difficulty) {
  saveSkillState(skillId, { ...emptySkillState(skillId, 3), difficulty });
}

/** Any option index whose value is NOT the correct answer. */
function wrongIndexOf(question) {
  return question.options.findIndex((v) => v !== question.correctAnswer);
}

/** wrong #1 → hint (grace open) → real time past HINT_GRACE_MS closes the window → the SAME
 *  wrong tap again is now a genuine wrong #2 → reveal. Returns the tapped distractor's tag. */
function answerWrongTwice(result) {
  const q = result.current.question;
  const idx = wrongIndexOf(q);
  const tag = q.misconceptions[idx];
  act(() => result.current.answer(idx));
  act(() => vi.advanceTimersByTime(HINT_GRACE_MS));
  act(() => result.current.answer(idx));
  return tag;
}

function answerCorrectly(result) {
  const q = result.current.question;
  act(() => result.current.answer(q.options.indexOf(q.correctAnswer)));
}

function letAdvance() {
  act(() => vi.advanceTimersByTime(ADVANCE_DELAY_MS));
}

describe('useQuizSession — bridge-in hook integration (DECISIONS 2026-09-22)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('rung 3, toggle on: bridge at difficulty 1, then 2, then the 8 scored questions at difficulty 3', () => {
    seedWorkingDifficulty(SKILL_ID, 3);
    const { result } = renderHook(() =>
      useQuizSession(GRADE, { skillId: SKILL_ID, bridgeEnabled: true, seed: 'bridge-hook-1' }),
    );

    expect(result.current.isBridgeQuestion).toBe(true);
    expect(result.current.question.difficulty).toBe(1);
    answerCorrectly(result);
    letAdvance();

    expect(result.current.isBridgeQuestion).toBe(true);
    expect(result.current.question.difficulty).toBe(2);
    answerCorrectly(result);
    letAdvance();

    expect(result.current.isBridgeQuestion).toBe(false);
    expect(result.current.question.difficulty).toBe(3);
  });

  it('rung 1, toggle on: no bridge — the first question is already scored, at difficulty 1', () => {
    seedWorkingDifficulty(SKILL_ID, 1);
    const { result } = renderHook(() =>
      useQuizSession(GRADE, { skillId: SKILL_ID, bridgeEnabled: true, seed: 'bridge-hook-2' }),
    );
    expect(result.current.isBridgeQuestion).toBe(false);
    expect(result.current.question.difficulty).toBe(1);
  });

  it('toggle OFF at rung 3: no bridge, even though the skill opts in', () => {
    seedWorkingDifficulty(SKILL_ID, 3);
    const { result } = renderHook(() =>
      useQuizSession(GRADE, { skillId: SKILL_ID, bridgeEnabled: false, seed: 'bridge-hook-3' }),
    );
    expect(result.current.isBridgeQuestion).toBe(false);
    expect(result.current.question.difficulty).toBe(3);
  });

  it('toggle ON at rung 3 on a skill WITHOUT the opt-in (g2.add.2d-carry): no bridge', () => {
    seedWorkingDifficulty(OTHER_SKILL_ID, 3);
    const { result } = renderHook(() =>
      useQuizSession(GRADE, { skillId: OTHER_SKILL_ID, bridgeEnabled: true, seed: 'bridge-hook-4' }),
    );
    expect(result.current.isBridgeQuestion).toBe(false);
    expect(result.current.question.difficulty).toBe(3);
  });

  it("a WRONG bridge answer's misconception tag never reaches the saved skill state", () => {
    seedWorkingDifficulty(SKILL_ID, 2); // one bridge question, rung 1
    const { result } = renderHook(() =>
      useQuizSession(GRADE, { skillId: SKILL_ID, bridgeEnabled: true, seed: 'bridge-hook-5' }),
    );
    expect(result.current.isBridgeQuestion).toBe(true);
    const bridgeTag = answerWrongTwice(result); // wrong on the bridge question → reveal
    expect(bridgeTag).toBeTruthy();
    letAdvance(); // → scored run

    expect(result.current.isBridgeQuestion).toBe(false);
    // All 8 scored questions correct — the ONLY thing that could show up in `misconceptions` is
    // the bridge's tag, so this isolates the exclusion instead of it hiding among real ones.
    for (let i = 0; i < 8; i++) {
      expect(result.current.sessionComplete).toBe(false);
      answerCorrectly(result);
      letAdvance();
    }
    expect(result.current.sessionComplete).toBe(true);

    const saved = loadSkillState(SKILL_ID);
    expect(saved.attempts).toBe(8); // NOT 9 — the bridge question is excluded from questionsTotal
    expect(saved.correct).toBe(8);
    expect(saved.misconceptions[bridgeTag]).toBeUndefined();
    expect(Object.keys(saved.misconceptions)).toEqual([]); // nothing at all reached mastery
  });

  it('a session with the toggle OFF (baseline) saves the same shape — bridge adds nothing when off', () => {
    seedWorkingDifficulty(SKILL_ID, 3);
    const { result } = renderHook(() =>
      useQuizSession(GRADE, { skillId: SKILL_ID, bridgeEnabled: false, seed: 'bridge-hook-6' }),
    );
    for (let i = 0; i < 8; i++) {
      answerCorrectly(result);
      letAdvance();
    }
    expect(result.current.sessionComplete).toBe(true);
    const saved = loadSkillState(SKILL_ID);
    expect(saved.attempts).toBe(8);
    expect(saved.correct).toBe(8);
  });
});
