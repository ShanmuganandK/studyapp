import { useQuizSession } from '../hooks/useQuizSession';
import Mascot from './Mascot';
import QuestionView from './QuestionView';

/**
 * SessionPlayer — drives one playable session via useQuizSession and renders it.
 * Presentational: all logic (remediation ladder, scoring, analytics) is in the hook.
 * Bright / Wonder-band palette. (TODO: migrate hardcoded colors to theme tokens when the
 * theme-wonder/theme-explorer token system lands.)
 */
export default function SessionPlayer({ grade, skillId, onExit }) {
  const s = useQuizSession(grade, { skillId });

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

  const locked = s.phase === 'correct' || s.phase === 'reveal';

  return (
    <div className="flex flex-col min-h-full bg-sky-50 px-5 py-4">
      {/* Top: progress + Tinku */}
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="text-sm font-semibold text-slate-400 hover:text-slate-600">
          ← Skills
        </button>
        <span className="text-sm font-bold text-indigo-400">
          {s.questionNumber} / {s.totalQuestions}
        </span>
      </div>

      <div className="flex justify-center mt-2">
        <Mascot emotion={s.emotion} size={130} />
      </div>

      {/* Hint bubble (Tinku speaking) */}
      {s.hint && (
        <div className="mx-auto mt-1 mb-2 max-w-sm bg-white border-2 border-amber-200 text-amber-900 rounded-2xl px-4 py-2 text-center text-sm font-medium shadow-sm">
          {s.hint}
        </div>
      )}

      {/* Middle: the question */}
      <div className="flex-1 flex items-center justify-center py-4">
        <QuestionView question={s.question} />
      </div>

      {/* Options. Buttons are disabled during the post-answer pause (phase correct/reveal) so a
          kid can't double-tap into the next question — it auto-advances after ADVANCE_DELAY_MS. */}
      <div className="grid grid-cols-2 gap-3 max-w-sm w-full mx-auto pb-4">
        {s.question.options.map((opt, i) => (
          <OptionButton
            key={i}
            label={String(opt)}
            state={optionState(i, s)}
            disabled={locked}
            onClick={() => s.answer(i)}
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
      className={`h-20 rounded-2xl border-4 text-3xl font-extrabold shadow-sm transition-transform ${styles} ${
        disabled ? 'cursor-default' : 'hover:scale-105'
      }`}
    >
      {label}
    </button>
  );
}

function SessionEnd({ score, total, onPlayAgain, onExit }) {
  // Mood floor: always celebratory, whatever the score.
  return (
    <Centered>
      <Mascot emotion="celebrate" size={160} />
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
    <div className="flex flex-col items-center justify-center min-h-full bg-sky-50 px-6 py-10 text-center">
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
