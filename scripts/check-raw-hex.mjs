#!/usr/bin/env node
/**
 * Raw-colour guard (DECISIONS 2026-07-04 / 2026-07-05 — the design-token system).
 *
 * Components must consume NAMED tokens (`bg-primary`, `text-review`, …), never a raw colour,
 * so that band theming works: a future band overrides the SAME CSS custom properties and every
 * component follows automatically. One raw `#14b8a6` (or `rgba(20,184,166,1)`, or `text-teal-500`)
 * in a component is a colour that silently will not re-theme — and, worse, one that can quietly
 * violate the LOCKED colour meanings (amber = reward ONLY; coral = wrong; sky = learning; teal =
 * review).
 *
 * ESLint cannot express this (it is a string-content rule about Tailwind class names, CSS
 * literals and inline styles), hence a script.
 *
 * SCOPE, stated honestly (widened 2026-08-20, design-system audit — the original version here
 * only checked hex and exempted src/index.css wholesale, which is exactly how the effect
 * layer's rgba() leak went uncaught for as long as it did):
 *   - checks:   hex literals (#abc, #aabbcc, #aabbccdd); rgba()/rgb()/hsla()/hsl() calls; and,
 *               in .js/.jsx only, non-token Tailwind colour utility classes (bg-slate-500,
 *               text-white, border-indigo-950, …) — anywhere in src/**\/*.{js,jsx,css}
 *   - excludes: FROZEN legacy (never edited — see scripts/frozen-legacy.mjs); `tailwind.config.js`
 *               (references tokens via var() only, nothing to catch); the documented
 *               `COLOR_CLASS_EXCEPTIONS` (one exact class per site, with a reason — NOT a
 *               whole-file exemption, so a different violation in the same file still fails);
 *               and, in `src/index.css` ONLY, lines inside a TOKEN-DEFINITION block — the
 *               `:root { }` blocks and the `.theme-<slug> { }` palette blocks (test-panel
 *               themes, TRACKER #10) that scoped-override the same tokens — that is where tokens
 *               are DEFINED, so a literal there is the point, not a leak. Everything else in
 *               index.css (the effect layer: shadows, gradients, filters) is checked like any
 *               component — a literal there is exactly the bug class this guard exists to catch.
 *   - does NOT check: named CSS colours other than white/black (e.g. 'firebrick'). If those
 *               start appearing, widen this deliberately rather than assuming they were covered.
 *
 * Exit code 1 on any violation, so CI fails the build.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { FROZEN_GLOBS, HEX_ALLOWED, COLOR_CLASS_EXCEPTIONS } from './frozen-legacy.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(REPO_ROOT, 'src');
const INDEX_CSS_REL = 'src/index.css';

/** #rgb, #rgba, #rrggbb, #rrggbbaa — but not longer runs, which are not colours. */
const HEX_RE = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])/g;

/**
 * rgba(), rgb(), hsla(), hsl() calls whose ARGUMENTS are literal (the CSS-literal form hex
 * misses) — captures the parenthesised contents so a call can be checked for `var(`. A call
 * like `rgba(var(--color-primary-rgb), 0.2)` is the effect layer correctly consuming a token
 * and must NOT be flagged; `rgba(79, 70, 229, 0.2)` is the literal this guard exists to catch.
 */
const RGB_HSL_RE = /\b(?:rgba?|hsla?)\(([^)]*)\)/g;

/** Tailwind's built-in palette names — anything that is NOT one of our own named tokens. */
const TAILWIND_COLOR_NAMES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose', 'white', 'black',
];
const TAILWIND_CLASS_PREFIXES = [
  'bg', 'text', 'border', 'ring', 'from', 'to', 'via', 'fill', 'stroke', 'divide',
  'placeholder', 'outline', 'decoration', 'shadow', 'caret', 'accent',
];
const TAILWIND_COLOR_CLASS_RE = new RegExp(
  `\\b(?:${TAILWIND_CLASS_PREFIXES.join('|')})-(?:${TAILWIND_COLOR_NAMES.join('|')})(?:-[0-9]+)?\\b`,
  'g'
);

/**
 * Turn the shared frozen globs into simple prefix/exact matchers. The patterns in
 * frozen-legacy.mjs are deliberately simple (`dir/**` or an exact file path), so a full glob
 * engine would be overkill — but anything unrecognised throws rather than silently matching
 * nothing, which would un-guard a path without anyone noticing.
 */
function makeMatcher(patterns) {
  const prefixes = [];
  const exact = new Set();
  for (const p of patterns) {
    if (p.endsWith('/**')) prefixes.push(p.slice(0, -3));
    else if (!p.includes('*')) exact.add(p);
    else throw new Error(`check-raw-hex: unsupported glob pattern ${p} — teach this script about it.`);
  }
  return (relPath) => exact.has(relPath) || prefixes.some((pre) => relPath === pre || relPath.startsWith(pre + '/'));
}

const isFrozen = makeMatcher(FROZEN_GLOBS);
const isAllowed = makeMatcher(HEX_ALLOWED);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(js|jsx|css)$/.test(name) ? [full] : [];
  });
}

/**
 * For src/index.css only: which line numbers (0-indexed) fall inside a TOKEN-DEFINITION block —
 * the one place a colour literal is supposed to live. That means the `:root { }` blocks (Wonder
 * defaults — a font-family block, then the design-tokens block) AND the `.theme-<slug> { }`
 * palette blocks that SCOPED-override the same tokens for the parent test panel (TRACKER #10):
 * a hex there is the token being defined, not a leak. Track every block, not just the first, via
 * a brace-depth count from each opener to its matching `}`. Everything OUTSIDE these blocks (the
 * effect layer — shadows, gradients, filters) is still checked like any component.
 */
function computeTokenBlockLines(lines) {
  const inside = new Set();
  let depth = 0;
  let tracking = false;
  lines.forEach((line, i) => {
    if (!tracking && /(?::root|\.theme-[\w-]+)\s*\{/.test(line)) tracking = true;
    if (tracking) {
      inside.add(i);
      for (const ch of line) {
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) tracking = false;
        }
      }
    }
  });
  return inside;
}

/** True if this exact match is a documented, reasoned exception for this file. */
function isColorClassException(rel, matchedText) {
  return COLOR_CLASS_EXCEPTIONS.some((e) => e.file === rel && e.pattern.test(matchedText));
}

const violations = [];

for (const file of walk(SRC_DIR)) {
  const rel = relative(REPO_ROOT, file).split(sep).join('/');
  if (isFrozen(rel) || isAllowed(rel)) continue;

  const lines = readFileSync(file, 'utf8').split('\n');
  const tokenBlockLines = rel === INDEX_CSS_REL ? computeTokenBlockLines(lines) : null;
  const isJsLike = /\.(js|jsx)$/.test(rel);

  lines.forEach((line, i) => {
    const exemptLine = tokenBlockLines?.has(i) ?? false;
    if (!exemptLine) {
      for (const match of line.matchAll(HEX_RE)) {
        violations.push({ file: rel, line: i + 1, value: match[0], text: line.trim(), kind: 'hex' });
      }
      for (const match of line.matchAll(RGB_HSL_RE)) {
        if (match[1].includes('var(')) continue; // token reference, not a literal — correct usage
        violations.push({ file: rel, line: i + 1, value: match[0], text: line.trim(), kind: 'rgb/hsl' });
      }
    }
    if (isJsLike) {
      for (const match of line.matchAll(TAILWIND_COLOR_CLASS_RE)) {
        if (isColorClassException(rel, match[0])) continue;
        violations.push({ file: rel, line: i + 1, value: match[0], text: line.trim(), kind: 'tailwind-class' });
      }
    }
  });
}

if (violations.length > 0) {
  console.error(`\n✖ Raw colours found in ${violations.length} place(s). Use a named design token.\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.kind}] ${v.value}`);
    console.error(`    ${v.text.slice(0, 110)}`);
  }
  console.error(`\n  Tokens are defined in src/index.css and exposed via tailwind.config.js.`);
  console.error(`  Locked meanings: accent/amber = reward ONLY, encourage = wrong, learn = hints, review = review-due.`);
  console.error(`  See DECISIONS.md (2026-07-04, 2026-07-05). Documented exceptions (foreground-on-brand`);
  console.error(`  text, scrims, device chrome) live in scripts/frozen-legacy.mjs's COLOR_CLASS_EXCEPTIONS.\n`);
  process.exit(1);
}

console.log('✓ No raw colours outside the token definitions.');
