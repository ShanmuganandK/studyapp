#!/usr/bin/env node
/**
 * Raw-hex colour guard (DECISIONS 2026-07-04 / 2026-07-05 — the design-token system).
 *
 * Components must consume NAMED tokens (`bg-primary`, `text-review`, …), never raw hex, so
 * that band theming works: the Explorer band (Phase 2) overrides the SAME CSS custom
 * properties and every component follows automatically. One raw `#14b8a6` in a component is
 * a colour that silently will not re-theme — and, worse, one that can quietly violate the
 * LOCKED colour meanings (amber = reward ONLY; coral = wrong; sky = learning; teal = review).
 *
 * ESLint cannot express this (it is a string-content rule about Tailwind class names and
 * inline styles), hence a script.
 *
 * SCOPE, stated honestly:
 *   - checks:   raw hex literals (#abc, #aabbcc, #aabbccdd) in src/**\/*.{js,jsx,css}
 *   - excludes: FROZEN legacy (never edited — see scripts/frozen-legacy.mjs) and the token
 *               definition files, which are where the literals are SUPPOSED to live
 *   - does NOT check: rgb()/rgba()/hsl() literals, or colour names like 'red'. If those start
 *               appearing, widen this deliberately rather than assuming they were covered.
 *
 * Exit code 1 on any violation, so CI fails the build.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { FROZEN_GLOBS, HEX_ALLOWED } from './frozen-legacy.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(REPO_ROOT, 'src');

/** #rgb, #rgba, #rrggbb, #rrggbbaa — but not longer runs, which are not colours. */
const HEX_RE = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])/g;

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

const violations = [];

for (const file of walk(SRC_DIR)) {
  const rel = relative(REPO_ROOT, file).split(sep).join('/');
  if (isFrozen(rel) || isAllowed(rel)) continue;

  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const match of line.matchAll(HEX_RE)) {
      violations.push({ file: rel, line: i + 1, value: match[0], text: line.trim() });
    }
  });
}

if (violations.length > 0) {
  console.error(`\n✖ Raw hex colours found in ${violations.length} place(s). Use a named design token.\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.value}`);
    console.error(`    ${v.text.slice(0, 110)}`);
  }
  console.error(`\n  Tokens are defined in src/index.css and exposed via tailwind.config.js.`);
  console.error(`  Locked meanings: accent/amber = reward ONLY, encourage = wrong, learn = hints, review = review-due.`);
  console.error(`  See DECISIONS.md (2026-07-04, 2026-07-05).\n`);
  process.exit(1);
}

console.log('✓ No raw hex colours outside the token definitions.');
