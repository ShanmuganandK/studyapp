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

/**
 * The parent test-panel palettes (index.css). Each is a scoped override that MUST carry the same
 * hex + -rgb pairing as :root for every paired token, or the effect layer's alpha-blended
 * shadows/gradients re-theme to the wrong colour under that palette (the scoped-override rule the
 * design-system audit proved). `wonder` is the :root default and has no `.theme-` block. */
const PALETTE_SLUGS = ['sunset', 'bubblegum', 'deepsea'];

function hexToRgbTriple(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

/** The body of a `.theme-<slug> { … }` rule (no nested braces in these token blocks). */
function extractBlock(slug) {
  const match = css.match(new RegExp(`\\.theme-${slug}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`Could not find .theme-${slug} block in index.css`);
  return match[1];
}

/** Extracts `--name: #hex;` from `scope` — must not match `--name-rgb`, hence the negative lookahead. */
function extractHex(name, scope = css) {
  const re = new RegExp(`${name}(?!-rgb):\\s*#([0-9a-fA-F]{6})\\s*;`);
  const match = scope.match(re);
  if (!match) throw new Error(`Could not find hex declaration for ${name}`);
  return `#${match[1]}`;
}

function extractRgbTriple(name, scope = css) {
  const re = new RegExp(`${name}-rgb:\\s*([0-9]{1,3}),\\s*([0-9]{1,3}),\\s*([0-9]{1,3})\\s*;`);
  const match = scope.match(re);
  if (!match) throw new Error(`Could not find -rgb declaration for ${name}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

describe('design tokens — hex and -rgb forms stay numerically in sync', () => {
  describe(':root (Wonder default)', () => {
    for (const name of PAIRED_TOKENS) {
      it(`${name} and ${name}-rgb represent the same colour`, () => {
        expect(extractRgbTriple(name)).toEqual(hexToRgbTriple(extractHex(name)));
      });
    }
  });

  // Every test-panel palette must declare all three paired tokens, both forms, in sync.
  for (const slug of PALETTE_SLUGS) {
    describe(`.theme-${slug}`, () => {
      const block = extractBlock(slug);
      for (const name of PAIRED_TOKENS) {
        it(`${name} and ${name}-rgb represent the same colour`, () => {
          expect(extractRgbTriple(name, block)).toEqual(hexToRgbTriple(extractHex(name, block)));
        });
      }
    });
  }
});
