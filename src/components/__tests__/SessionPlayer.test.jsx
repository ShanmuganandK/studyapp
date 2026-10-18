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
// It exposes the size it was given, because "Tinku is never resized" is one of the things under test.
vi.mock('../Mascot', () => ({ default: ({ size, emotion }) => <span data-testid="mascot" data-size={String(size)} data-emotion={emotion} /> }));
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

/**
 * Stage label (DECISIONS 2026-09-23): the frozen "n / 8" counter is replaced by "Warm-up" /
 * "Bonus" during the bridge/bonus stages, same slot and token, unchanged during scored questions.
 */
describe('SessionPlayer — stage label replaces the frozen counter', () => {
  afterEach(cleanup);

  function counterSlot() {
    // The top-bar span that holds either the counter or the stage label — identified by its
    // sibling structure (between "← Skills" and the mute button), not by text, since the text
    // is exactly what varies under test.
    return screen.getByText('← Skills').parentElement.children[1];
  }

  it('bridge question shows "Warm-up", not the counter', () => {
    hookValue = baseState({ isBridgeQuestion: true, questionNumber: 1, totalQuestions: 8 });
    render(<SessionPlayer {...props} />);
    expect(counterSlot().textContent).toBe('Warm-up');
    expect(screen.queryByText('1 / 8')).toBeNull();
  });

  it('the first SCORED question after a bridge shows "1 / 8"', () => {
    hookValue = baseState({ isBridgeQuestion: false, isBonusQuestion: false, questionNumber: 1, totalQuestions: 8 });
    render(<SessionPlayer {...props} />);
    expect(counterSlot().textContent).toBe('1 / 8');
  });

  it('bonus question shows "Bonus", not the frozen "8 / 8"', () => {
    hookValue = baseState({ isBonusQuestion: true, questionNumber: 8, totalQuestions: 8 });
    render(<SessionPlayer {...props} />);
    expect(counterSlot().textContent).toBe('Bonus');
    expect(screen.queryByText('8 / 8')).toBeNull();
  });

  it('toggle off / not parked: counter behaves exactly as on master — "1 / 8" through "8 / 8", label never shown', () => {
    for (let n = 1; n <= 8; n++) {
      hookValue = baseState({ questionNumber: n, totalQuestions: 8 }); // isBridgeQuestion/isBonusQuestion absent, as the real hook leaves them when never set
      const { unmount } = render(<SessionPlayer {...props} />);
      expect(counterSlot().textContent).toBe(`${n} / 8`);
      expect(screen.queryByText('Warm-up')).toBeNull();
      expect(screen.queryByText('Bonus')).toBeNull();
      unmount();
    }
  });

  it('the label carries no amber/review/success/coral token and no star', () => {
    hookValue = baseState({ isBonusQuestion: true });
    render(<SessionPlayer {...props} />);
    const el = counterSlot();
    const forbidden = ['accent', 'review', 'success', 'encourage', 'amber', 'coral'];
    for (const token of forbidden) {
      expect(el.className, `class list "${el.className}" contains "${token}"`).not.toMatch(new RegExp(token));
    }
    expect(el.textContent).not.toContain('⭐');
  });
});

/**
 * The quiz screen's spacing budget (DECISIONS 2026-10-18): showing a hint must not resize or move
 * anything. Tinku keeps the profile's size, the hint has its own reserved slot, and the progress dots
 * fill that slot when there is no hint. (The pixel-level version of this runs in a real browser:
 * `npm run layout:check`.)
 */
describe('SessionPlayer — one spacing budget', () => {
  afterEach(cleanup);
  const mascot = () => screen.getByTestId('mascot');
  const slot = () => screen.getByTestId('hint-slot');
  const pips = () => screen.queryByTestId('quiz-pips');

  it('never resizes Tinku when a hint appears; only his pose changes', () => {
    hookValue = baseState();
    const { rerender } = render(<SessionPlayer {...props} />);
    const restSize = mascot().getAttribute('data-size');
    expect(restSize).toBe('var(--q-mascot)'); // the budget's size, not a number computed here
    expect(mascot().getAttribute('data-emotion')).toBe('thinking');

    hookValue = baseState({ phase: 'hint', emotion: 'encourage', hint: 'A hint', hintNonce: 1, selectedIndex: 0 });
    rerender(<SessionPlayer {...props} />);
    expect(mascot().getAttribute('data-size')).toBe(restSize);
    expect(mascot().getAttribute('data-emotion')).toBe('encourage');
  });

  it('keeps the hint slot in the layout with or without a hint, and the bubble lives inside it', () => {
    hookValue = baseState();
    const { rerender } = render(<SessionPlayer {...props} />);
    expect(slot()).toBeTruthy();
    expect(slot().querySelector('[role="status"]')).toBeNull();

    hookValue = baseState({ phase: 'hint', emotion: 'encourage', hint: 'A hint', hintNonce: 1, selectedIndex: 0 });
    rerender(<SessionPlayer {...props} />);
    expect(slot().querySelector('[role="status"]')?.textContent).toContain('A hint');
  });

  it('fills the slot with progress dots at rest and swaps them for the bubble, one at a time', () => {
    hookValue = baseState({ questionNumber: 3 });
    const { rerender } = render(<SessionPlayer {...props} />);
    expect(slot().contains(pips())).toBe(true);
    const dots = [...pips().querySelectorAll('[data-pip]')].map((d) => d.dataset.pip);
    expect(dots).toEqual(['done', 'done', 'now', 'todo', 'todo', 'todo', 'todo', 'todo']);

    hookValue = baseState({ questionNumber: 3, phase: 'hint', hint: 'A hint', hintNonce: 1, selectedIndex: 0 });
    rerender(<SessionPlayer {...props} />);
    expect(pips()).toBeNull();
  });

  it('shows no dots during the warm-up/bonus rounds, where "n / 8" does not apply', () => {
    hookValue = baseState({ isBridgeQuestion: true });
    const { rerender } = render(<SessionPlayer {...props} />);
    expect(pips()).toBeNull();
    expect(slot()).toBeTruthy(); // the slot itself stays, so the layout is identical
    hookValue = baseState({ isBonusQuestion: true });
    rerender(<SessionPlayer {...props} />);
    expect(pips()).toBeNull();
  });

  it('picks the spacing profile from the grade, once, not per question', () => {
    hookValue = baseState();
    const { container, rerender } = render(<SessionPlayer {...props} grade={1} />);
    const profile = () => container.querySelector('.quiz-grid').dataset.profile;
    expect(profile()).toBe('roomy');
    rerender(<SessionPlayer {...props} grade={2} />);
    expect(profile()).toBe('roomy');
    rerender(<SessionPlayer {...props} grade={3} />);
    expect(profile()).toBe('standard');
  });
});

describe('SessionPlayer — tells the shell when the session ends (bottom nav returns on the summary)', () => {
  afterEach(cleanup);

  it('reports false during questions, true on the summary, and false again on unmount', () => {
    const calls = [];
    const onSessionComplete = (v) => calls.push(v);
    hookValue = baseState();
    const { rerender, unmount } = render(<SessionPlayer {...props} onSessionComplete={onSessionComplete} />);
    expect(calls.at(-1)).toBe(false);

    hookValue = baseState({ sessionComplete: true, score: 8, masteryUp: null });
    rerender(<SessionPlayer {...props} onSessionComplete={onSessionComplete} />);
    expect(calls.at(-1)).toBe(true);

    unmount();
    expect(calls.at(-1)).toBe(false); // leaving the quiz never leaves the shell thinking a session is done
  });
});
