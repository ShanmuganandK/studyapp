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
 * question on a card pinned to the bottom, where a thumb reaches. Fit-one-viewport, on the same
 * spacing-budget idea as the quiz screen (DECISIONS 2026-10-18): the hero is a size container
 * (`.picker-hero` in index.css) and Tinku is sized from the room it has, so he is large on a tall
 * phone and shrinks on a short one instead of floating in empty space. The tagline makes no content claim (AGENTS.md: never over-claim what the app teaches).
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

// Tinku fills the hero: its height minus the title, tagline, ground shadow and gaps (about 9rem),
// never wider than the hero, never smaller than a readable minimum, never absurdly large.
const HERO_TINKU = 'clamp(8rem, min(100cqh - 9rem, 94cqw), 24rem)';

export default function GradePickerScreen({ onChoose }) {
  return (
    <div className="app-frame font-body flex flex-col overflow-hidden bg-bg text-center">
      <div className="picker-hero flex-1 min-h-0 bg-gradient-to-b from-primary-soft to-bg">
        <div className="h-full flex flex-col items-center justify-center px-6 gap-2">
          <p className="font-display text-title font-extrabold text-primary-ink">{PRODUCT_NAME}</p>
          <Mascot emotion="waving" size={HERO_TINKU} />
          <div className="tinku-ground h-4 w-40 -mt-3" aria-hidden="true" />
          <p className="text-base text-muted">Maths practice, one friendly step at a time.</p>
        </div>
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
