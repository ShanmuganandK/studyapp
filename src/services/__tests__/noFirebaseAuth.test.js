import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { authService } from '../authService';

/**
 * Guard: NO Firebase (or any other) auth SDK can re-enter the build.
 *
 * MVP is device-local with no accounts (DECISIONS 2026-08-14). The 2026-08-15 network audit
 * found `lib/firebase.js` calling `initializeApp()`/`getAuth()` at module scope on every app
 * start, reachable through a static import chain that the `isFirebaseConfigured` runtime check
 * could not stop — so the shipped app could talk to Google identity endpoints.
 *
 * This is now a claim in a PUBLISHED PRIVACY NOTICE, not an internal preference, so it gets the
 * same standing protection as the analytics seam (`analytics.test.js`): assert it structurally
 * rather than re-reasoning it by hand each audit.
 *
 * Layers, weakest to strongest:
 *   1. the auth seam is inert and reports a null user (never a fake one);
 *   2. no source file imports firebase, so it cannot enter a build;
 *   3. no built artefact in dist/ contains a Google identity endpoint.
 */

const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..'); // src/
const REPO_ROOT = join(SRC_DIR, '..');
const DIST_DIR = join(REPO_ROOT, 'dist');

// Hosts the Firebase Auth SDK talks to. Their presence in a bundle means the SDK is back.
const AUTH_ENDPOINTS = ['identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'apis.google.com'];

function walk(dir, { skipTests = true } = {}) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return skipTests && e.name === '__tests__' ? [] : walk(p, { skipTests });
    return /\.(js|jsx)$/.test(e.name) ? [p] : [];
  });
}

describe('auth seam (inert, null user)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reports a null user — never a fabricated one', async () => {
    expect(authService.getUser()).toBeNull();
    await expect(authService.login()).resolves.toBeNull();
    await expect(authService.logout()).resolves.toBeNull();
  });

  it('emits an async signed-out state so AuthContext can clear `loading`', async () => {
    const cb = vi.fn();
    const unsubscribe = authService.onAuthStateChanged(cb);

    // Must NOT fire synchronously — real auth SDKs subscribe first, then emit.
    expect(cb).not.toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 0));

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(null);
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('touches no network primitive', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    authService.getUser();
    await authService.login();
    await authService.logout();
    authService.onAuthStateChanged(() => {})();

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('no auth SDK can enter the build', () => {
  it('no source file imports firebase', () => {
    const offenders = walk(SRC_DIR).filter((file) => {
      const code = readFileSync(file, 'utf8');
      return /from\s+['"]firebase(\/|['"])/.test(code) || /require\(['"]firebase(\/|['"])/.test(code);
    });
    expect(offenders).toEqual([]);
  });

  it('the deleted Firebase modules have not come back', () => {
    expect(existsSync(join(SRC_DIR, 'lib', 'firebase.js'))).toBe(false);
    expect(existsSync(join(SRC_DIR, 'services', 'firebaseAdapter.js'))).toBe(false);
  });

  it('firebase is not a dependency', () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(deps).filter((d) => d === 'firebase' || d.startsWith('@firebase/'))).toEqual([]);
  });

  it('no source file references a Google identity endpoint', () => {
    const offenders = walk(SRC_DIR).filter((file) => {
      const code = readFileSync(file, 'utf8');
      return AUTH_ENDPOINTS.some((host) => code.includes(host));
    });
    expect(offenders).toEqual([]);
  });
});

describe('built bundle contains no auth endpoints', () => {
  // dist/ is gitignored and absent on a clean checkout, so this asserts only when a build is
  // present (locally after `npm run build`, and in CI when the build step runs before tests).
  // The source-level guards above hold unconditionally, so a missing dist/ can never make this
  // suite falsely green — it just narrows what this one case can observe.
  const hasBuild = existsSync(DIST_DIR);

  it.runIf(hasBuild)('no dist/ artefact mentions a Google identity endpoint', () => {
    const artefacts = walk(DIST_DIR, { skipTests: false });
    expect(artefacts.length).toBeGreaterThan(0); // a dist/ with no JS would be a vacuous pass

    const offenders = artefacts
      .map((file) => ({ file, code: readFileSync(file, 'utf8') }))
      .filter(({ code }) => AUTH_ENDPOINTS.some((host) => code.includes(host)))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  it.skipIf(hasBuild)('SKIPPED: no dist/ present — run `npm run build` to assert the bundle', () => {});
});
