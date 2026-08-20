/**
 * The FROZEN legacy surface — the single source of truth for "code we do not lint".
 *
 * Consumed by BOTH `eslint.config.js` and `scripts/check-raw-hex.mjs` so the two guards can
 * never disagree about what counts as legacy (STANDARDS §8: one source of truth per value).
 *
 * WHY these are excluded rather than fixed: the migration strategy (DECISIONS, ARCHITECTURE)
 * freezes the pre-decisions Antigravity core — "new code never imports legacy; legacy is never
 * edited" — and STANDARDS §8 scopes its disciplines to NEW code. Linting these would demand
 * edits the migration rule forbids. They run as-is until their new-core replacement is proven
 * behind a flag, then they are deleted outright.
 *
 * Every entry below currently contains at least one real violation (raw `console.*` or raw hex),
 * which is exactly why the exclusion has to be deliberate and visible rather than a silent
 * `--quiet`.
 *
 * KEEP IN SYNC with ARCHITECTURE.md → "Legacy core (FROZEN)" and "FROZEN / unreachable screens".
 * When a legacy file is finally deleted, delete its line here too — a stale entry silently
 * un-guards a path that has become new code.
 */

/** Frozen directories. */
const FROZEN_DIRS = [
  'src/utils/**',              // legacy generators, questionFactory, masteryEngine, StampEngine
  'src/data/**',               // stored question banks + syllabus (violates "no stored questions")
  'src/contexts/**',           // AuthContext — legacy until the auth rebuild (T109, deferred)
  'src/components/modules/**', // VisualAddition, VisualFractions
];

/**
 * Frozen individual screens: kept on disk, never edited, no longer wired into navigation.
 * (`Login.jsx` and `ProfileSelector.jsx` are unrendered; the rest are unreachable per
 * ARCHITECTURE's "FROZEN / unreachable screens".)
 */
const FROZEN_SCREENS = [
  'AdventureLadder',
  'Login',
  'PassportDashboard',
  'ProfileSelector',
  'ProfileSetup',
  'QuizEngine',
  'StampCelebration',
  'Syllabus',
].map((name) => `src/components/${name}.jsx`);

/** Glob patterns for everything frozen. Order is irrelevant; these are pure exclusions. */
export const FROZEN_GLOBS = [...FROZEN_DIRS, ...FROZEN_SCREENS];

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
  {
    file: 'src/components/Layout.jsx',
    pattern: /\b(?:border|ring|bg)-indigo-(?:900|950)\b/,
    reason: 'the desktop phone-mockup bezel + notch chrome (decorative device frame around the app, shown only sm:+) — a phone case is not app content and is not expected to re-theme with the band',
  },
  {
    file: 'src/components/__tests__/SkillCard.test.jsx',
    pattern: /\btext-amber-500\b/,
    reason: 'appears only inside a negative assertion (`toBeNull()`) proving the class is ABSENT — not applied styling, a false positive on a plain string scan',
  },
];
