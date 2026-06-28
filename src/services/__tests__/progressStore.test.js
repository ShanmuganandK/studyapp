/**
 * progressStore tests — run in the node environment (no DOM), so localStorage is stubbed.
 *
 * Tests cover: save→load round-trips, missing-key returns, schema version, storage failures,
 * corrupt data resilience, and version-mismatch handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { emptySkillState } from '../../engine/mastery';

// We import progressStore AFTER stubbing localStorage so the module sees the stub.
// Re-imported fresh each describe block via dynamic import to avoid module-cache issues.

// ─── In-memory localStorage mock factory ─────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SKILL_ID = 'g1.add.within20';
const OTHER_ID = 'g1.sub.within10';

function freshState(id = SKILL_ID) {
  return emptySkillState(id, 3);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('progressStore', () => {
  let storage;

  beforeEach(async () => {
    storage = makeStorage();
    vi.stubGlobal('localStorage', storage);
    // Clear module cache so each test group gets a fresh module with the stub in place.
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── loadAllSkillStates ────────────────────────────────────────────────────

  describe('loadAllSkillStates', () => {
    it('returns {} when storage is empty', async () => {
      const { loadAllSkillStates } = await import('../progressStore.js');
      expect(loadAllSkillStates()).toEqual({});
    });

    it('returns all previously saved skill states', async () => {
      const { loadAllSkillStates, saveSkillState } = await import('../progressStore.js');
      const s1 = freshState(SKILL_ID);
      const s2 = freshState(OTHER_ID);
      saveSkillState(SKILL_ID, s1);
      saveSkillState(OTHER_ID, s2);
      const all = loadAllSkillStates();
      expect(all[SKILL_ID]).toEqual(s1);
      expect(all[OTHER_ID]).toEqual(s2);
    });

    it('returns {} when stored JSON is corrupt', async () => {
      storage.setItem('tinku:v1:skills', '{invalid json{{');
      const { loadAllSkillStates } = await import('../progressStore.js');
      expect(loadAllSkillStates()).toEqual({});
    });

    it('returns {} when stored version does not match SCHEMA_VERSION', async () => {
      const { loadAllSkillStates, SCHEMA_VERSION } = await import('../progressStore.js');
      const futureVersion = { version: SCHEMA_VERSION + 99, skills: { [SKILL_ID]: freshState() } };
      storage.setItem('tinku:v1:skills', JSON.stringify(futureVersion));
      expect(loadAllSkillStates()).toEqual({});
    });

    it('returns {} when storage.getItem throws', async () => {
      storage.getItem = () => { throw new Error('SecurityError'); };
      const { loadAllSkillStates } = await import('../progressStore.js');
      expect(() => loadAllSkillStates()).not.toThrow();
      expect(loadAllSkillStates()).toEqual({});
    });
  });

  // ── loadSkillState ────────────────────────────────────────────────────────

  describe('loadSkillState', () => {
    it('returns null for an unknown skill', async () => {
      const { loadSkillState } = await import('../progressStore.js');
      expect(loadSkillState(SKILL_ID)).toBeNull();
    });

    it('returns the saved state for a known skill', async () => {
      const { loadSkillState, saveSkillState } = await import('../progressStore.js');
      const s = { ...freshState(), level: 3, difficulty: 2 };
      saveSkillState(SKILL_ID, s);
      expect(loadSkillState(SKILL_ID)).toEqual(s);
    });

    it('returns null for a skill that was never saved, even if others were', async () => {
      const { loadSkillState, saveSkillState } = await import('../progressStore.js');
      saveSkillState(OTHER_ID, freshState(OTHER_ID));
      expect(loadSkillState(SKILL_ID)).toBeNull();
    });
  });

  // ── saveSkillState ────────────────────────────────────────────────────────

  describe('saveSkillState', () => {
    it('persists a state that survives a subsequent load', async () => {
      const { loadSkillState, saveSkillState } = await import('../progressStore.js');
      const s = { ...freshState(), level: 2, correct: 16, attempts: 20 };
      saveSkillState(SKILL_ID, s);
      expect(loadSkillState(SKILL_ID)).toEqual(s);
    });

    it('overwrites a previous state for the same skill', async () => {
      const { loadSkillState, saveSkillState } = await import('../progressStore.js');
      saveSkillState(SKILL_ID, { ...freshState(), level: 1 });
      saveSkillState(SKILL_ID, { ...freshState(), level: 3 });
      expect(loadSkillState(SKILL_ID)?.level).toBe(3);
    });

    it('does not overwrite other skills when saving one', async () => {
      const { loadSkillState, saveSkillState } = await import('../progressStore.js');
      const s1 = { ...freshState(SKILL_ID), level: 2 };
      const s2 = { ...freshState(OTHER_ID), level: 4 };
      saveSkillState(SKILL_ID, s1);
      saveSkillState(OTHER_ID, s2);
      // Save SKILL_ID again; OTHER_ID must be unaffected.
      saveSkillState(SKILL_ID, { ...s1, level: 3 });
      expect(loadSkillState(OTHER_ID)?.level).toBe(4);
    });

    it('does not throw when localStorage.setItem throws (quota exceeded etc.)', async () => {
      storage.setItem = () => { throw new DOMException('QuotaExceededError'); };
      const { saveSkillState } = await import('../progressStore.js');
      expect(() => saveSkillState(SKILL_ID, freshState())).not.toThrow();
    });

    it('makes progress still readable mid-session even when save later fails', async () => {
      const { loadSkillState, saveSkillState } = await import('../progressStore.js');
      // First save succeeds, second throws.
      let callCount = 0;
      const realSetItem = storage.setItem.bind(storage);
      storage.setItem = (k, v) => {
        callCount++;
        if (callCount > 1) throw new DOMException('QuotaExceededError');
        realSetItem(k, v);
      };
      saveSkillState(SKILL_ID, { ...freshState(), level: 2 });
      expect(() => saveSkillState(SKILL_ID, { ...freshState(), level: 3 })).not.toThrow();
      // First save (level 2) should still be readable.
      expect(loadSkillState(SKILL_ID)?.level).toBe(2);
    });
  });

  // ── Schema versioning ─────────────────────────────────────────────────────

  describe('schema versioning', () => {
    it('stored JSON includes the schema version', async () => {
      const { saveSkillState, SCHEMA_VERSION } = await import('../progressStore.js');
      saveSkillState(SKILL_ID, freshState());
      const raw = JSON.parse(storage.getItem('tinku:v1:skills'));
      expect(raw.version).toBe(SCHEMA_VERSION);
    });

    it('stored JSON contains the skills map', async () => {
      const { saveSkillState } = await import('../progressStore.js');
      const s = freshState();
      saveSkillState(SKILL_ID, s);
      const raw = JSON.parse(storage.getItem('tinku:v1:skills'));
      expect(raw.skills[SKILL_ID]).toEqual(s);
    });
  });

  // ── Round-trip fidelity ───────────────────────────────────────────────────

  describe('round-trip fidelity', () => {
    it('preserves all skill state fields through save→load', async () => {
      const { loadSkillState, saveSkillState } = await import('../progressStore.js');
      const s = {
        ...freshState(),
        level: 4,
        difficulty: 3,
        attempts: 50,
        correct: 42,
        lastSeen: '2024-06-01',
        nextReview: '2024-06-08',
        reviewInterval: 2,
        recentParams: ['add:1,2', 'add:3,4'],
        misconceptions: { 'off-by-one': 3, 'forgot-carry': 1 },
      };
      saveSkillState(SKILL_ID, s);
      expect(loadSkillState(SKILL_ID)).toEqual(s);
    });
  });
});
