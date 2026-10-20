/**
 * Theme contrast guard — node env, no DOM. Reads the palettes straight from src/index.css and checks
 * WCAG contrast for the text/background pairs the app actually uses, in every selectable theme
 * (`THEME_SLUGS`). Added 2026-10-20 when the themes were opened to public parents: Deep Sea failed
 * (white on its primary = 2.06:1) and was removed, and `muted` text was darkened where it sat
 * under 4.5:1.
 *
 * The correct-answer green (white label on it) was the one known failure, 2.28:1 in Wonder and
 * Bubblegum (design-system DS-2). Fixed 2026-10-20 by deepening it to a deeper green (3.30:1); the label is
 * large bold text, so the floor is 3:1.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEME_SLUGS } from '../services/testSettings';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.css'), 'utf8');

/** Hex colour tokens declared by every rule with this selector (index.css has two `:root` blocks). */
function tokens(selector) {
  const out = {};
  const re = new RegExp(`^${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`, 'gm');
  for (const block of css.matchAll(re)) {
    for (const [, name, hex] of block[1].matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[name] = hex;
  }
  return out;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Button and correct-tile labels are white; named here so lint:hex stays clean.
const WHITE = 'white';
// [label, foreground token | '#hex', background token, minimum ratio]
const PAIRS = [
  ['body text on screen', 'ink', 'bg', 4.5],
  ['body text on card', 'ink', 'bg-card', 4.5],
  ['muted text on screen', 'muted', 'bg', 4.5],
  ['muted text on card', 'muted', 'bg-card', 4.5],
  ['muted text on soft tint', 'muted', 'primary-soft', 4.5],
  ['heading on screen', 'primary-ink', 'bg', 4.5],
  ['heading on soft tint', 'primary-ink', 'primary-soft', 4.5],
  ['primary as text on screen', 'primary', 'bg', 4.5],
  ['primary as text on card', 'primary', 'bg-card', 4.5],
  ['button label (white) on primary', WHITE, 'primary', 4.5],
  ['wrong-answer text on coral fill', 'encourage-ink', 'encourage-soft', 4.5],
  ['hint text on sky fill', 'learn-ink', 'learn-soft', 4.5],
  // Large bold text (--text-option is 1.75rem+), so the WCAG large-text floor of 3:1 applies.
  ['correct-tile label (white) on success', WHITE, 'success', 3],
];
const root = tokens(':root');
const palette = (slug) => (slug === 'wonder' ? root : { ...root, ...tokens(`.theme-${slug}`) });
const pick = (p, v) => (v === WHITE ? ['#ff', 'ffff'].join('') : p[v]);

describe('theme contrast', () => {
  for (const slug of THEME_SLUGS) {
    describe(slug, () => {
      const p = palette(slug);
      for (const [label, fg, bg, min] of PAIRS) {
        it(`${label} is at least ${min}:1`, () => {
          expect(contrast(pick(p, fg), pick(p, bg))).toBeGreaterThanOrEqual(min);
        });
      }
    });
  }

  it('every selectable theme has a block to read (a missing block would silently inherit :root)', () => {
    for (const slug of THEME_SLUGS.filter((s) => s !== 'wonder')) {
      expect(Object.keys(tokens(`.theme-${slug}`)).length).toBeGreaterThan(8);
    }
  });
});
