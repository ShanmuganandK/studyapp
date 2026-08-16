import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRODUCT_NAME, SHORT_NAME, DESCRIPTION } from '../brand';
import { APP_NAME } from '../privacyPolicy';

/**
 * Guard: ONE product name across every live surface.
 *
 * Five surfaces used to hold five literals and they drifted — manifest "CBSE Math Kids", launcher
 * "Math Kids", page title "CBSE Math Kids App", policy "Tinku Math". **A privacy policy naming a
 * different app than the store listing is a Play review flag**, so this is not cosmetic.
 *
 * Most surfaces are now DERIVED from `config/brand.js` and so cannot drift by construction. This
 * guard covers the rest:
 *   1. the derived surfaces still derive — nobody "fixed" a literal back in;
 *   2. the surfaces that can only be checked (package.json, README) agree;
 *   3. no retired name survives anywhere a user or reviewer can see it.
 */

const CONFIG_DIR = join(dirname(fileURLToPath(import.meta.url)), '..'); // src/config/
const SRC_DIR = join(CONFIG_DIR, '..'); // src/
const REPO_ROOT = join(SRC_DIR, '..');

const read = (p) => readFileSync(join(REPO_ROOT, p), 'utf8');

/**
 * Names this product no longer uses. `CBSC` is the original typo T9 was opened to clean up.
 * `Math Kids` is a substring of `CBSE Math Kids`, so it catches both halves of the old manifest.
 */
const RETIRED_NAMES = ['CBSE Math Kids', 'Math Kids', 'CBSC'];

/**
 * Files scanned for retired names, and the ones deliberately NOT scanned.
 *
 * The exclusions are an explicit, reasoned list — never a silent skip (same principle as
 * `scripts/frozen-legacy.mjs`):
 *
 *   - `documents/*.md` — historical planning records. Rewriting them would falsify what was true
 *     when they were written. (They also carry stale `f:/AI Programming/CBSC App/` Windows paths,
 *     which is its own cleanup, tracked separately.)
 *   - `DECISIONS.md`, `claude-chat/TRACKER.md`, `claude-chat/GUIDE.md`,
 *     `claude-chat/play-data-safety-form.md` — these must QUOTE the retired names in order to
 *     record the rename. Without this exclusion the guard would fail on the very DECISIONS entry
 *     that locks the decision.
 *   - `dist/` — build output, gitignored.
 *   - this test file, and `src/config/brand.js` — both must name the retired strings to do their
 *     job (one defines the replacement and explains the drift, the other detects it). Excluding
 *     brand.js costs nothing: its actual VALUES are asserted directly and precisely above, which
 *     is stronger than a substring sweep. The sweep exists for surfaces with no such assertion.
 */
const SCANNED_FILES = ['index.html', 'vite.config.js', 'package.json', 'README.md'];
const SELF_REFERENTIAL = ['src/config/__tests__/brand.test.js', 'src/config/brand.js'];

/** Every .js/.jsx/.html/.css file under src/, so no component can reintroduce a retired name. */
function walkSrc(dir = SRC_DIR) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return walkSrc(p);
    return /\.(js|jsx|html|css)$/.test(e.name) ? [relative(REPO_ROOT, p)] : [];
  });
}

describe('brand — the name is coherent', () => {
  it('exports a product name, a short name and a description', () => {
    expect(PRODUCT_NAME).toBeTruthy();
    expect(SHORT_NAME).toBeTruthy();
    expect(DESCRIPTION).toBeTruthy();
  });

  it('short name fits the launcher (12 chars)', () => {
    // Android truncates around 12. Pick a real short form rather than letting it truncate blindly.
    expect(SHORT_NAME.length).toBeLessThanOrEqual(12);
  });

  it('keeps "CBSE" out of the NAME but allows it in the DESCRIPTION', () => {
    // CBSE is a statutory board: a NAME implying affiliation risks Play's impersonation policy,
    // while describing the app as CBSE-*aligned* is an ordinary descriptive claim.
    expect(PRODUCT_NAME).not.toMatch(/CBSE/i);
    expect(SHORT_NAME).not.toMatch(/CBSE/i);
    expect(DESCRIPTION).toMatch(/CBSE/);
  });

  it('the privacy policy names the same app', () => {
    // The whole point: the policy must name the app as the store lists it.
    expect(APP_NAME).toBe(PRODUCT_NAME);
  });
});

describe('brand — derived surfaces still derive', () => {
  it('vite.config.js takes the manifest from brand.js, not from literals', () => {
    const config = read('vite.config.js');
    expect(config).toMatch(/from '\.\/src\/config\/brand\.js'/);
    expect(config).toMatch(/name:\s*PRODUCT_NAME/);
    expect(config).toMatch(/short_name:\s*SHORT_NAME/);
    expect(config).toMatch(/description:\s*DESCRIPTION/);
  });

  it('index.html interpolates the title instead of hardcoding it', () => {
    expect(read('index.html')).toContain('<title>%PRODUCT_NAME%</title>');
  });

  it('privacyPolicy.js imports the name rather than re-typing it', () => {
    const policy = read('src/config/privacyPolicy.js');
    expect(policy).toMatch(/import \{ PRODUCT_NAME \} from '\.\/brand\.js'/);
    expect(policy).toMatch(/APP_NAME = PRODUCT_NAME/);
  });
});

describe('brand — checked (non-derivable) surfaces agree', () => {
  it('package.json name is the kebab form of the product name', () => {
    const expected = PRODUCT_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    expect(JSON.parse(read('package.json')).name).toBe(expected);
  });

  it('README leads with the product name', () => {
    expect(read('README.md').split('\n')[0]).toContain(PRODUCT_NAME);
  });
});

describe('brand — no retired name survives on a visible surface', () => {
  const files = [...SCANNED_FILES, ...walkSrc()].filter((f) => !SELF_REFERENTIAL.includes(f));

  it('scans a non-trivial set of files (guard against an empty sweep)', () => {
    // A scan that silently matches nothing would pass forever. Assert it has real work to do.
    expect(files.length).toBeGreaterThan(20);
    expect(files).toContain('index.html');
    expect(files).toContain('vite.config.js');
  });

  for (const name of RETIRED_NAMES) {
    it(`no file mentions "${name}"`, () => {
      const offenders = files.filter((f) => existsSync(join(REPO_ROOT, f)) && read(f).includes(name));
      expect(offenders).toEqual([]);
    });
  }
});
