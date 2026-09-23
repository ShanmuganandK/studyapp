import { THEME_SLUGS, GRADES } from '../services/testSettings';

/**
 * TestPanel — the parent-zone TEST INSTRUMENT for theme + grade (TRACKER Now #10).
 *
 * A test instrument, NOT a shipped feature and NOT kid-facing: it lives behind the parent gate
 * inside ParentDashboard so a parent can exercise a different theme / grade while kid-testing on
 * a real device. Purely presentational — all state + persistence + theme application live in
 * useTestSettings.js (STANDARDS §2). Token styling only (no raw hex — lint:hex).
 *
 * @param {string}   theme               - active theme slug
 * @param {(s)=>void} onThemeChange
 * @param {number}   grade               - active grade (1–2 today — see `testSettings.js`'s `GRADES`)
 * @param {(n)=>void} onGradeChange
 * @param {boolean}  bridgeEnabled       - strategy-rung bridge-in walk toggle (DECISIONS
 *                                         2026-09-22), default OFF. Only affects skills opted in
 *                                         via the skill map's `strategyRungs` property — today,
 *                                         `g2.add.2d-nocarry` alone.
 * @param {(b)=>void} onBridgeEnabledChange
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

export default function TestPanel({ theme, onThemeChange, grade, onGradeChange, bridgeEnabled, onBridgeEnabledChange }) {
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
      </div>

      {/* ── Bridge-in (strategy-rung skills only) — DECISIONS 2026-09-22 ────── */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink">Warm-up steps (test)</p>
        <div className="flex gap-2">
          {[false, true].map((value) => {
            const selected = bridgeEnabled === value;
            return (
              <button
                key={String(value)}
                onClick={() => onBridgeEnabledChange(value)}
                aria-pressed={selected}
                className={`flex-1 rounded-button border py-2 text-sm font-semibold active:scale-95 transition-transform ${
                  selected
                    ? 'border-primary ring-2 ring-primary text-primary-ink'
                    : 'border-primary-soft text-muted'
                }`}
              >
                {value ? 'On' : 'Off'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
