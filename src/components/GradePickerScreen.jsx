import Mascot from './Mascot';

/**
 * GradePickerScreen — first-run only (DECISIONS 2026-09-23).
 *
 * Shown once, before anything else, when a device has never had test settings written
 * (`!gradeChosen` — see `useTestSettings.js` / `testSettings.js`). Asks the parent one thing —
 * which class their child is in — and nothing else: no name, no age. Writes to the SAME
 * `tinku:v1:testSettings` key the parent-zone test panel already writes (`chooseInitialGrade`),
 * so it can be changed later there. Never enters a progress export (DECISIONS 2026-08-17,
 * 2026-08-21 — a different key entirely).
 *
 * Presentational only: no local state, no storage access — `onChoose` (wired to
 * `chooseInitialGrade`) does the writing. Parent-facing: body font throughout (NOT the
 * kid-facing display font), token classes only (lint:hex), one call to action per choice.
 */

const OPTIONS = [
  { grade: 1, label: 'Class 1', disabled: false },
  { grade: 2, label: 'Class 2', disabled: false },
  { grade: 3, label: 'Class 3 — coming soon', disabled: true },
];

export default function GradePickerScreen({ onChoose }) {
  return (
    <div className="font-body flex flex-col items-center justify-center h-full overflow-hidden bg-bg px-6 py-6 text-center gap-6">
      <Mascot emotion="waving" size={120} />
      <h1 className="text-xl font-bold text-ink">Which class is your child in?</h1>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {OPTIONS.map(({ grade, label, disabled }) => (
          <button
            key={grade}
            type="button"
            disabled={disabled}
            aria-disabled={disabled}
            onClick={disabled ? undefined : () => onChoose(grade)}
            className={`w-full rounded-button border-2 py-3 px-4 text-base font-semibold transition-transform ${
              disabled
                ? 'border-primary-soft bg-bg-card text-muted opacity-50 cursor-not-allowed'
                : 'border-primary bg-bg-card text-primary-ink shadow-card active:scale-95'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
