import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logEvent } from '../analytics';

/**
 * Guard: the analytics seam is INERT (MVP ships with no analytics — DECISIONS 2026-07-16).
 * Asserts the wrapper API is callable, emits nothing, and that no Analytics SDK can enter the
 * build (nothing in src imports firebase/analytics). Call-sites are intentionally preserved.
 */

const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..'); // src/

// Every event name currently fired from useQuizSession, plus edge shapes.
const EVENTS = ['session_start', 'session_abandoned', 'session_complete', 'question_answered', 'hint_shown', 'play_again'];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : walk(p);
    return /\.(js|jsx)$/.test(e.name) ? [p] : [];
  });
}

describe('analytics seam (inert)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('exposes a callable logEvent that never throws and returns nothing', () => {
    expect(typeof logEvent).toBe('function');
    for (const name of EVENTS) {
      expect(logEvent(name, { skill_id: 'g1.add.within20', grade: 1 })).toBeUndefined();
    }
    // Edge shapes must also be safe.
    expect(() => logEvent()).not.toThrow();
    expect(() => logEvent('x')).not.toThrow();
    expect(() => logEvent('x', undefined)).not.toThrow();
    expect(() => logEvent('x', { a: 1, b: [1, 2], c: null })).not.toThrow();
  });

  it('emits NOTHING — no network primitive is touched', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const beaconSpy = vi.fn();
    vi.stubGlobal('navigator', { sendBeacon: beaconSpy });

    for (const name of EVENTS) logEvent(name, { skill_id: 's', n: 3 });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beaconSpy).not.toHaveBeenCalled();
  });

  it('no source file imports the Firebase Analytics SDK (nothing can enter the bundle)', () => {
    const offenders = walk(SRC_DIR).filter((file) => {
      const code = readFileSync(file, 'utf8');
      return /firebase\/analytics/.test(code) || /\bgetAnalytics\b/.test(code);
    });
    expect(offenders).toEqual([]);
  });
});
