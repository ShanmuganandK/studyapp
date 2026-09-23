import { describe, it, expect } from 'vitest';
import { initSession, applyAnswer, advance, currentQuestion, bridgeRungsFor } from '../useQuizSession';
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
  return applyAnswer(s, opt2); // deliberate wrong #2 → reveal, parks the session (scored run only)
}

/** A distinct bridge-question stub at a given difficulty, for asserting order/exclusion. */
function makeBridgeStub(difficulty, correctAnswer = 1) {
  return {
    questionText: `bridge rung ${difficulty}`,
    correctAnswer,
    options: [correctAnswer, correctAnswer + 1, correctAnswer + 7, correctAnswer + 3],
    misconceptions: [null, 'off-by-one', 'operator-mixup', 'random-slip'],
    format: 'mcq',
    difficulty,
  };
}

function makeSessionWithBridge(bridgeQuestions) {
  return { ...makeSession(), bridgeQuestions };
}

/** Play both scored questions correctly, from a state already at stage 'scored', to 'complete'. */
function playScoredCorrectly(s) {
  s = applyAnswer(s, 0);
  s = advance(s);
  s = applyAnswer(s, 0);
  return advance(s, { makeBonusQuestion: makeBonusStub }); // unused unless parked; harmless either way
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

  describe('bridge-in (DECISIONS 2026-09-22)', () => {
    describe('bridgeRungsFor — pure rung-selection decision', () => {
      it('working rung 1 → no bridge, regardless of toggle/opt-in', () => {
        expect(bridgeRungsFor({ bridgeEnabled: true, strategyRungs: true, workingDifficulty: 1 })).toEqual([]);
      });

      it('working rung 2 → exactly one bridge rung: [1]', () => {
        expect(bridgeRungsFor({ bridgeEnabled: true, strategyRungs: true, workingDifficulty: 2 })).toEqual([1]);
      });

      it('working rung 3 → two bridge rungs, ascending: [1, 2]', () => {
        expect(bridgeRungsFor({ bridgeEnabled: true, strategyRungs: true, workingDifficulty: 3 })).toEqual([1, 2]);
      });

      it('toggle off + opted-in skill at rung 3 → no bridge', () => {
        expect(bridgeRungsFor({ bridgeEnabled: false, strategyRungs: true, workingDifficulty: 3 })).toEqual([]);
      });

      it('toggle on + a skill WITHOUT the opt-in at rung 3 → no bridge', () => {
        expect(bridgeRungsFor({ bridgeEnabled: true, strategyRungs: false, workingDifficulty: 3 })).toEqual([]);
      });

      it('an unresolved working difficulty (undefined) → no bridge, never throws', () => {
        expect(bridgeRungsFor({ bridgeEnabled: true, strategyRungs: true, workingDifficulty: undefined })).toEqual([]);
      });
    });

    it('no bridgeQuestions on the session → starts straight in stage "scored"', () => {
      const s = initSession(makeSession());
      expect(s.stage).toBe('scored');
      expect(s.bridgeQuestions).toEqual([]);
    });

    it('bridgeQuestions present → starts in stage "bridge", at bridgeIndex 0, on that question', () => {
      const stubs = [makeBridgeStub(1), makeBridgeStub(2)];
      const s = initSession(makeSessionWithBridge(stubs));
      expect(s.stage).toBe('bridge');
      expect(s.bridgeIndex).toBe(0);
      expect(currentQuestion(s)).toEqual(stubs[0]);
      expect(s.phase).toBe('solving');
    });

    it('advancing through the bridge visits each question in array order, then enters "scored" at index 0', () => {
      const stubs = [makeBridgeStub(1), makeBridgeStub(2)];
      let s = initSession(makeSessionWithBridge(stubs));
      s = applyAnswer(s, 0); // bridge rung 1, correct
      s = advance(s);
      expect(s.stage).toBe('bridge');
      expect(s.bridgeIndex).toBe(1);
      expect(currentQuestion(s)).toEqual(stubs[1]);

      s = applyAnswer(s, 0); // bridge rung 2, correct
      s = advance(s);
      expect(s.stage).toBe('scored');
      expect(s.index).toBe(0);
      expect(currentQuestion(s)).toEqual(makeSession().questions[0]); // the FIRST scored question
    });

    it('a bridge reveal does NOT park; the scored run still parks on its own reveal', () => {
      let s = initSession(makeSessionWithBridge([makeBridgeStub(1)]));
      s = wrongTwice(s, 1, 2);
      expect(s.phase).toBe('reveal');
      expect(s.parked).toBe(false); // must NOT park
      s = advance(s);
      expect(s.stage).toBe('scored');
      s = wrongTwice(s, 1, 2); // now a genuine scored reveal
      expect(s.parked).toBe(true);
    });

    it('a correct bridge answer does not touch score', () => {
      let s = initSession(makeSessionWithBridge([makeBridgeStub(1)]));
      s = applyAnswer(s, 0); // correct
      expect(s.phase).toBe('correct');
      expect(s.score).toBe(0);
    });

    it('sessionResult inputs (score, questions) are IDENTICAL with the bridge on vs off, for the same scored answers', () => {
      // "Off" arm: no bridgeQuestions on the session at all.
      let withoutBridge = initSession(makeSession());
      withoutBridge = playScoredCorrectly(withoutBridge);

      // "On" arm: two bridge questions, one wrong-twice (reveal) then one correct, THEN the same
      // two scored answers. If the bridge could leak into score/questions this diverges.
      let withBridge = initSession(makeSessionWithBridge([makeBridgeStub(1), makeBridgeStub(2)]));
      withBridge = wrongTwice(withBridge, 1, 2); // bridge rung 1: wrong, wrong → reveal
      withBridge = advance(withBridge);
      withBridge = applyAnswer(withBridge, 0); // bridge rung 2: correct
      withBridge = advance(withBridge); // → stage 'scored'
      withBridge = playScoredCorrectly(withBridge);

      expect(withBridge.phase).toBe('complete');
      expect(withBridge.score).toBe(withoutBridge.score);
      expect(withBridge.questions).toEqual(withoutBridge.questions); // difficultyPlayed's only input
      expect(withBridge.parked).toBe(withoutBridge.parked); // both false — the bridge reveal didn't park
      expect(withBridge.score).toBe(2); // sanity: both scored answers really were counted
    });

    it('bridge → 8-... scored → bonus → complete, in one session, still matches the no-bridge result', () => {
      // Same proof as above, but the scored run ALSO parks (so the bonus round runs), exercising
      // bridge + bonus together in one session, end to end.
      let withoutBridge = initSession(makeSession());
      withoutBridge = wrongTwice(withoutBridge, 1, 2); // Q1: reveal, parked
      withoutBridge = advance(withoutBridge);
      withoutBridge = applyAnswer(withoutBridge, 0); // Q2: correct
      withoutBridge = advance(withoutBridge, { makeBonusQuestion: makeBonusStub }); // → bonus
      withoutBridge = applyAnswer(withoutBridge, 0); // bonus: correct
      withoutBridge = advance(withoutBridge); // → complete

      let withBridge = initSession(makeSessionWithBridge([makeBridgeStub(1)]));
      withBridge = applyAnswer(withBridge, 0); // bridge: correct
      withBridge = advance(withBridge); // → stage 'scored'
      withBridge = wrongTwice(withBridge, 1, 2); // Q1: reveal, parked
      withBridge = advance(withBridge);
      withBridge = applyAnswer(withBridge, 0); // Q2: correct
      withBridge = advance(withBridge, { makeBonusQuestion: makeBonusStub }); // → bonus
      withBridge = applyAnswer(withBridge, 0); // bonus: correct
      withBridge = advance(withBridge); // → complete

      expect(withBridge.phase).toBe('complete');
      expect(withoutBridge.phase).toBe('complete');
      expect(withBridge.score).toBe(withoutBridge.score);
      expect(withBridge.questions).toEqual(withoutBridge.questions);
      expect(withBridge.parked).toBe(withoutBridge.parked);
      expect(withBridge.score).toBe(1); // sanity
    });
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
