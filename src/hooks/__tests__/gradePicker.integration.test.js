/**
 * First-run grade picker — cross-module guarantees (DECISIONS 2026-09-23).
 *
 * The picker's own UI is covered in components/__tests__/GradePickerScreen.test.jsx
 * (render/choice), the gate that decides whether it is shown at all in
 * components/__tests__/GradePickerGate.integration.test.jsx (the real ThemeManager), and
 * chooseInitialGrade's state/persistence in useTestSettings.test.js. This file covers the two
 * claims that only make sense checked ACROSS modules:
 *   1. The grade the picker writes lands under the SAME key the parent-zone control already
 *      writes (`tinku:v1:testSettings`), not a new key.
 *   2. A progress export built after the picker runs carries no trace of the grade — because
 *      `buildExportEnvelope`/`loadAllSkillStates` only ever read `tinku:v1:skills`, a different
 *      key entirely (ARCHITECTURE.md: "What travels: tinku:v1:skills only").
 *
 * Node env, stubbed localStorage — mirrors testSettings.test.js / progressStore.test.js.
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

const TEST_SETTINGS_KEY = 'tinku:v1:testSettings';
const SKILLS_KEY = 'tinku:v1:skills';

describe('grade picker — cross-module guarantees', () => {
  let storage;

  beforeEach(() => {
    storage = makeStorage();
    vi.stubGlobal('localStorage', storage);
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes the chosen grade under tinku:v1:testSettings — the same key the parent-zone control uses', async () => {
    const { saveTestSettings, loadTestSettings } = await import('../../services/testSettings.js');
    // Simulates chooseInitialGrade's write shape.
    saveTestSettings({ theme: 'wonder', grade: 2, bridgeEnabled: false, gradeChosen: true });
    expect(Object.keys(storage._store)).toEqual([TEST_SETTINGS_KEY]);
    expect(loadTestSettings()).toEqual({ theme: 'wonder', grade: 2, bridgeEnabled: false, gradeChosen: true });
  });

  it('a progress export built after the picker runs contains no "grade" anywhere', async () => {
    const { saveTestSettings } = await import('../../services/testSettings.js');
    const { loadAllSkillStates } = await import('../../services/progressStore.js');
    const { buildExportEnvelope } = await import('../../services/progressBackup.js');

    saveTestSettings({ theme: 'wonder', grade: 2, bridgeEnabled: false, gradeChosen: true });

    // loadAllSkillStates reads ONLY tinku:v1:skills, which this test never wrote to — empty, as
    // it would be for a genuinely fresh device that just went through the picker.
    const skills = loadAllSkillStates();
    expect(skills).toEqual({});

    const envelope = buildExportEnvelope(skills, new Date('2026-09-23T00:00:00Z'));
    const json = JSON.stringify(envelope);
    expect(json).not.toMatch(/"grade"/);
    expect(json).not.toMatch(/gradeChosen/);
    // And the skills key itself was never touched by the testSettings write.
    expect(storage._store[SKILLS_KEY]).toBeUndefined();
  });
});
