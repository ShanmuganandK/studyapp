import { useEffect, useState } from 'react';
import { useQuizSession } from '../hooks/useQuizSession';
import { playSound, haptic, setSoundMuted, isSoundMuted } from '../services/sound';
import Mascot from './Mascot';
import QuestionView from './QuestionView';
import HintBubble from './HintBubble';
import KidButton from './KidButton';

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
    return <Centered><p className="text-muted">Getting Tinku ready…</p></Centered>;
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
  const mascotSize = hintShowing ? 'clamp(52px, 10vh, 92px)' : 'clamp(96px, 18vh, 180px)';

  // Compare blank fills with the CORRECT sign so the statement completes: green on a correct
  // answer, sky/learn on the wrong-#2 reveal ("here's how"). null → dashed placeholder. Existing
  // view-state only (phase); QuestionView ignores it for formats without a blank.
  const blankFill = s.phase === 'correct' ? 'correct' : s.phase === 'reveal' ? 'reveal' : null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg px-5 pt-1 pb-2">
      {/* Top bar: back · progress counter · mute toggle */}
      <div className="flex items-center justify-between flex-shrink-0">
        <button onClick={onExit} className="text-sm font-semibold text-muted hover:text-ink transition-colors">
          ← Skills
        </button>
        <span className="text-sm font-bold text-primary">
          {s.questionNumber} / {s.totalQuestions}
        </span>
        <MuteButton muted={muted} onToggle={toggleMute} />
      </div>

      {/* Tinku's stage: decorative, yields space first — shrinks while a hint shows (see
          mascotSize). A soft ground ellipse sits beneath him so he feels IN the world (he
          breathes/floats above it) rather than pasted on. */}
      <div className="relative flex flex-col items-center flex-shrink-0">
        <Mascot emotion={s.emotion} size={mascotSize} />
        <div aria-hidden="true" className="tinku-ground h-3 w-2/5 max-w-[140px] -mt-1 rounded-[50%]" />
      </div>

      {/* Tinku's hint speech bubble, in a STABLE single-child wrapper slot. HintBubble remounts
          on each (re)emission via its hintNonce key to replay the pop-in; the dedicated wrapper
          isolates that remount from the sibling keys used for the question transitions below, so
          React always cleanly unmounts the previous bubble (no orphaned/stacked bubble that
          would otherwise persist across taps and questions). */}
      <div className="flex-shrink-0">
        <HintBubble key={s.hintNonce} hint={s.hint} emotion={s.emotion} />
      </div>

      {/* Question area: flex-1 + min-h-0 so it takes remaining space and yields when tight.
          overflow-y-auto is the scoped fallback for exceptionally long questions.
          justify-center vertically centres the question in the free space so on tall phones
          (e.g. S25 Ultra) the slack is balanced above/below rather than pooling into one big
          void between the question and the answers. Keyed by questionNumber so the new
          question gently slides/fades in on each advance (GPU-safe). */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div key={s.questionNumber} className="animate-q-enter flex flex-col items-stretch justify-center min-h-full py-3">
          <QuestionView question={s.question} blankFill={blankFill} />
        </div>
      </div>

      {/* Options. Buttons are disabled during the post-answer pause (phase correct/reveal) so a
          kid can't double-tap into the next question — it auto-advances after ADVANCE_DELAY_MS.
          Keyed by questionNumber so the tiles remount and stagger-in on each new question. */}
      {/* Answers: flex-shrink-0 — never compressed, always fully visible */}
      <div key={s.questionNumber} className="flex-shrink-0 flex flex-wrap justify-center gap-3 max-w-sm w-full mx-auto pb-2 pt-1">
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

// NOTE: this is the interim, token-only session-end. Screen 2 of the overhaul turns it into a
// full celebration EVENT (confetti, count-up, mastery beat); the mood-floor logic is untouched.
function SessionEnd({ score, total, onPlayAgain, onExit }) {
  // Mood floor: always celebratory, whatever the score.
  return (
    <Centered>
      <Mascot emotion="celebrate" size="clamp(90px, 15vh, 160px)" />
      <h2 className="font-display text-title font-extrabold text-primary-ink mt-4">Great job!</h2>
      {/* Stars here are a REWARD readout (locked: amber/stars = reward only). */}
      <div className="flex gap-1 mt-3 text-3xl" aria-label={`${score} of ${total} correct`}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i}>{i < score ? '⭐' : '☆'}</span>
        ))}
      </div>
      <p className="text-muted mt-2">{score} / {total} correct</p>
      <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
        <PrimaryButton onClick={onPlayAgain}>Play again</PrimaryButton>
        <button onClick={onExit} className="text-muted font-semibold py-2 hover:text-ink transition-colors">
          Pick another skill
        </button>
      </div>
    </Centered>
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
