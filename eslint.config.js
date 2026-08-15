import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import promise from 'eslint-plugin-promise';

import { FROZEN_GLOBS, LOGGER_PATH } from './scripts/frozen-legacy.mjs';

/**
 * The standards guard (STANDARDS §8), enforced rather than remembered.
 *
 * Scope: NEW code only. The frozen legacy core is excluded via `scripts/frozen-legacy.mjs` —
 * see that file for why. STANDARDS §8 itself opens with "Apply these to all NEW code".
 *
 * This runs in CI (`.github/workflows/ci.yml`) alongside the raw-hex script and the test
 * suite. The test suite is the part that matters most: it carries `noFirebaseAuth.test.js`
 * and `analytics.test.js`, which protect claims made in a PUBLISHED PRIVACY NOTICE.
 */
export default [
  {
    // Build output, deps, and the generated knowledge graph are not our code.
    ignores: ['dist/**', 'node_modules/**', 'graphify-out/**', 'coverage/**'],
  },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      promise,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules, // React 18 + the automatic JSX transform
      ...reactHooks.configs.recommended.rules,

      // --- STANDARDS §8: logging -------------------------------------------------------
      // One logging path. `src/utils/logger.js` is the sanctioned home for raw console.*
      // and is exempted below.
      'no-console': 'error',

      // --- STANDARDS §8: error handling ------------------------------------------------
      // "Never swallow errors silently" — an empty catch is the canonical way to do it.
      'no-empty': ['error', { allowEmptyCatch: false }],

      // --- STANDARDS §8: async ---------------------------------------------------------
      // NOTE ON COVERAGE, deliberately partial: true floating-promise detection needs type
      // information, which plain JS does not give ESLint. These catch the detectable subset —
      // a `.then()` with no rejection path, and the async-executor anti-pattern. A bare
      // un-awaited async call is NOT caught. The tracker wording matches this exactly; do not
      // upgrade the claim without upgrading the tooling.
      'promise/catch-or-return': 'error',
      'promise/no-return-wrap': 'error',
      'no-async-promise-executor': 'error',

      // --- Unused code -----------------------------------------------------------------
      // `args: 'none'` is REQUIRED, not laziness: the recipe contract fixes the signature
      // `generate(difficulty, rng, skillId)`, and single-skill recipes legitimately ignore
      // `rng` or `skillId`. Linting arguments would force edits to a locked contract
      // (RECIPE_TEMPLATE.md). Variables are still checked; `_`-prefixed ones are opt-out.
      'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^_' }],

      // --- Non-blocking quality signals ------------------------------------------------
      // Warnings, not errors: valuable to see, but not worth blocking a merge over, and
      // exhaustive-deps in particular has known false positives.
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/prop-types': 'off', // no PropTypes in this codebase by convention

      // Off deliberately: this fires on ordinary apostrophes in child-facing copy
      // ("What shall we practise?", "Let's try together"). Satisfying it means writing
      // `&apos;` into the very strings a human most needs to read and tune. Pure style,
      // no correctness value, and it works against the copy being legible in source.
      'react/no-unescaped-entities': 'off',
    },
  },

  {
    // The logger IS the sanctioned console path (STANDARDS §8).
    files: [LOGGER_PATH],
    rules: { 'no-console': 'off' },
  },

  {
    // Vitest globals. Tests may also use node APIs (the guard tests read the filesystem).
    files: ['**/__tests__/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
  },

  {
    // Config files and scripts run in node, not the browser.
    files: ['*.config.js', 'scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },

  {
    // FROZEN legacy — never edited, so never linted. See scripts/frozen-legacy.mjs.
    ignores: FROZEN_GLOBS,
  },
];
