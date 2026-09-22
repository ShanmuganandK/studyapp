import { describe, it, expect } from 'vitest';
import { initSession, applyAnswer, advance, currentQuestion } from '../useQuizSession';
import { getHint } from '../../engine/hints';

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

/** A distinct question shape, for asserting the bonus round is a SEPARATE question, not a
 *  scored one replayed. */
function makeBonusStub() {
  return {
    questionText: '1 + 1 = ?',
    correctAnswer: 2,
    options: [2, 3, 9, 5],
    misconceptions: [null, 'off-by-one', 'operator-mixup', 'random-slip'],
    format: 'mcq',
    difficulty: 1,
  };
}

/** Drive a wrong #1 then a deliberate wrong #2 (reveal) — the grace window is simulated closed
 *  in between, same idiom the pre-existing tests use. Returns the post-reveal state. */
function wrongTwice(s, opt1, opt2) {
  s = applyAnswer(s, opt1); // wrong #1 → hint
  s = { ...s, hintGrace: false }; // simulate the hook closing the read-window
  return applyAnswer(s, opt2); // deliberate wrong #2 → reveal, parks the session
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

  it('wrong #1 opens the soft read-window (hintGrace) and bumps hintNonce', () => {
    let s = initSession(makeSession());
    expect(s.hintGrace).toBe(false);
    expect(s.hintNonce).toBe(0);
    s = applyAnswer(s, 1); // wrong #1 → hint
    expect(s.phase).toBe('hint');
    expect(s.hintGrace).toBe(true); // window open; the hook closes it after HINT_GRACE_MS
    expect(s.hintNonce).toBe(1);
  });

  it('a wrong tap DURING the grace window re-shows the hint, does NOT escalate to reveal', () => {
    let s = initSession(makeSession());
    s = applyAnswer(s, 1); // wrong #1 → hint (grace open), tag off-by-one
    const nonceAfter1 = s.hintNonce;
    s = applyAnswer(s, 2); // fast 2nd wrong (operator-mixup) while grace is still open
    expect(s.phase).toBe('hint');            // still teaching — NOT reveal
    expect(s.attempts).toBe(1);              // grace re-shows don't count toward the reveal
    expect(s.hintGrace).toBe(true);          // window stays open (hook owns closing it)
    expect(s.hint).toBe(getHint('operator-mixup')); // shows the newly-tapped distractor's hint
    expect(s.hintNonce).toBe(nonceAfter1 + 1); // re-animates
  });

  it('correct tap during the grace window wins instantly', () => {
    let s = initSession(makeSession());
    s = applyAnswer(s, 1); // wrong #1 → hint (grace open)
    s = applyAnswer(s, 0); // correct while grace open
    expect(s.phase).toBe('correct');
    expect(s.score).toBe(1);
    expect(s.hintGrace).toBe(false);
  });

  it('wrong #2 AFTER the grace window closes → gentle reveal (no penalty)', () => {
    let s = initSession(makeSession());
    s = applyAnswer(s, 1);              // wrong #1 → hint, grace open
    s = { ...s, hintGrace: false };     // simulate the hook closing the read-window
    s = applyAnswer(s, 2);             // deliberate 2nd wrong → reveal
    expect(s.phase).toBe('reveal');
    expect(s.emotion).toBe('encourage');
    expect(s.revealIndex).toBe(0);     // index of the correct option
    expect(s.attempts).toBe(2);
    expect(s.score).toBe(0);
  });

  it('ignores taps while awaiting next() (correct/reveal/complete)', () => {
    let s = initSession(makeSession());
    s = applyAnswer(s, 0); // correct → phase 'correct'
    const again = applyAnswer(s, 1); // should be ignored
    expect(again).toBe(s);
  });

  it('mood floor: a session of all-wrong still ends celebratory, via the bonus round', () => {
    let s = initSession(makeSession());
    s = wrongTwice(s, 1, 2); // Q1: wrong, wrong → reveal, parked
    s = advance(s);
    s = wrongTwice(s, 1, 2); // Q2: wrong, wrong → reveal, parked (still just true)
    // End of the 8-... here 2 scored questions, parked → the bonus round, not straight to complete.
    s = advance(s, { makeBonusQuestion: makeBonusStub });
    expect(s.phase).toBe('solving');
    expect(s.stage).toBe('bonus');
    expect(s.score).toBe(0);
    // The bonus question, answered correctly, still doesn't touch score.
    s = applyAnswer(s, 0);
    expect(s.phase).toBe('correct');
    expect(s.score).toBe(0);
    s = advance(s);
    expect(s.phase).toBe('complete');
    expect(s.emotion).toBe('celebrate'); // never sad
    expect(s.score).toBe(0);
  });

  describe('remediation ladder step 3 — park + bonus question (DECISIONS 2026-09-22)', () => {
    it('parked stays false through a session with no wrong #2 — no bonus round', () => {
      let s = initSession(makeSession());
      s = applyAnswer(s, 0); // Q1 correct
      s = advance(s);
      s = applyAnswer(s, 0); // Q2 correct
      // No makeBonusQuestion supplied — must not be needed, since the session never parked.
      s = advance(s);
      expect(s.parked).toBe(false);
      expect(s.stage).toBe('scored');
      expect(s.phase).toBe('complete');
    });

    it('a single wrong #1 (no reveal) does not park', () => {
      let s = initSession(makeSession());
      s = applyAnswer(s, 1); // wrong #1 → hint only
      expect(s.parked).toBe(false);
    });

    it('a wrong tap during the grace window (re-shown hint, not a real wrong #2) does not park', () => {
      let s = initSession(makeSession());
      s = applyAnswer(s, 1); // wrong #1 → hint, grace open
      s = applyAnswer(s, 2); // fast 2nd wrong while grace is still open — re-shows, doesn't escalate
      expect(s.phase).toBe('hint');
      expect(s.parked).toBe(false);
    });

    it('parked is set on the FIRST wrong #2 (a boolean, not a counter)', () => {
      let s = initSession(makeSession());
      expect(s.parked).toBe(false);
      s = wrongTwice(s, 1, 2);
      expect(s.parked).toBe(true);
    });

    it('a second wrong #2 later in the session leaves parked exactly true — not incremented', () => {
      let s = initSession(makeSession());
      s = wrongTwice(s, 1, 2); // Q1 parks it
      expect(s.parked).toBe(true);
      s = advance(s);
      s = wrongTwice(s, 1, 2); // Q2 reveals again
      expect(s.parked).toBe(true); // still just true — nothing to "increment" to
    });

    it('advance throws rather than silently skipping the bonus round of a parked session', () => {
      let s = initSession(makeSession());
      s = wrongTwice(s, 1, 2);
      s = advance(s);
      s = applyAnswer(s, 0); // Q2 correct → next advance() hits the end, parked, no factory
      const parkedS = s;
      expect(() => advance(parkedS)).toThrow(/makeBonusQuestion/);
    });

    it('the bonus round is a DISTINCT question, never appended to state.questions', () => {
      let s = initSession(makeSession());
      s = wrongTwice(s, 1, 2);
      s = advance(s);
      s = applyAnswer(s, 0);
      s = advance(s, { makeBonusQuestion: makeBonusStub });
      expect(s.questions).toHaveLength(2); // untouched — no 9th entry
      expect(s.bonusQuestion).toEqual(makeBonusStub());
      expect(currentQuestion(s)).toEqual(makeBonusStub());
    });

    it('questionNumber/totalQuestions stay sane through the bonus round (index is frozen)', () => {
      let s = initSession(makeSession());
      s = wrongTwice(s, 1, 2);
      s = advance(s);
      const indexBeforeBonus = s.index;
      s = applyAnswer(s, 0);
      s = advance(s, { makeBonusQuestion: makeBonusStub });
      expect(s.index).toBe(indexBeforeBonus); // did not become a phantom 9th index
    });

    it('the bonus round runs the same ladder: wrong #1 → hint, wrong #2 → reveal', () => {
      let s = initSession(makeSession());
      s = wrongTwice(s, 1, 2);
      s = advance(s);
      s = applyAnswer(s, 0);
      s = advance(s, { makeBonusQuestion: makeBonusStub });
      s = applyAnswer(s, 1); // wrong #1 on the bonus question
      expect(s.phase).toBe('hint');
      s = { ...s, hintGrace: false };
      s = applyAnswer(s, 2); // wrong #2 on the bonus question → reveal
      expect(s.phase).toBe('reveal');
      expect(s.revealIndex).toBe(0);
      expect(s.score).toBe(1); // Q2's correct answer — the bonus's wrongness adds nothing
    });

    it('a wrong bonus answer still completes the session on advance (mood floor holds)', () => {
      let s = initSession(makeSession());
      s = wrongTwice(s, 1, 2);
      s = advance(s);
      s = applyAnswer(s, 0);
      s = advance(s, { makeBonusQuestion: makeBonusStub });
      s = wrongTwice(s, 1, 2); // wrong on the bonus round too
      s = advance(s);
      expect(s.phase).toBe('complete');
      expect(s.emotion).toBe('celebrate');
    });

    it("mastery's inputs (score, questions.length) are IDENTICAL whether or not the bonus round ran", () => {
      // Same 8-... here 2 scored answers (Q1 wrong-wrong, Q2 correct) in both arms; only the
      // second arm actually runs a bonus round. If applyResult's sessionResult (built in the
      // hook from state.score/state.questions.length) can see a difference, this fails.
      const scoredOnly = () => {
        let s = initSession(makeSession());
        s = wrongTwice(s, 1, 2);
        s = advance(s);
        s = applyAnswer(s, 0);
        return advance(s, { makeBonusQuestion: makeBonusStub }); // would throw if never reached
      };
      let withoutBonusRun = scoredOnly(); // stops right as the bonus round begins
      expect(withoutBonusRun.stage).toBe('bonus'); // sanity: parking did happen

      let withBonusRun = withoutBonusRun;
      withBonusRun = applyAnswer(withBonusRun, 0); // answer the bonus correctly
      withBonusRun = advance(withBonusRun); // → complete

      expect(withBonusRun.score).toBe(withoutBonusRun.score);
      expect(withBonusRun.questions).toEqual(withoutBonusRun.questions);
      expect(withBonusRun.questions).toHaveLength(2);
      expect(withBonusRun.score).toBe(1);
    });
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
