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
 * Files allowed to contain raw hex colour literals: the design tokens are DEFINED here, and
 * a token has to be a literal somewhere (DECISIONS 2026-07-04 — components consume named
 * tokens, never raw hex).
 */
export const HEX_ALLOWED = ['src/index.css', 'tailwind.config.js'];
