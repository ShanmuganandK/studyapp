import { THEME_SLUGS, GRADES } from '../services/testSettings';

/**
 * TestPanel — the parent-zone TEST INSTRUMENT for theme + grade (TRACKER Now #10).
 *
 * A test instrument, NOT a shipped feature and NOT kid-facing: it lives behind the parent gate
 * inside ParentDashboard so a parent can exercise a different theme / grade while kid-testing on
 * a real device. Purely presentational — all state + persistence + theme application live in
 * useTestSettings.js (STANDARDS §2). Token styling only (no raw hex — lint:hex).
 *
 * @param {string}   theme          - active theme slug
 * @param {(s)=>void} onThemeChange
 * @param {number}   grade          - active grade (1–3)
 * @param {(n)=>void} onGradeChange
 */

const THEME_LABELS = {
  wonder: 'Wonder',
  sunset: 'Sunset',
  bubblegum: 'Bubblegum',
  deepsea: 'Deep Sea',
};

// A live preview of a palette: the `.theme-<slug>` class re-themes the token utilities inside it,
// so these dots show each palette's real colours WITHOUT any raw hex in the component. `wonder`
// is the :root default (no class).
function ThemeSwatch({ slug }) {
  const themeClass = slug === 'wonder' ? '' : `theme-${slug}`;
  return (
    <span
      aria-hidden="true"
      className={`${themeClass} inline-flex items-center gap-1 rounded-full bg-bg border border-primary-soft px-1.5 py-1`}
    >
      <span className="w-3 h-3 rounded-full bg-primary" />
      <span className="w-3 h-3 rounded-full bg-accent" />
    </span>
  );
}

export default function TestPanel({ theme, onThemeChange, grade, onGradeChange }) {
  return (
    <div className="border-t border-primary-soft pt-4 space-y-3">
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">
          Test settings
        </p>
        <p className="text-xs text-muted">Parent only — for testing on this device.</p>
      </div>

      {/* ── Theme ─────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink">Theme</p>
        <div className="grid grid-cols-2 gap-2">
          {THEME_SLUGS.map((slug) => {
            const selected = theme === slug;
            return (
              <button
                key={slug}
                onClick={() => onThemeChange(slug)}
                aria-pressed={selected}
                className={`flex items-center gap-2 rounded-button border py-2 px-3 text-sm font-semibold active:scale-95 transition-transform ${
                  selected
                    ? 'border-primary ring-2 ring-primary text-primary-ink'
                    : 'border-primary-soft text-muted'
                }`}
              >
                <ThemeSwatch slug={slug} />
                <span className="truncate">{THEME_LABELS[slug] ?? slug}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grade ─────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink">Grade</p>
        <div className="flex gap-2">
          {GRADES.map((g) => {
            const selected = grade === g;
            return (
              <button
                key={g}
                onClick={() => onGradeChange(g)}
                aria-pressed={selected}
                className={`flex-1 rounded-button border py-2 text-sm font-semibold active:scale-95 transition-transform ${
                  selected
                    ? 'border-primary ring-2 ring-primary text-primary-ink'
                    : 'border-primary-soft text-muted'
                }`}
              >
                Grade {g}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted">
          Grades 2–3 have no skills yet — selecting them is safe and shows the Grade 1 skills for now.
        </p>
      </div>
    </div>
  );
}
