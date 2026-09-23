/**
 * testSettings tests — node environment (no DOM), localStorage stubbed. Mirrors progressStore's
 * test approach. Covers: defaults, save→load round-trip, per-field normalisation of bad values,
 * version mismatch, corrupt data, and storage failures. Also covers `bridgeEnabled`
 * (DECISIONS 2026-09-22): SCHEMA_VERSION was deliberately NOT bumped for it (a bump would wipe
 * theme/grade on every existing device — see testSettings.js's docblock), so a pre-existing
 * (legacy) stored object with no `bridgeEnabled` key must load with its theme/grade UNCHANGED
 * and the toggle defaulting false.
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
    expect(DEFAULT_TEST_SETTINGS).toEqual({ theme: 'wonder', grade: 1, bridgeEnabled: false });
  });

  it('round-trips a saved theme + grade + bridgeEnabled', async () => {
    const { loadTestSettings, saveTestSettings } = await import('../testSettings.js');
    saveTestSettings({ theme: 'deepsea', grade: 2, bridgeEnabled: true });
    expect(loadTestSettings()).toEqual({ theme: 'deepsea', grade: 2, bridgeEnabled: true });
  });

  it('normalises an unknown theme back to the default, keeping a valid grade', async () => {
    const { loadTestSettings, saveTestSettings } = await import('../testSettings.js');
    saveTestSettings({ theme: 'not-a-theme', grade: 2 });
    expect(loadTestSettings()).toEqual({ theme: 'wonder', grade: 2, bridgeEnabled: false });
  });

  it('normalises grade 3 back to the default — no Grade-3 curriculum yet (Now #12)', async () => {
    const { loadTestSettings, saveTestSettings } = await import('../testSettings.js');
    saveTestSettings({ theme: 'sunset', grade: 3 });
    expect(loadTestSettings()).toEqual({ theme: 'sunset', grade: 1, bridgeEnabled: false });
  });

  it('normalises an out-of-range grade back to the default, keeping a valid theme', async () => {
    const { loadTestSettings, saveTestSettings } = await import('../testSettings.js');
    saveTestSettings({ theme: 'sunset', grade: 9 });
    expect(loadTestSettings()).toEqual({ theme: 'sunset', grade: 1, bridgeEnabled: false });
  });

  it('normalises a non-boolean bridgeEnabled back to the default (false)', async () => {
    const { loadTestSettings, saveTestSettings } = await import('../testSettings.js');
    saveTestSettings({ theme: 'sunset', grade: 2, bridgeEnabled: 'yes' });
    expect(loadTestSettings()).toEqual({ theme: 'sunset', grade: 2, bridgeEnabled: false });
  });

  it('returns defaults when the stored version does not match', async () => {
    const { loadTestSettings, SCHEMA_VERSION } = await import('../testSettings.js');
    storage.setItem(KEY, JSON.stringify({ version: SCHEMA_VERSION + 5, theme: 'sunset', grade: 2 }));
    expect(loadTestSettings()).toEqual({ theme: 'wonder', grade: 1, bridgeEnabled: false });
  });

  it('returns defaults on corrupt JSON', async () => {
    const { loadTestSettings } = await import('../testSettings.js');
    storage.setItem(KEY, '{bad json{{');
    expect(loadTestSettings()).toEqual({ theme: 'wonder', grade: 1, bridgeEnabled: false });
  });

  it('does not throw and returns defaults when getItem throws', async () => {
    storage.getItem = () => { throw new Error('SecurityError'); };
    const { loadTestSettings } = await import('../testSettings.js');
    expect(() => loadTestSettings()).not.toThrow();
    expect(loadTestSettings()).toEqual({ theme: 'wonder', grade: 1, bridgeEnabled: false });
  });

  it('does not throw when setItem fails', async () => {
    storage.setItem = () => { throw new Error('QuotaExceeded'); };
    const { saveTestSettings } = await import('../testSettings.js');
    expect(() => saveTestSettings({ theme: 'sunset', grade: 2 })).not.toThrow();
  });

  describe('legacy load (DECISIONS 2026-09-22 — SCHEMA_VERSION deliberately NOT bumped)', () => {
    it('a pre-existing v1 object with NO bridgeEnabled key keeps its theme and grade, toggle defaults false', async () => {
      const { loadTestSettings } = await import('../testSettings.js');
      // Hardcoded `version: 1`, deliberately NOT read from the current SCHEMA_VERSION constant —
      // a real device's old file has 1 baked in regardless of what this module bumps to later.
      // (A version bumped in step with SCHEMA_VERSION would silently defeat this test.)
      storage.setItem(KEY, JSON.stringify({ version: 1, theme: 'bubblegum', grade: 2 }));
      expect(loadTestSettings()).toEqual({ theme: 'bubblegum', grade: 2, bridgeEnabled: false });
    });

    it('SCHEMA_VERSION was not bumped for this field (locks the decision, not just describes it)', async () => {
      const { SCHEMA_VERSION } = await import('../testSettings.js');
      expect(SCHEMA_VERSION).toBe(1);
    });

    it('an export-shaped read of a device with the toggle ON contains no trace of it (device-only, never travels)', async () => {
      // testSettings has no export path of its own (progressStore/progressBackup do the actual
      // exporting, and read a DIFFERENT storage key entirely) — this asserts the toggle stays
      // under its own key and is invisible to anything reading tinku:v1:skills, the only key an
      // export ever touches (ARCHITECTURE.md — "What travels: tinku:v1:skills only").
      const { saveTestSettings } = await import('../testSettings.js');
      saveTestSettings({ theme: 'wonder', grade: 1, bridgeEnabled: true });
      expect(Object.keys(storage._store)).toEqual([KEY]);
      expect(storage._store['tinku:v1:skills']).toBeUndefined();
    });
  });

  it('THEME_SLUGS lists wonder + the three palettes and GRADES is 1–2 (Grade 3 has no curriculum yet)', async () => {
    const { THEME_SLUGS, GRADES } = await import('../testSettings.js');
    expect(THEME_SLUGS).toEqual(['wonder', 'sunset', 'bubblegum', 'deepsea']);
    expect(GRADES).toEqual([1, 2]);
  });
});
