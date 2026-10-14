import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guard: the BUILD stays lean and honest. Asserts on `dist/`, so like the bundle layer of
 * `noFirebaseAuth.test.js` it skips itself when there is no build — CI re-runs it after `build`.
 *
 * WHY: on 2026-10-14 the shipped icons were found to be the 1024x1024 source JPEG copied three
 * times under `.png` / `.ico` names — 1.7 MB of a 2.6 MB build, precached for every new user, with
 * black corners and a manifest declaring sizes the files didn't have. Nothing noticed, because
 * nothing looked at what the build actually contains. After the fix the build is 0.9 MB, and this
 * keeps it that way.
 *
 * What it enforces (each is a different way a build quietly bloats or lies):
 *   1. only allow-listed file TYPES ship — no .md/.map/.jsx/.pdf/.jpg from a docs folder or a
 *      stray source image dropped into `public/`;
 *   2. an image's BYTES match its extension (a JPEG named .png fails);
 *   3. manifest icons exist and their declared sizes are their real sizes;
 *   4. nothing UNREFERENCED ships — every file is named by the HTML, manifest, CSS or JS;
 *   5. size budgets, with headroom over today's numbers.
 *
 * Adding a new file type or raising a budget is a DELIBERATE edit to the constants below.
 */

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DIST_DIR = join(REPO_ROOT, 'dist');

const ALLOWED_EXTENSIONS = new Set(['.html', '.js', '.css', '.webp', '.png', '.ico', '.woff2', '.webmanifest']);

// Served by convention or by tooling, so no file need name them: browsers request /favicon.ico on
// their own, and the service-worker files are generated and registered by registerSW.js.
const REFERENCED_BY_CONVENTION = new Set(['favicon.ico', 'sw.js', 'registerSW.js', 'privacy.html']);
const isWorkboxRuntime = (name) => /^workbox-[\w-]+\.js$/.test(name);

// Today (2026-10-14): total 0.92 MB, biggest non-entry file 112 KB (a font), entry JS 215 KB.
const MAX_TOTAL_BYTES = 1.25 * 1024 * 1024;
const MAX_FILE_BYTES = 150 * 1024;
const MAX_ENTRY_JS_BYTES = 400 * 1024;

const SIGNATURES = {
  '.png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  '.webp': (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  '.ico': (b) => b.readUInt16LE(0) === 0 && b.readUInt16LE(2) === 1,
  '.woff2': (b) => b.subarray(0, 4).toString('latin1') === 'wOF2',
};

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const hasBuild = existsSync(DIST_DIR);

describe.skipIf(!hasBuild)('the build is lean and honest (dist/)', () => {
  const files = hasBuild ? walk(DIST_DIR) : [];
  const rel = (p) => relative(DIST_DIR, p);

  it('ships only allow-listed file types', () => {
    const offenders = files.filter((f) => !ALLOWED_EXTENSIONS.has(extname(f))).map(rel);
    expect(offenders).toEqual([]);
  });

  it('every image/font is really the format its extension claims', () => {
    const liars = files
      .filter((f) => SIGNATURES[extname(f)])
      .filter((f) => !SIGNATURES[extname(f)](readFileSync(f)))
      .map(rel);
    expect(liars).toEqual([]);
  });

  it('manifest icons exist and declare their true size', () => {
    const manifest = JSON.parse(readFileSync(join(DIST_DIR, 'manifest.webmanifest'), 'utf8'));
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons) {
      const file = join(DIST_DIR, icon.src.replace(/^\//, ''));
      expect(existsSync(file), `${icon.src} is missing from dist/`).toBe(true);
      expect(icon.type).toBe('image/png');
      const png = readFileSync(file);
      const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)]; // IHDR width/height
      expect(`${w}x${h}`, `${icon.src} declares ${icon.sizes}`).toBe(icon.sizes);
    }
  });

  it('nothing unreferenced ships (every file is named by the HTML, manifest, CSS or JS)', () => {
    const corpus = files
      .filter((f) => /\.(html|js|css|webmanifest)$/.test(f))
      .filter((f) => !['sw.js'].includes(basename(f)) && !isWorkboxRuntime(basename(f))) // sw.js lists EVERYTHING it precaches
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    const orphans = files
      .map((f) => basename(f))
      .filter((name) => !REFERENCED_BY_CONVENTION.has(name) && !isWorkboxRuntime(name))
      .filter((name) => !['index.html', 'manifest.webmanifest'].includes(name))
      .filter((name) => !corpus.includes(name));
    expect(orphans).toEqual([]);
  });

  it('stays inside the size budgets', () => {
    const sizes = files.map((f) => ({ name: rel(f), bytes: statSync(f).size }));
    const total = sizes.reduce((sum, s) => sum + s.bytes, 0);
    expect(total, `dist/ is ${(total / 1024).toFixed(0)} KB`).toBeLessThanOrEqual(MAX_TOTAL_BYTES);

    const tooBig = sizes
      .filter((s) => !/^assets\/index-[\w-]+\.js$/.test(s.name))
      .filter((s) => s.bytes > MAX_FILE_BYTES)
      .map((s) => `${s.name} (${(s.bytes / 1024).toFixed(0)} KB)`);
    expect(tooBig).toEqual([]);

    const entry = sizes.find((s) => /^assets\/index-[\w-]+\.js$/.test(s.name));
    expect(entry, 'entry bundle not found').toBeTruthy();
    expect(entry.bytes).toBeLessThanOrEqual(MAX_ENTRY_JS_BYTES);
  });
});

describe.skipIf(hasBuild)('the build is lean and honest (dist/)', () => {
  it('SKIPPED: no dist/ present — run `npm run build` to assert the build', () => {});
});
