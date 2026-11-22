import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guard: the Capacitor plugin ALLOW-LIST (DECISIONS 2026-10-15). Every plugin is a new privacy
 * surface, and the published claim is "nothing leaves the device", so a `@capacitor/*` package
 * that is not named here fails the build until a person adds it on purpose, with a reason.
 * Network/analytics-capable plugins (push, http, geolocation, camera, device identifiers,
 * browser, ...) are deliberately NOT here.
 */
const ALLOWED = {
  '@capacitor/core': 'bridge; isNativePlatform()',
  '@capacitor/app': 'hardware Back button',
  '@capacitor/filesystem': 'write the progress backup to the private cache',
  '@capacitor/share': 'hand the backup file to the share sheet',
  '@capacitor/cli': 'build tooling only: cap add / cap sync (devDependency)',
  '@capacitor/android': 'the native Android runtime the wrap runs on',
};

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'package.json'), 'utf8'),
);

const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function walkSrc(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : walkSrc(full);
    return /\.(js|jsx)$/.test(entry.name) ? [full] : [];
  });
}

describe('Capacitor plugin allow-list', () => {
  const declared = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter(
    (n) => n.startsWith('@capacitor/') || n.startsWith('@capawesome') || n.startsWith('capacitor-'),
  );

  it('only allow-listed Capacitor packages are installed', () => {
    const unapproved = declared.filter((n) => !(n in ALLOWED));
    expect(unapproved).toEqual([]);
  });

  it('every allow-listed plugin is actually used (no dead permissions)', () => {
    expect(Object.keys(ALLOWED).filter((n) => !declared.includes(n))).toEqual([]);
  });

  it('no source module outside src/services/ imports @capacitor/*', () => {
    const offenders = walkSrc(SRC_DIR)
      .filter((file) => !relative(SRC_DIR, file).startsWith('services/'))
      .filter((file) => /@capacitor\//.test(readFileSync(file, 'utf8')))
      .map((file) => relative(SRC_DIR, file));
    expect(offenders).toEqual([]);
  });
});
