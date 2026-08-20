/**
 * Design-token drift guard — node env, no DOM.
 *
 * `src/index.css` co-declares certain colours TWICE: once as a hex literal (consumed directly
 * by Tailwind/components) and once as a bare RGB channel triple (consumed by the effect layer's
 * alpha-blended shadows/gradients, which need channel numbers, not a hex string). This is deliberate, not
 * duplication-for-its-own-sake — see the comment above `--color-primary` in index.css for why
 * the alternative (deriving one from the other via `rgb(var())`) does NOT work for scoped band
 * overrides (verified empirically, design-system audit Step 3).
 *
 * Two independently-maintained representations of the same colour can only drift if nobody
 * checks — this test is that check. It fails the moment someone edits one form and forgets the
 * other, which is exactly the silent failure mode the effect layer had before this audit.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CSS_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'index.css');
const css = readFileSync(CSS_PATH, 'utf8');

/** Every colour with a co-declared hex + `-rgb` triple pair (see index.css). */
const PAIRED_TOKENS = ['--color-primary', '--color-primary-ink', '--color-ink'];

function hexToRgbTriple(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

/** Extracts `--name: #hex;` — must not match `--name-rgb`, hence the negative lookahead. */
function extractHex(name) {
  const re = new RegExp(`${name}(?!-rgb):\\s*#([0-9a-fA-F]{6})\\s*;`);
  const match = css.match(re);
  if (!match) throw new Error(`Could not find hex declaration for ${name} in index.css`);
  return `#${match[1]}`;
}

function extractRgbTriple(name) {
  const re = new RegExp(`${name}-rgb:\\s*([0-9]{1,3}),\\s*([0-9]{1,3}),\\s*([0-9]{1,3})\\s*;`);
  const match = css.match(re);
  if (!match) throw new Error(`Could not find -rgb declaration for ${name} in index.css`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

describe('design tokens — hex and -rgb forms stay numerically in sync', () => {
  for (const name of PAIRED_TOKENS) {
    it(`${name} and ${name}-rgb represent the same colour`, () => {
      const hex = extractHex(name);
      const declaredTriple = extractRgbTriple(name);
      expect(declaredTriple).toEqual(hexToRgbTriple(hex));
    });
  }
});
