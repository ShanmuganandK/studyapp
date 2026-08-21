/**
 * testSettings tests — node environment (no DOM), localStorage stubbed. Mirrors progressStore's
 * test approach. Covers: defaults, save→load round-trip, per-field normalisation of bad values,
 * version mismatch, corrupt data, and storage failures.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function makeStorage() {
  const store = Object.create(null);
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    _store: store,
  };
}

const KEY = 'tinku:v1:testSettings';

describe('testSettings', () => {
  let storage;

  beforeEach(() => {
    storage = makeStorage();
    vi.stubGlobal('localStorage', storage);
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns defaults when nothing is stored', async () => {
    const { loadTestSettings, DEFAULT_TEST_SETTINGS } = await import('../testSettings.js');
    expect(loadTestSettings()).toEqual(DEFAULT_TEST_SETTINGS);
    expect(DEFAULT_TEST_SETTINGS).toEqual({ theme: 'wonder', grade: 1 });
  });

  it('round-trips a saved theme + grade', async () => {
    const { loadTestSettings, saveTestSettings } = await import('../testSettings.js');
    saveTestSettings({ theme: 'deepsea', grade: 2 });
    expect(loadTestSettings()).toEqual({ theme: 'deepsea', grade: 2 });
  });

  it('normalises an unknown theme back to the default, keeping a valid grade', async () => {
    const { loadTestSettings, saveTestSettings } = await import('../testSettings.js');
    saveTestSettings({ theme: 'not-a-theme', grade: 3 });
    expect(loadTestSettings()).toEqual({ theme: 'wonder', grade: 3 });
  });

  it('normalises an out-of-range grade back to the default, keeping a valid theme', async () => {
    const { loadTestSettings, saveTestSettings } = await import('../testSettings.js');
    saveTestSettings({ theme: 'sunset', grade: 9 });
    expect(loadTestSettings()).toEqual({ theme: 'sunset', grade: 1 });
  });

  it('returns defaults when the stored version does not match', async () => {
    const { loadTestSettings, SCHEMA_VERSION } = await import('../testSettings.js');
    storage.setItem(KEY, JSON.stringify({ version: SCHEMA_VERSION + 5, theme: 'sunset', grade: 2 }));
    expect(loadTestSettings()).toEqual({ theme: 'wonder', grade: 1 });
  });

  it('returns defaults on corrupt JSON', async () => {
    const { loadTestSettings } = await import('../testSettings.js');
    storage.setItem(KEY, '{bad json{{');
    expect(loadTestSettings()).toEqual({ theme: 'wonder', grade: 1 });
  });

  it('does not throw and returns defaults when getItem throws', async () => {
    storage.getItem = () => { throw new Error('SecurityError'); };
    const { loadTestSettings } = await import('../testSettings.js');
    expect(() => loadTestSettings()).not.toThrow();
    expect(loadTestSettings()).toEqual({ theme: 'wonder', grade: 1 });
  });

  it('does not throw when setItem fails', async () => {
    storage.setItem = () => { throw new Error('QuotaExceeded'); };
    const { saveTestSettings } = await import('../testSettings.js');
    expect(() => saveTestSettings({ theme: 'sunset', grade: 2 })).not.toThrow();
  });

  it('THEME_SLUGS lists wonder + the three palettes and GRADES is 1–3', async () => {
    const { THEME_SLUGS, GRADES } = await import('../testSettings.js');
    expect(THEME_SLUGS).toEqual(['wonder', 'sunset', 'bubblegum', 'deepsea']);
    expect(GRADES).toEqual([1, 2, 3]);
  });
});
