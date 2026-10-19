import Mascot from './Mascot';
import { PRODUCT_NAME } from '../config/brand';

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
 * It is also the app's FIRST impression, so it is a welcome screen: a full-height brand hero
 * (big Tinku on a soft token-tinted field, the product name, one friendly line) with the class
 * question on a card pinned to the bottom, where a thumb reaches. Fit-one-viewport: Tinku is
 * sized once from the viewport height (smaller on short phones), everything else is fixed-size.
 * The tagline makes no content claim (AGENTS.md: never over-claim what the app teaches).
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

// Tinku scales with viewport height: small on short phones (320x568) so the card never pushes
// the hero off-screen, large on tall ones so the screen is a real welcome, not a form.
const heroSize = () => {
  const h = typeof window !== 'undefined' ? window.innerHeight : 700;
  return h < 640 ? 150 : h < 800 ? 220 : 260;
};

export default function GradePickerScreen({ onChoose }) {
  return (
    <div className="app-frame font-body flex flex-col overflow-hidden bg-bg text-center">
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 gap-2 bg-gradient-to-b from-primary-soft to-bg">
        <p className="font-display text-title font-extrabold text-primary-ink">{PRODUCT_NAME}</p>
        <Mascot emotion="waving" size={heroSize()} />
        <div className="tinku-ground h-4 w-40 -mt-3" aria-hidden="true" />
        <p className="text-base text-muted">Maths practice, one friendly step at a time.</p>
      </div>
      <div className="shrink-0 bg-bg-card rounded-t-card shadow-card px-6 pt-5 pb-6 flex flex-col items-center gap-3">
        <h1 className="text-xl font-bold text-ink">Which class is your child in?</h1>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {OPTIONS.map(({ grade, label, disabled }) => (
            <button
              key={grade}
              type="button"
              disabled={disabled}
              aria-disabled={disabled}
              onClick={disabled ? undefined : () => onChoose(grade)}
              className={`w-full min-h-12 rounded-button border-2 py-3 px-4 text-base font-semibold transition-transform ${
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
    </div>
  );
}
