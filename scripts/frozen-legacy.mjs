/**
 * Active lint & colour-token guard exclusions — consumed by BOTH `eslint.config.js` and
 * `scripts/check-raw-hex.mjs` so the two guards never disagree (STANDARDS §8).
 *
 * Historically this file excluded frozen legacy directories (`src/data/**`, `src/utils/**`,
 * `src/components/modules/**`, and 8 unreachable screens). Those unreachable legacy modules and
 * the `?home=cards` experiment were moved to `archive/legacy-code/` (ignored by ESLint, Vitest,
 * `check-raw-hex.mjs`, and Vite builds), so `FROZEN_GLOBS` is now empty and every file in `src/`
 * is live and guarded.
 */

/** Glob patterns for any frozen legacy files still inside `src/` (currently none). */
export const FROZEN_GLOBS = [];

/**
 * The ONE sanctioned exception inside a frozen directory: the logger is new code that happens
 * to live in `src/utils/`. It is the sanctioned home for raw `console.*` (STANDARDS §8), so it
 * is linted, and `no-console` is switched off for it specifically.
 */
export const LOGGER_PATH = 'src/utils/logger.js';

/**
 * Files allowed to contain raw colour literals (hex, rgba()/rgb()/hsl()) WHOLESALE.
 * `tailwind.config.js` only ever references tokens via `var(--...)` — nothing to catch there,
 * exempted for simplicity. `src/index.css` is deliberately NOT here: it both DEFINES the
 * tokens (which must be literals somewhere) and contains the effect layer (which must NOT
 * be literals — that was the whole leak this guard exists to prevent). See
 * `scripts/check-raw-hex.mjs` for how index.css gets scoped to just its `:root` block instead
 * of a wholesale file exemption.
 */
export const HEX_ALLOWED = ['tailwind.config.js'];

/**
 * Non-token Tailwind colour utility classes, explicitly exempted from the colour-class guard,
 * one entry per site — NOT a whole-file exemption, so a *different* future violation in the
 * same file still gets caught. Each carries the reason it's conventionally theme-independent
 * rather than a project token (design-system audit, TRACKER 2026-08-20).
 */
export const COLOR_CLASS_EXCEPTIONS = [
  {
    file: 'src/App.jsx',
    pattern: /\btext-white\b/,
    reason: 'white text on a saturated bg-primary button — foreground-on-brand-colour contrast, not itself a themed surface',
  },
  {
    file: 'src/components/SessionPlayer.jsx',
    pattern: /\btext-white\b/,
    reason: 'white text on a saturated bg-primary button, same as App.jsx',
  },
  {
    file: 'src/components/KidButton.jsx',
    pattern: /\btext-white\b/,
    reason: 'white text on the correct-state bg-success tile',
  },
  {
    file: 'src/components/ParentDashboard.jsx',
    pattern: /\btext-white\b/,
    reason: 'white text on bg-primary buttons (Set/Change Passcode, Replace progress)',
  },
  {
    file: 'src/components/CelebrationScreen.jsx',
    pattern: /\btext-white\b/,
    reason: 'white text on the bg-primary CTA button',
  },
  {
    file: 'src/components/ParentGateModal.jsx',
    pattern: /\btext-white\b/,
    reason: 'white text on the bg-primary submit button',
  },
  {
    // Pattern matches the class WITHOUT its opacity modifier (`/50`) — the guard's Tailwind-class
    // regex stops at the word boundary before the slash, so the matched text is always the bare
    // `bg-black` / `ring-indigo-900` form regardless of what opacity suffix is used in the source.
    file: 'src/components/ParentGateModal.jsx',
    pattern: /\bbg-black\b/,
    reason: 'modal scrim — dims whatever is behind it; scrims are conventionally theme-independent across most design systems, not app content',
  },
];
