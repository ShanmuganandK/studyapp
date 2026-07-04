// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import SessionPlayer from '../SessionPlayer';

/**
 * Render-layer regression test for the hint bubble (the first component/render test in the repo).
 *
 * The remediation LADDER is already unit-tested at the logic layer (useQuizSession / hints).
 * This bug lived only in the RENDERING: `<HintBubble key={hintNonce}>` sat among sibling divs
 * that Screen 1 also keyed (`key={questionNumber}`) for the question/option transitions. Mixing
 * keyed and unkeyed siblings let React orphan the old bubble instead of unmounting it — so a
 * wrong-during-grace re-show STACKED a second bubble, and the bubble LINGERED past a correct
 * answer into the next question.
 *
 * We mock the hook so SessionPlayer is a pure function of the state we feed it, and drive the
 * exact sequence, asserting the invariant: at most ONE hint bubble, and it clears on
 * correct / next question. Guards against a regression if the stable wrapper is ever removed.
 */

let hookValue;
vi.mock('../../hooks/useQuizSession', () => ({
  useQuizSession: () => hookValue,
}));
// Mascot preloads webp assets + Images — irrelevant here; stub to keep the test about structure.
vi.mock('../Mascot', () => ({ default: () => null }));
// Sound/haptics are fire-and-forget side effects.
vi.mock('../../services/sound', () => ({
  playSound: () => {},
  haptic: () => {},
  setSoundMuted: () => {},
  isSoundMuted: () => false,
}));

const QUESTION = { format: 'mcq', questionText: '2 + 2', options: [3, 4, 5, 6], correctAnswer: 4 };

function baseState(overrides = {}) {
  return {
    ready: true,
    empty: false,
    sessionComplete: false,
    skillName: 'Test',
    questionNumber: 1,
    totalQuestions: 8,
    question: QUESTION,
    emotion: 'thinking',
    phase: 'solving',
    hint: null,
    hintNonce: 0,
    selectedIndex: null,
    revealIndex: null,
    score: 0,
    answer: () => {},
    next: () => {},
    restart: () => {},
    ...overrides,
  };
}

const props = { grade: 1, skillId: 'g1.add.within20', onExit: () => {} };
const bubbleCount = () => screen.queryAllByRole('status').length;
const bubbleText = () => screen.queryAllByRole('status')[0]?.textContent ?? '';

describe('SessionPlayer — hint bubble render invariants', () => {
  afterEach(cleanup);

  it('never stacks and always clears the hint bubble across the ladder', () => {
    hookValue = baseState();
    const { rerender } = render(<SessionPlayer {...props} />);
    expect(bubbleCount()).toBe(0); // solving: no hint

    // wrong #1 → exactly one hint
    hookValue = baseState({ phase: 'hint', emotion: 'encourage', hint: 'Hint one', hintNonce: 1, selectedIndex: 0 });
    rerender(<SessionPlayer {...props} />);
    expect(bubbleCount()).toBe(1);
    expect(bubbleText()).toContain('Hint one');

    // wrong #2 during grace (same question, hintNonce bumps) → REPLACES, must not become two
    hookValue = baseState({ phase: 'hint', emotion: 'encourage', hint: 'Hint two', hintNonce: 2, selectedIndex: 1 });
    rerender(<SessionPlayer {...props} />);
    expect(bubbleCount()).toBe(1);
    expect(bubbleText()).toContain('Hint two');

    // correct answer → bubble clears immediately
    hookValue = baseState({ phase: 'correct', emotion: 'celebrate', hint: null, hintNonce: 2, selectedIndex: 1, score: 1 });
    rerender(<SessionPlayer {...props} />);
    expect(bubbleCount()).toBe(0);

    // advance to the next question → still clear (must not linger from the previous question)
    hookValue = baseState({ phase: 'solving', questionNumber: 2, hint: null, hintNonce: 2 });
    rerender(<SessionPlayer {...props} />);
    expect(bubbleCount()).toBe(0);
  });
});
