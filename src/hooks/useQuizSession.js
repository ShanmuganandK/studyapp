/**
 * useQuizSession — React orchestration of one playable session (spec-wire-engine-to-screen.md).
 *
 * The remediation ladder ("never punish", DECISIONS) is implemented as PURE exported functions
 * (`initSession`, `applyAnswer`, `advance`) so the teaching logic is unit-testable without React
 * or a DOM. The hook is a thin wrapper that holds state, times the session, and fires analytics.
 *
 * Ladder:
 *   correct      → Tinku 'celebrate', score++, advance on next()
 *   wrong #1     → Tinku 'encourage', show the chosen distractor's hint, let them retry
 *   wrong #2     → Tinku 'encourage', gently reveal the answer, advance on next() (no penalty)
 *   MOOD FLOOR   → session end is ALWAYS celebratory regardless of score.
 *                  (TODO: full "guaranteed-win last question" deferred per spec.)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { makeRng } from '../recipes/_rng';
import { buildLiteSession } from '../engine/sessionLite';
import { getHint } from '../engine/hints';
import { logEvent } from '../services/analytics';

const band = (grade) => (grade <= 3 ? 'wonder' : 'explorer');

// Celebratory / reveal pause before auto-advancing to the next question. Tunable: long enough
// for the child to register the green tick + Tinku's reaction, short enough to keep momentum.
export const ADVANCE_DELAY_MS = 1200;

// ── Pure state machine (testable without React) ─────────────────────────────────────────

export function initSession(session) {
  return {
    skillId: session.skillId,
    skillName: session.skillName,
    grade: session.grade,
    questions: session.questions,
    index: 0,
    attempts: 0, // wrong attempts on the current question
    phase: 'solving', // solving | correct | hint | reveal | complete
    emotion: 'thinking',
    hint: null,
    selectedIndex: null,
    revealIndex: null,
    score: 0,
    lastEvent: null, // {type, ...} for the hook to translate into analytics
  };
}

/** Apply a tapped option through the remediation ladder. Pure: returns the next state. */
export function applyAnswer(state, optionIndex) {
  // Ignore taps when we're not awaiting an answer (correct/reveal/complete = waiting for next()).
  if (state.phase !== 'solving' && state.phase !== 'hint') return state;

  const q = state.questions[state.index];
  const chosen = q.options[optionIndex];
  const correct = chosen === q.correctAnswer;
  const attemptNumber = state.attempts + 1;

  if (correct) {
    return {
      ...state,
      phase: 'correct',
      emotion: 'celebrate',
      selectedIndex: optionIndex,
      hint: null,
      score: state.score + 1,
      lastEvent: { type: 'answered', correct: true, tag: 'none', attemptNumber },
    };
  }

  const tag = q.misconceptions[optionIndex] ?? 'random-slip';
  const attempts = state.attempts + 1;

  if (attempts >= 2) {
    // wrong #2 → gentle reveal, advance on next()
    return {
      ...state,
      phase: 'reveal',
      emotion: 'encourage',
      attempts,
      selectedIndex: optionIndex,
      revealIndex: q.options.indexOf(q.correctAnswer),
      hint: 'Here’s how — let’s see it together!',
      lastEvent: { type: 'answered', correct: false, tag, attemptNumber },
    };
  }

  // wrong #1 → targeted hint, stay on the question for a retry
  return {
    ...state,
    phase: 'hint',
    emotion: 'encourage',
    attempts,
    selectedIndex: optionIndex,
    hint: getHint(tag),
    lastEvent: { type: 'answered', correct: false, tag, attemptNumber, hintTag: tag },
  };
}

/** Advance to the next question, or complete the session. Pure. */
export function advance(state) {
  const nextIndex = state.index + 1;
  if (nextIndex >= state.questions.length) {
    return {
      ...state,
      phase: 'complete',
      emotion: 'celebrate', // mood floor: always celebratory
      hint: null,
      selectedIndex: null,
      revealIndex: null,
      lastEvent: { type: 'complete' },
    };
  }
  return {
    ...state,
    index: nextIndex,
    attempts: 0,
    phase: 'solving',
    emotion: 'thinking',
    hint: null,
    selectedIndex: null,
    revealIndex: null,
    lastEvent: null,
  };
}

// ── The React hook ──────────────────────────────────────────────────────────────────────

export function useQuizSession(grade, { length = 8, skillId, seed } = {}) {
  const [state, setState] = useState(null);
  // Synchronous source of truth so analytics reads/fires correctly even under StrictMode.
  const stateRef = useRef(null);
  const sessionStartRef = useRef(0);
  const questionStartRef = useRef(0);
  const advanceTimer = useRef(null);

  const commit = (nextState) => {
    stateRef.current = nextState;
    setState(nextState);
  };

  const clearAdvance = () => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  };

  const build = useCallback(() => {
    const rng = makeRng(seed ?? `${skillId ?? 'any'}:${Date.now()}:${Math.random()}`);
    const session = buildLiteSession(grade, rng, { length, skillId });
    sessionStartRef.current = Date.now();
    questionStartRef.current = Date.now();
    commit(initSession(session));
    logEvent('session_start', { skill_id: session.skillId, grade, band: band(grade) });
  }, [grade, length, skillId, seed]);

  useEffect(() => {
    build();
  }, [build]);

  // session_abandoned if the screen unmounts mid-session; also clear any pending advance timer.
  useEffect(
    () => () => {
      clearAdvance();
      const s = stateRef.current;
      if (s && s.skillId && s.phase !== 'complete') {
        logEvent('session_abandoned', {
          skill_id: s.skillId,
          question_index: s.index,
          duration_sec: Math.round((Date.now() - sessionStartRef.current) / 1000),
        });
      }
    },
    [],
  );

  // Advance to the next question (or the session-end screen). Driven by the auto-advance timer
  // after a correct answer or a wrong-#2 reveal — there is no manual "Next" button.
  const next = () => {
    clearAdvance();
    const prev = stateRef.current;
    if (!prev) return;
    const n = advance(prev);
    if (n.phase === 'complete') {
      logEvent('session_complete', {
        skill_id: prev.skillId,
        questions_total: prev.questions.length,
        questions_correct: prev.score,
        duration_sec: Math.round((Date.now() - sessionStartRef.current) / 1000),
      });
    } else {
      questionStartRef.current = Date.now();
    }
    commit(n);
  };

  const answer = (optionIndex) => {
    const prev = stateRef.current;
    if (!prev) return;
    const nextState = applyAnswer(prev, optionIndex);
    if (nextState === prev) return; // tap ignored (e.g. during a pause)

    const ev = nextState.lastEvent;
    const q = prev.questions[prev.index];
    if (ev && ev.type === 'answered') {
      logEvent('question_answered', {
        skill_id: prev.skillId,
        difficulty: q.difficulty,
        correct: ev.correct,
        misconception_tag: ev.tag, // 'none' when correct
        attempt_number: ev.attemptNumber,
        time_to_answer_ms: Date.now() - questionStartRef.current,
        format: q.format,
      });
      if (ev.hintTag) {
        logEvent('hint_shown', {
          skill_id: prev.skillId,
          misconception_tag: ev.hintTag,
          difficulty: q.difficulty,
        });
      }
    }
    commit(nextState);

    // Auto-advance after a correct answer or a wrong-#2 reveal. Wrong #1 (phase 'hint') stays
    // put — that's the teaching moment, the child retries. Buttons are disabled during the
    // pause (phase is correct/reveal → locked in the screen), so no double-tap-through.
    if (nextState.phase === 'correct' || nextState.phase === 'reveal') {
      clearAdvance();
      advanceTimer.current = setTimeout(next, ADVANCE_DELAY_MS);
    }
  };

  const restart = () => {
    clearAdvance();
    logEvent('play_again', { skill_id: stateRef.current?.skillId });
    build();
  };

  const ready = !!state;
  const question = state && state.phase !== 'complete' ? state.questions[state.index] : null;

  return {
    ready,
    empty: ready && state.questions.length === 0,
    skillName: state?.skillName ?? null,
    questionNumber: state ? state.index + 1 : 0,
    totalQuestions: state?.questions.length ?? 0,
    question,
    emotion: state?.emotion ?? 'happy',
    phase: state?.phase ?? 'solving',
    hint: state?.hint ?? null,
    selectedIndex: state?.selectedIndex ?? null,
    revealIndex: state?.revealIndex ?? null,
    score: state?.score ?? 0,
    sessionComplete: state?.phase === 'complete',
    answer,
    next,
    restart,
  };
}
