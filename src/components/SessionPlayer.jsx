import { useEffect, useState } from 'react';
import { useQuizSession } from '../hooks/useQuizSession';
import { playSound, haptic, setSoundMuted, isSoundMuted } from '../services/sound';
import Mascot from './Mascot';
import QuestionView from './QuestionView';
import HintBubble from './HintBubble';

/**
 * SessionPlayer — drives one playable session via useQuizSession and renders it.
 * Presentational: all logic (remediation ladder, scoring, analytics) is in the hook.
 * Bright / Wonder-band palette. (TODO: migrate hardcoded colors to theme tokens when the
 * theme-wonder/theme-explorer token system lands.)
 *
 * Sound/haptic events (all fire-and-forget via sound service — never block the UI):
 *   tap     → every option button press (immediate tactile feedback)
 *   correct → phase transitions to 'correct'
 *   hint    → wrong #1 (soft 'let me help' — plays on each hint (re)emission via hintNonce)
 *   wrong   → wrong #2 reveal
 *   complete → phase transitions to 'complete' (session end)
 */
export default function SessionPlayer({ grade, skillId, onExit }) {
  const s = useQuizSession(grade, { skillId });

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
    return <Centered><p className="text-slate-500">Getting Tinku ready…</p></Centered>;
  }
  if (s.empty) {
    return (
      <Centered>
        <Mascot emotion="happy" size={120} />
        <p className="text-slate-600 mt-4">No ready skills for this grade yet!</p>
        <PrimaryButton onClick={onExit}>Back</PrimaryButton>
      </Centered>
    );
  }
  if (s.sessionComplete) {
    return <SessionEnd score={s.score} total={s.totalQuestions} onPlayAgain={s.restart} onExit={onExit} />;
  }

  // Options are only locked during the post-answer pause (correct / wrong-#2 reveal). The
  // wrong-#1 hint keeps them live — the child retries freely; the soft window (in the hook)
  // makes a fast wrong tap re-show the hint instead of skipping it.
  const locked = s.phase === 'correct' || s.phase === 'reveal';

  // Fit-one-viewport (STANDARDS §5): the mascot is decorative and yields space FIRST. When the
  // hint bubble is showing, Tinku shrinks so the bubble takes the reclaimed space instead of
  // pushing the question into scroll. He stays present (it's his speech bubble), just smaller.
  const hintShowing = !!s.hint;
  const mascotSize = hintShowing ? 'clamp(40px, 7vh, 64px)' : 'clamp(70px, 13vh, 130px)';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-sky-50 px-5 pt-1 pb-2">
      {/* Top bar: back · progress counter · mute toggle */}
      <div className="flex items-center justify-between flex-shrink-0">
        <button onClick={onExit} className="text-sm font-semibold text-slate-400 hover:text-slate-600">
          ← Skills
        </button>
        <span className="text-sm font-bold text-indigo-400">
          {s.questionNumber} / {s.totalQuestions}
        </span>
        <MuteButton muted={muted} onToggle={toggleMute} />
      </div>

      {/* Mascot: decorative, yields space first — shrinks while a hint shows (see mascotSize) */}
      <div className="flex justify-center flex-shrink-0">
        <Mascot emotion={s.emotion} size={mascotSize} />
      </div>

      {/* Tinku's hint speech bubble. Keyed by hintNonce so it replays its pop-in on every
          (re)emission — including a re-show when the child taps another wrong answer. */}
      <HintBubble key={s.hintNonce} hint={s.hint} emotion={s.emotion} />

      {/* Question area: flex-1 + min-h-0 so it takes remaining space and yields when tight.
          overflow-y-auto is the scoped fallback for exceptionally long questions.
          py-3 gives equal breathing room above and below the content; items-start pins the
          question near the mascot so the free space falls below the objects, not above them. */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col items-stretch min-h-full py-3">
          <QuestionView question={s.question} />
        </div>
      </div>

      {/* Options. Buttons are disabled during the post-answer pause (phase correct/reveal) so a
          kid can't double-tap into the next question — it auto-advances after ADVANCE_DELAY_MS. */}
      {/* Answers: flex-shrink-0 — never compressed, always fully visible */}
      <div className="flex-shrink-0 flex flex-wrap justify-center gap-3 max-w-sm w-full mx-auto pb-2 pt-1">
        {s.question.options.map((opt, i) => (
          <OptionButton
            key={i}
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

function OptionButton({ label, state, disabled, onClick }) {
  const styles = {
    idle: 'bg-white border-indigo-200 text-indigo-700 active:scale-95',
    correct: 'bg-green-500 border-green-500 text-white',
    wrong: 'bg-amber-100 border-amber-300 text-amber-800',
  }[state];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl border-4 text-3xl font-extrabold shadow-sm transition-transform flex items-center justify-center ${styles} ${
        disabled ? 'cursor-default' : 'hover:scale-105'
      }`}
      style={{ height: 'clamp(3rem, 11vh, 5rem)', width: 'calc(50% - 0.375rem)' }}
    >
      {label}
    </button>
  );
}

function MuteButton({ muted, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      className="text-xl w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 active:scale-90 transition-transform"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}

function SessionEnd({ score, total, onPlayAgain, onExit }) {
  // Mood floor: always celebratory, whatever the score.
  return (
    <Centered>
      <Mascot emotion="celebrate" size="clamp(90px, 15vh, 160px)" />
      <h2 className="text-3xl font-extrabold text-indigo-700 mt-4">Great job!</h2>
      <div className="flex gap-1 mt-3 text-3xl" aria-label={`${score} of ${total} correct`}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i}>{i < score ? '⭐' : '☆'}</span>
        ))}
      </div>
      <p className="text-slate-500 mt-2">{score} / {total} correct</p>
      <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
        <PrimaryButton onClick={onPlayAgain}>Play again</PrimaryButton>
        <button onClick={onExit} className="text-slate-400 font-semibold py-2 hover:text-slate-600">
          Pick another skill
        </button>
      </div>
    </Centered>
  );
}

function Centered({ children }) {
  return (
    <div className="flex flex-col items-center justify-center h-full overflow-hidden bg-sky-50 px-6 py-6 text-center">
      {children}
    </div>
  );
}

function PrimaryButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="bg-indigo-600 text-white font-bold text-lg py-3 px-8 rounded-2xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
    >
      {children}
    </button>
  );
}
