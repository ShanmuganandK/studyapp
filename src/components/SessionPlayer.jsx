import { useEffect, useState } from 'react';
import { useQuizSession } from '../hooks/useQuizSession';
import { playSound, haptic, setSoundMuted, isSoundMuted } from '../services/sound';
import Mascot from './Mascot';
import QuestionView from './QuestionView';
import HintBubble from './HintBubble';
import KidButton from './KidButton';
import QuizPips from './QuizPips';
import CelebrationScreen from './CelebrationScreen';
import { quizProfileForGrade } from '../config/quizLayout';

/**
 * SessionPlayer — drives one playable session via useQuizSession and renders it.
 * Presentational: all logic (remediation ladder, scoring, analytics) is in the hook.
 * Styled entirely from design tokens (theme-wonder) — no raw hex (UI overhaul, Screen 1).
 *
 * Sound/haptic events (all fire-and-forget via sound service — never block the UI):
 *   tap     → every option button press (immediate tactile feedback)
 *   correct → phase transitions to 'correct'
 *   hint    → wrong #1 (soft 'let me help' — plays on each hint (re)emission via hintNonce)
 *   wrong   → wrong #2 reveal
 *   complete → phase transitions to 'complete' (session end)
 */
export default function SessionPlayer({ grade, skillId, onExit, bridgeEnabled = false }) {
  const s = useQuizSession(grade, { skillId, bridgeEnabled });

  // Mute toggle state — initialised from the service so it survives hot reloads.
  const [muted, setMuted] = useState(isSoundMuted);

  function toggleMute() {
    const next = !muted;
    setSoundMuted(next);
    setMuted(next);
  }

  // Fire sound events on phase transitions. Also depends on hintNonce so the friendly 'hint'
  // sound replays on each hint re-show (a wrong tap during the soft window), reinforcing it.
  // 'solving' is the neutral phase (question loading) — no sound fires for it.
  useEffect(() => {
    if (s.phase === 'correct') {
      playSound('correct');
      haptic('light');
    } else if (s.phase === 'hint') {
      playSound('hint'); // soft 'let me help' — Tinku is here to help, not a buzzer
    } else if (s.phase === 'reveal') {
      playSound('wrong');
    } else if (s.phase === 'complete') {
      playSound('complete');
    }
  }, [s.phase, s.hintNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s.ready) {
    return (
      <Centered>
        <Mascot emotion="thinking" size={100} />
        <p className="text-muted text-sm mt-3">Getting ready…</p>
      </Centered>
    );
  }
  if (s.empty) {
    return (
      <Centered>
        <Mascot emotion="happy" size={120} />
        <p className="text-ink mt-4">No ready skills for this grade yet!</p>
        <PrimaryButton onClick={onExit}>Back</PrimaryButton>
      </Centered>
    );
  }
  if (s.sessionComplete) {
    return (
      <CelebrationScreen
        score={s.score}
        total={s.totalQuestions}
        masteryUp={s.masteryUp}
        onPlayAgain={s.restart}
        onExit={onExit}
      />
    );
  }

  // Options are only locked during the post-answer pause (correct / wrong-#2 reveal). The
  // wrong-#1 hint keeps them live — the child retries freely; the soft window (in the hook)
  // makes a fast wrong tap re-show the hint instead of skipping it.
  const locked = s.phase === 'correct' || s.phase === 'reveal';

  // ONE spacing budget (see `.quiz-stage` in index.css, DECISIONS 2026-10-18). Tinku is NOT resized when
  // a hint shows: the hint has its own reserved slot, so Tinku, the question and the tiles stay put and
  // only his pose changes. The profile is chosen per grade, never per question.
  const profile = quizProfileForGrade(grade);
  const showPips = !s.isBridgeQuestion && !s.isBonusQuestion;

  // Compare blank fills with the CORRECT sign so the statement completes: green on a correct
  // answer, sky/learn on the wrong-#2 reveal ("here's how"). null → dashed placeholder. Existing
  // view-state only (phase); QuestionView ignores it for formats without a blank.
  const blankFill = s.phase === 'correct' ? 'correct' : s.phase === 'reveal' ? 'reveal' : null;

  return (
    <div className="quiz-stage h-full overflow-hidden bg-bg px-5 pt-1 pb-2">
     <div className="quiz-grid" data-profile={profile}>
      {/* Top bar: back · progress counter · mute toggle */}
      <div data-q="bar" className="flex items-center justify-between">
        <button onClick={onExit} className="text-sm font-semibold text-muted hover:text-ink transition-colors">
          ← Skills
        </button>
        <span className="text-sm font-bold text-primary">
          {/* Stage label replaces the counter during the bridge/bonus rounds (DECISIONS
              2026-09-23): `state.index` is frozen through both, so "n / 8" would misread there
              (a rung-3 bridge shows "1 / 8" three times in a row; a parked bonus round freezes
              at "8 / 8"). Same slot, same token, no amber/review/success/coral, no ⭐ — this is
              a mood-floor/warm-up beat, not a reward. Scored questions are unchanged: "1 / 8"
              first appears on the first question that actually counts. */}
          {s.isBridgeQuestion ? 'Warm-up' : s.isBonusQuestion ? 'Bonus' : `${s.questionNumber} / ${s.totalQuestions}`}
        </span>
        <MuteButton muted={muted} onToggle={toggleMute} />
      </div>

      {/* Tinku's stage: decorative. A soft ground ellipse sits beneath him so he feels IN the world
          (he breathes/floats above it) rather than pasted on. His size is the profile's, always. */}
      <div data-q="mascot" className="relative flex flex-col items-center justify-end">
        <Mascot emotion={s.emotion} size="var(--q-mascot)" />
        <div aria-hidden="true" className="tinku-ground h-3 w-2/5 max-w-[140px] -mt-1 rounded-[50%]" />
      </div>

      {/* Tinku's speech slot, RESERVED so a hint never moves anything. Holds the hint bubble when
          there is one, and otherwise the progress dots. Stable single-child wrapper: HintBubble
          remounts on each (re)emission via its hintNonce key to replay the pop-in; the dedicated
          wrapper isolates that remount from the sibling keys used for the question transitions
          below, so React always cleanly unmounts the previous bubble (no orphaned/stacked bubble). */}
      <div data-q="hint" data-testid="hint-slot" className="quiz-hint-slot">
        {s.hint
          ? <HintBubble key={s.hintNonce} hint={s.hint} emotion={s.emotion} />
          : (showPips && <QuizPips total={s.totalQuestions} current={s.questionNumber} />)}
      </div>

      {/* Question area: the ONLY elastic part of the budget. It takes whatever the fixed parts leave,
          centres the question in it (so slack is balanced, not pooled into one void), and scrolls as a
          last resort for an exceptionally long question. Keyed by questionNumber so the new question
          gently slides/fades in on each advance (GPU-safe). */}
      <div data-q="question" className="quiz-question">
        <div key={s.questionNumber} className="animate-q-enter flex flex-col items-stretch justify-center min-h-full py-2">
          <QuestionView question={s.question} blankFill={blankFill} />
        </div>
      </div>

      {/* Options. Buttons are disabled during the post-answer pause (phase correct/reveal) so a
          kid can't double-tap into the next question — it auto-advances after ADVANCE_DELAY_MS.
          Keyed by questionNumber so the tiles remount and stagger-in on each new question. */}
      {/* Answers: shrink-0 — never compressed, always fully visible */}
      <div data-q="answers" key={s.questionNumber} className="flex flex-wrap justify-center gap-3 max-w-sm w-full mx-auto pb-1">
        {s.question.options.map((opt, i) => (
          <KidButton
            key={i}
            index={i}
            label={String(opt)}
            state={optionState(i, s)}
            disabled={locked}
            onClick={() => {
              playSound('tap');
              haptic('light');
              s.answer(i);
            }}
          />
        ))}
      </div>
     </div>
    </div>
  );
}

/** Visual state for an option given the current session state. */
function optionState(i, s) {
  if (s.phase === 'correct' && i === s.selectedIndex) return 'correct';
  if (s.phase === 'reveal') {
    if (i === s.revealIndex) return 'correct';
    if (i === s.selectedIndex) return 'wrong';
  }
  if (s.phase === 'hint' && i === s.selectedIndex) return 'wrong';
  return 'idle';
}

function MuteButton({ muted, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      className="text-xl w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-ink active:scale-90 transition-transform"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}

function Centered({ children }) {
  return (
    <div className="flex flex-col items-center justify-center h-full overflow-hidden bg-bg px-6 py-6 text-center">
      {children}
    </div>
  );
}

function PrimaryButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="bg-primary text-white font-bold text-lg py-3 px-8 rounded-button shadow-button hover:brightness-110 active:scale-95 transition-all"
    >
      {children}
    </button>
  );
}
