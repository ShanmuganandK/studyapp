import { describe, it, expect } from 'vitest';
import { initSession, applyAnswer, advance } from '../useQuizSession';

// A fixed 2-question session (option 0 is always correct here for easy assertions).
function makeSession() {
  const q = (text, ans, opts, tags) => ({
    questionText: text,
    correctAnswer: ans,
    options: opts,
    misconceptions: tags,
    format: 'mcq',
    difficulty: 1,
  });
  return {
    skillId: 'g1.add.within20',
    skillName: 'Addition within 20',
    grade: 1,
    questions: [
      q('2 + 3 = ?', 5, [5, 6, 1, 8], [null, 'off-by-one', 'operator-mixup', 'random-slip']),
      q('4 + 1 = ?', 5, [5, 4, 9, 7], [null, 'off-by-one', 'operator-mixup', 'random-slip']),
    ],
  };
}

describe('useQuizSession — remediation ladder (pure logic)', () => {
  it('starts solving, thinking, at question 0', () => {
    const s = initSession(makeSession());
    expect(s.phase).toBe('solving');
    expect(s.emotion).toBe('thinking');
    expect(s.index).toBe(0);
    expect(s.score).toBe(0);
  });

  it('correct → celebrate + score++, then advances', () => {
    let s = initSession(makeSession());
    s = applyAnswer(s, 0); // correct
    expect(s.phase).toBe('correct');
    expect(s.emotion).toBe('celebrate');
    expect(s.score).toBe(1);
    expect(s.lastEvent).toMatchObject({ correct: true, tag: 'none', attemptNumber: 1 });

    s = advance(s);
    expect(s.index).toBe(1);
    expect(s.phase).toBe('solving');
    expect(s.emotion).toBe('thinking');
  });

  it('wrong #1 → encourage + hint, stays on the question for a retry', () => {
    let s = initSession(makeSession());
    s = applyAnswer(s, 1); // wrong (off-by-one)
    expect(s.phase).toBe('hint');
    expect(s.emotion).toBe('encourage');
    expect(typeof s.hint).toBe('string');
    expect(s.hint.length).toBeGreaterThan(0);
    expect(s.attempts).toBe(1);
    expect(s.index).toBe(0); // did not advance
    expect(s.lastEvent).toMatchObject({ correct: false, tag: 'off-by-one', attemptNumber: 1, hintTag: 'off-by-one' });
  });

  it('retry correct after a hint still celebrates and scores', () => {
    let s = initSession(makeSession());
    s = applyAnswer(s, 1); // wrong #1 → hint
    s = applyAnswer(s, 0); // retry correct
    expect(s.phase).toBe('correct');
    expect(s.score).toBe(1);
    expect(s.lastEvent.attemptNumber).toBe(2);
  });

  it('wrong #1 locks input (read-beat) so a fast second tap cannot skip the hint', () => {
    let s = initSession(makeSession());
    expect(s.inputLocked).toBe(false);
    s = applyAnswer(s, 1); // wrong #1 → hint
    expect(s.phase).toBe('hint');
    expect(s.inputLocked).toBe(true); // options disabled until the hook clears it after HINT_READ_MS
  });

  it('inputLocked does not carry over from the hint into the next state', () => {
    // correct retry, reveal, and the next question must all clear the lock (no stale `true`).
    let s = initSession(makeSession());
    s = applyAnswer(s, 1);            // hint → locked
    const retry = applyAnswer(s, 0);  // retry correct
    expect(retry.inputLocked).toBe(false);

    let r = applyAnswer(initSession(makeSession()), 1); // hint
    r = applyAnswer(r, 2);            // wrong #2 → reveal
    expect(r.inputLocked).toBe(false);

    const advanced = advance(r);      // next question / complete
    expect(advanced.inputLocked).toBe(false);
  });

  it('wrong #2 → gentle reveal of the correct option, then advances (no penalty)', () => {
    let s = initSession(makeSession());
    s = applyAnswer(s, 1); // wrong #1
    s = applyAnswer(s, 2); // wrong #2
    expect(s.phase).toBe('reveal');
    expect(s.emotion).toBe('encourage');
    expect(s.revealIndex).toBe(0); // index of the correct option
    expect(s.attempts).toBe(2);
    expect(s.score).toBe(0);
  });

  it('ignores taps while awaiting next() (correct/reveal/complete)', () => {
    let s = initSession(makeSession());
    s = applyAnswer(s, 0); // correct → phase 'correct'
    const again = applyAnswer(s, 1); // should be ignored
    expect(again).toBe(s);
  });

  it('mood floor: a session of all-wrong still ends celebratory', () => {
    let s = initSession(makeSession());
    // Q1: wrong twice → reveal → advance
    s = applyAnswer(s, 1);
    s = applyAnswer(s, 2);
    s = advance(s);
    // Q2: wrong twice → reveal → advance → complete
    s = applyAnswer(s, 1);
    s = applyAnswer(s, 2);
    s = advance(s);
    expect(s.phase).toBe('complete');
    expect(s.emotion).toBe('celebrate'); // never sad
    expect(s.score).toBe(0);
  });

  it('completes after the last question', () => {
    let s = initSession(makeSession());
    s = applyAnswer(s, 0);
    s = advance(s); // → Q2
    s = applyAnswer(s, 0);
    s = advance(s); // → complete
    expect(s.phase).toBe('complete');
    expect(s.score).toBe(2);
  });
});
