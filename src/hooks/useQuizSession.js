/**
 * useQuizSession — React orchestration of one playable session (spec-wire-engine-to-screen.md).
 *
 * The remediation ladder ("never punish", DECISIONS) is implemented as PURE exported functions
 * (`initSession`, `applyAnswer`, `advance`) so the teaching logic is unit-testable without React
 * or a DOM. The hook is a thin wrapper that holds state, times the session, and fires analytics.
 *
 * Mastery wiring (spec-wire-mastery-persistence.md):
 *   - Session START: loads the skill's saved state via progressStore; uses nextWorkingDifficulty
 *     so the child resumes at their adapted level, not always difficulty 1.
 *   - Session END: builds a sessionResult (clock read HERE, not inside the pure engine), calls
 *     applyResult, and saves the new state via progressStore.
 *   - misconceptionTags are accumulated during the session via a ref and included in the result.
 *   - recentParams: kept session-local for now (cross-session repeat-avoidance is a future nicety).
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
import { loadSkillState, saveSkillState } from '../services/progressStore';
import { emptySkillState, applyResult, nextWorkingDifficulty, isMastered } from '../engine/mastery';
import { MASTERY } from '../config/masteryConfig';
import { getSkill } from '../recipes/skillMap';
import logger from '../utils/logger';

const band = (grade) => (grade <= 3 ? 'wonder' : 'explorer');

// Celebratory / reveal pause before auto-advancing to the next question. Tunable: long enough
// for the child to register the green tick + Tinku's reaction, short enough to keep momentum.
export const ADVANCE_DELAY_MS = 1200;

// Soft "read the hint" window after a wrong #1. While it's open, a further WRONG tap just
// RE-SHOWS the hint (mashing reinforces the teaching) instead of escalating to the wrong-#2
// reveal — so a fast tapper never skips the hint. Buttons are never disabled; a CORRECT tap
// always wins instantly. Only a deliberate wrong tap AFTER this window escalates to the reveal.
export const HINT_GRACE_MS = 1000;

// ── Pure state machine (testable without React) ─────────────────────────────────────────

export function initSession(session) {
  return {
    skillId: session.skillId,
    skillName: session.skillName,
    grade: session.grade,
    questions: session.questions,
    index: 0,
    attempts: 0, // deliberate wrong attempts on the current question (grace re-shows don't count)
    phase: 'solving', // solving | correct | hint | reveal | complete
    emotion: 'thinking',
    hint: null,
    hintGrace: false, // inside the soft read-the-hint window (hook opens/closes it via a timer)
    hintNonce: 0, // bumps on every hint (re)emission so the bubble replays its enter animation
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
    // Correct always wins instantly, even mid-grace.
    return {
      ...state,
      phase: 'correct',
      emotion: 'celebrate',
      selectedIndex: optionIndex,
      hint: null,
      hintGrace: false,
      score: state.score + 1,
      lastEvent: { type: 'answered', correct: true, tag: 'none', attemptNumber },
    };
  }

  const tag = q.misconceptions[optionIndex] ?? 'random-slip';

  // Soft window: a wrong tap while the read-window is open RE-SHOWS the tapped distractor's hint
  // and does NOT escalate — mashing reinforces the hint, never skips to the reveal. Attempts are
  // NOT incremented here, so only a deliberate wrong AFTER the window counts toward the reveal.
  if (state.phase === 'hint' && state.hintGrace) {
    return {
      ...state,
      emotion: 'encourage',
      selectedIndex: optionIndex,
      hint: getHint(tag),
      hintNonce: state.hintNonce + 1,
      lastEvent: { type: 'answered', correct: false, tag, attemptNumber, hintTag: tag },
    };
  }

  const attempts = state.attempts + 1;

  if (attempts >= 2) {
    // wrong #2 (a deliberate retry after the read window) → gentle reveal, advance on next()
    return {
      ...state,
      phase: 'reveal',
      emotion: 'encourage',
      attempts,
      selectedIndex: optionIndex,
      revealIndex: q.options.indexOf(q.correctAnswer),
      hint: "Here’s how — let’s see it together!",
      hintGrace: false,
      hintNonce: state.hintNonce + 1,
      lastEvent: { type: 'answered', correct: false, tag, attemptNumber },
    };
  }

  // wrong #1 → targeted hint; open the soft read-window (the hook closes it after HINT_GRACE_MS).
  return {
    ...state,
    phase: 'hint',
    emotion: 'encourage',
    attempts,
    selectedIndex: optionIndex,
    hint: getHint(tag),
    hintGrace: true,
    hintNonce: state.hintNonce + 1,
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
      hintGrace: false,
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
    hintGrace: false,
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
  const hintGraceTimer = useRef(null); // closes the soft read-the-hint window after wrong #1

  // Mastery wiring refs — reset on each session start.
  const skillStateRef = useRef(null);       // loaded SkillState for the active skill
  const misconceptionTagsRef = useRef([]);  // wrong-answer tags collected during this session

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

  const clearHintGrace = () => {
    if (hintGraceTimer.current) {
      clearTimeout(hintGraceTimer.current);
      hintGraceTimer.current = null;
    }
  };

  const build = useCallback(() => {
    // ── Load saved mastery state for this skill (wiring layer reads clock + skill map) ──
    let startDifficulty;
    if (skillId) {
      try {
        const skill = getSkill(skillId);
        const saved = loadSkillState(skillId);
        const loaded = saved ?? emptySkillState(skillId, skill.maxDifficulty);
        skillStateRef.current = loaded;
        startDifficulty = nextWorkingDifficulty(loaded);
      } catch (err) {
        // Unknown skillId or storage failure: start fresh, no mastery update this session.
        logger.warn('[useQuizSession] skill state load failed — starting fresh', err);
        skillStateRef.current = null;
        startDifficulty = undefined;
      }
    } else {
      skillStateRef.current = null;
      startDifficulty = undefined;
    }
    misconceptionTagsRef.current = [];

    const rng = makeRng(seed ?? `${skillId ?? 'any'}:${Date.now()}:${Math.random()}`);
    const session = buildLiteSession(grade, rng, { length, skillId, difficulty: startDifficulty });
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
      clearHintGrace();
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
    clearHintGrace();
    const prev = stateRef.current;
    if (!prev) return;
    const n = advance(prev);

    // Presentational read-out for the session-end celebration's mastery-up beat. Derived from the
    // state applyResult ALREADY computes (level before vs after) — no new mastery/ladder logic,
    // just surfacing what the engine produced so the screen can celebrate it. null when nothing
    // levelled up (or when this session tracked no skill state). View data only.
    let masteryUp = null;

    if (n.phase === 'complete') {
      logEvent('session_complete', {
        skill_id: prev.skillId,
        questions_total: prev.questions.length,
        questions_correct: prev.score,
        duration_sec: Math.round((Date.now() - sessionStartRef.current) / 1000),
      });

      // ── Save mastery (clock read here; pure engine stays clock-free) ──────────────
      if (prev.skillId && skillStateRef.current) {
        const prevState = skillStateRef.current;
        const wasMastered = isMastered(prevState, MASTERY);
        const today = new Date().toISOString().slice(0, 10);
        const difficultyPlayed = Math.max(...prev.questions.map((q) => q.difficulty));
        const sessionResult = {
          skillId: prev.skillId,
          difficultyPlayed,
          questionsTotal: prev.questions.length,
          questionsCorrect: prev.score,
          misconceptionTags: misconceptionTagsRef.current,
          date: today,
        };
        const newSkillState = applyResult(prevState, sessionResult, MASTERY);
        skillStateRef.current = newSkillState;
        saveSkillState(prev.skillId, newSkillState);

        const leveledUp = newSkillState.level > prevState.level;
        const justMastered = !wasMastered && isMastered(newSkillState, MASTERY);
        if (leveledUp || justMastered) {
          masteryUp = { leveledUp, justMastered, level: newSkillState.level, skillName: prev.skillName };
        }
      }
    } else {
      questionStartRef.current = Date.now();
    }

    commit({ ...n, masteryUp });
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
      // Accumulate wrong-answer tags for the session result (ref, not state — no re-render).
      if (!ev.correct) {
        misconceptionTagsRef.current.push(ev.tag);
      }
    }
    commit(nextState);

    // Auto-advance after a correct answer or a wrong-#2 reveal. Wrong #1 (phase 'hint') stays
    // put — that's the teaching moment, the child retries. Buttons are disabled during the
    // pause (phase is correct/reveal → locked in the screen), so no double-tap-through.
    if (nextState.phase === 'correct' || nextState.phase === 'reveal') {
      clearAdvance();
      advanceTimer.current = setTimeout(next, ADVANCE_DELAY_MS);
    } else if (nextState.phase === 'hint' && prev.phase !== 'hint') {
      // Entered the hint (wrong #1): open the soft read-window, then close it. We key off
      // prev.phase so grace re-shows (still phase 'hint') do NOT reset the window — it stays a
      // fixed beat from the first wrong, after which a further wrong escalates to the reveal.
      clearHintGrace();
      hintGraceTimer.current = setTimeout(() => {
        const cur = stateRef.current;
        if (cur && cur.phase === 'hint' && cur.hintGrace) {
          commit({ ...cur, hintGrace: false });
        }
      }, HINT_GRACE_MS);
    }
  };

  const restart = () => {
    clearAdvance();
    clearHintGrace();
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
    hintNonce: state?.hintNonce ?? 0,
    selectedIndex: state?.selectedIndex ?? null,
    revealIndex: state?.revealIndex ?? null,
    score: state?.score ?? 0,
    sessionComplete: state?.phase === 'complete',
    masteryUp: state?.masteryUp ?? null,
    answer,
    next,
    restart,
  };
}
