/**
 * progressBackup tests — node env, no DOM. Pure build/parse/validate logic only.
 */

import { describe, it, expect } from 'vitest';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  SKILL_STATE_KEYS,
  buildExportEnvelope,
  exportFilename,
  parseImportPayload,
} from '../progressBackup';
import { emptySkillState } from '../../engine/mastery';

const SKILL_ID = 'g1.add.within20';
const OTHER_ID = 'g1.sub.within10';
const KNOWN_IDS = [SKILL_ID, OTHER_ID];

function validState(id = SKILL_ID) {
  return emptySkillState(id, 3);
}

describe('buildExportEnvelope', () => {
  it('wraps skills in a versioned, formatted envelope', () => {
    const skills = { [SKILL_ID]: validState() };
    const now = new Date('2026-08-17T12:00:00.000Z');
    const envelope = buildExportEnvelope(skills, now);
    expect(envelope).toEqual({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: '2026-08-17T12:00:00.000Z',
      skills,
    });
  });
});

describe('exportFilename', () => {
  it('formats as tinku-math-progress-YYYY-MM-DD.json using the local calendar date', () => {
    const date = new Date(2026, 0, 5); // Jan 5 2026, local time — exercises zero-padding
    expect(exportFilename(date)).toBe('tinku-math-progress-2026-01-05.json');
  });

  it('zero-pads single-digit month and day across a date boundary', () => {
    const date = new Date(2026, 8, 9); // Sep 9 2026
    expect(exportFilename(date)).toBe('tinku-math-progress-2026-09-09.json');
  });
});

describe('parseImportPayload — round trip', () => {
  it('accepts a payload it just built, preserving all skill data', () => {
    const skills = { [SKILL_ID]: validState(SKILL_ID), [OTHER_ID]: validState(OTHER_ID) };
    const raw = JSON.stringify(buildExportEnvelope(skills));
    const result = parseImportPayload(raw, KNOWN_IDS);
    expect(result).toEqual({ valid: true, skills, ignoredSkillCount: 0 });
  });
});

describe('parseImportPayload — refusal codes', () => {
  it('not-json: malformed JSON text', () => {
    expect(parseImportPayload('{not valid json', KNOWN_IDS)).toEqual({
      valid: false,
      error: 'not-json',
    });
  });

  it('wrong-format: valid JSON but not our envelope', () => {
    const raw = JSON.stringify({ hello: 'world' });
    expect(parseImportPayload(raw, KNOWN_IDS)).toEqual({ valid: false, error: 'wrong-format' });
  });

  it('wrong-format: format string does not match', () => {
    const raw = JSON.stringify({ format: 'some-other-app', version: 1, skills: {} });
    expect(parseImportPayload(raw, KNOWN_IDS)).toEqual({ valid: false, error: 'wrong-format' });
  });

  it('unsupported-version: a future/unknown version number', () => {
    const raw = JSON.stringify({ format: BACKUP_FORMAT, version: 99, skills: {} });
    expect(parseImportPayload(raw, KNOWN_IDS)).toEqual({
      valid: false,
      error: 'unsupported-version',
    });
  });

  it('malformed-skills: skills is not an object', () => {
    const raw = JSON.stringify({ format: BACKUP_FORMAT, version: 1, skills: 'nope' });
    expect(parseImportPayload(raw, KNOWN_IDS)).toEqual({
      valid: false,
      error: 'malformed-skills',
    });
  });

  it('malformed-skills: an entry is missing a required key', () => {
    const bad = { ...validState(SKILL_ID) };
    delete bad.attempts;
    const raw = JSON.stringify({ format: BACKUP_FORMAT, version: 1, skills: { [SKILL_ID]: bad } });
    expect(parseImportPayload(raw, KNOWN_IDS)).toEqual({
      valid: false,
      error: 'malformed-skills',
    });
  });

  it('malformed-skills: an entry has an extra, non-allowlisted key', () => {
    const bad = { ...validState(SKILL_ID), extra: 'field' };
    const raw = JSON.stringify({ format: BACKUP_FORMAT, version: 1, skills: { [SKILL_ID]: bad } });
    expect(parseImportPayload(raw, KNOWN_IDS)).toEqual({
      valid: false,
      error: 'malformed-skills',
    });
  });

  it('malformed-skills: an entry has a wrong-typed field', () => {
    const bad = { ...validState(SKILL_ID), level: 'three' };
    const raw = JSON.stringify({ format: BACKUP_FORMAT, version: 1, skills: { [SKILL_ID]: bad } });
    expect(parseImportPayload(raw, KNOWN_IDS)).toEqual({
      valid: false,
      error: 'malformed-skills',
    });
  });

  it('malformed-skills: an entry\'s own skillId does not match its map key (tamper/corruption)', () => {
    const bad = validState(SKILL_ID); // skillId field says SKILL_ID
    const raw = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 1,
      skills: { [OTHER_ID]: bad }, // ...but it's stored under a different key
    });
    expect(parseImportPayload(raw, KNOWN_IDS)).toEqual({
      valid: false,
      error: 'malformed-skills',
    });
  });

  it('a single malformed entry refuses the WHOLE import, even alongside valid entries', () => {
    const bad = { ...validState(OTHER_ID), extra: 'field' };
    const raw = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 1,
      skills: { [SKILL_ID]: validState(SKILL_ID), [OTHER_ID]: bad },
    });
    expect(parseImportPayload(raw, KNOWN_IDS)).toEqual({
      valid: false,
      error: 'malformed-skills',
    });
  });
});

describe('parseImportPayload — unknown skillIds (curriculum grows over time)', () => {
  it('drops structurally-valid entries whose skillId is not in the known set, and counts them', () => {
    const legacyId = 'g0.retired.skill';
    const raw = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 1,
      skills: { [SKILL_ID]: validState(SKILL_ID), [legacyId]: validState(legacyId) },
    });
    const result = parseImportPayload(raw, KNOWN_IDS);
    expect(result).toEqual({
      valid: true,
      skills: { [SKILL_ID]: validState(SKILL_ID) },
      ignoredSkillCount: 1,
    });
  });

  it('is not fatal even when EVERY entry is unknown', () => {
    const raw = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 1,
      skills: { 'g0.retired': validState('g0.retired') },
    });
    const result = parseImportPayload(raw, KNOWN_IDS);
    expect(result).toEqual({ valid: true, skills: {}, ignoredSkillCount: 1 });
  });
});

describe('Guard A — allowlist tracks the real skill-state shape (engine/mastery.js)', () => {
  it('SKILL_STATE_KEYS matches exactly the keys emptySkillState() produces', () => {
    // If mastery.js's shape ever gains/loses a field without this allowlist being updated to
    // match, this fails — the guard DECISIONS 2026-08-17 asks for against silent widening.
    expect([...SKILL_STATE_KEYS].sort()).toEqual(Object.keys(emptySkillState('x')).sort());
  });
});

describe('Guard B — a smuggled passcode-shaped entry is rejected, not silently admitted', () => {
  it('refuses an entry shaped like the parent passcode blob (extra key, missing required keys)', () => {
    // Simulates a hypothetical future bug that put passcode-shaped data under `skills`,
    // exactly what DECISIONS 2026-08-17 says must never happen.
    const raw = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 1,
      skills: { anon: { passcodeHash: 'deadbeef' } },
    });
    expect(parseImportPayload(raw, KNOWN_IDS)).toEqual({
      valid: false,
      error: 'malformed-skills',
    });
  });
});
