import { THEME_SLUGS } from '../services/testSettings';

/**
 * ThemePicker — the parent-zone "Colours" control (DECISIONS 2026-10-20: the palette is a real
 * parent setting, not a test instrument). Purely presentational; state, persistence and applying
 * the body class live in useTestSettings.js (STANDARDS §2). Token styling only (lint:hex).
 *
 * @param {string}    theme         - active theme slug
 * @param {(s)=>void} onThemeChange
 */

const THEME_LABELS = {
  wonder: 'Wonder',
  sunset: 'Sunset',
  bubblegum: 'Bubblegum',
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

export default function ThemePicker({ theme, onThemeChange }) {
  return (
    <div className="border-t border-primary-soft pt-4 space-y-2">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide">Colours</p>
      <p className="text-xs text-muted">Pick the look your child sees.</p>
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
  );
}
