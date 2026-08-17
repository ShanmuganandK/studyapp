/**
 * progressBackup — pure envelope build/parse/validate logic for parent-zone progress export
 * and import (TRACKER "Now" #3, shape locked in DECISIONS 2026-08-17).
 *
 * No DOM, no storage, no React — mirrors the purity discipline of `engine/mastery.js` and
 * `engine/composer.js`. `composer.js` takes `skillMap` as a PARAMETER rather than importing
 * `recipes/skillMap.js`, keeping the engine layer decoupled from curriculum data; this module
 * follows the same pattern and takes `knownSkillIds` as a parameter instead of importing the
 * curriculum module.
 *
 * VALIDATION IS BOUNDARY-ONLY (STANDARDS §2): `buildExportEnvelope` does NOT re-validate its
 * `skills` argument. Its only real caller is `progressStore.loadAllSkillStates()`, which is
 * already the ownership boundary for skill-state shape — re-validating here would duplicate
 * `mastery.js`'s shape contract in a second place. The strict allowlist enforcement lives
 * entirely on the IMPORT side (`parseImportPayload`), where untrusted external data enters.
 */

export const BACKUP_FORMAT = 'tinku-math-progress';
export const BACKUP_VERSION = 1;
const SUPPORTED_VERSIONS = [BACKUP_VERSION];

/**
 * Allowlist = exactly the keys `emptySkillState()` produces (`engine/mastery.js`). Hard-coded
 * here (not imported) so this module stays dependency-free; a guard test in
 * `__tests__/progressBackup.test.js` keeps this list honest against drift in mastery.js's shape.
 */
export const SKILL_STATE_KEYS = [
  'skillId', 'level', 'difficulty', 'maxDifficulty', 'attempts', 'correct',
  'lastSeen', 'nextReview', 'reviewInterval', 'recentParams', 'misconceptions',
];

const SKILL_STATE_KEY_SET = new Set(SKILL_STATE_KEYS);

/**
 * Build the versioned, refusable export envelope. Filename comes from `exportFilename`.
 * @param {{ [skillId: string]: object }} skills - as returned by loadAllSkillStates()
 * @param {Date} [now]
 */
export function buildExportEnvelope(skills, now = new Date()) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    skills,
  };
}

/**
 * `tinku-math-progress-YYYY-MM-DD.json`, using the LOCAL calendar date — not UTC. A parent
 * exporting near midnight expects the date on their own clock. This is a deliberate one-place
 * deviation from `mastery.js`'s UTC-for-determinism convention, which solves a different
 * problem (stored-data determinism, not a human-facing filename).
 * @param {Date} [date]
 */
export function exportFilename(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `tinku-math-progress-${y}-${m}-${d}.json`;
}

// ─── Structural validation ────────────────────────────────────────────────────

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const FIELD_TYPES = {
  skillId: (v) => typeof v === 'string' && v.length > 0,
  level: (v) => typeof v === 'number',
  difficulty: (v) => typeof v === 'number',
  maxDifficulty: (v) => typeof v === 'number',
  attempts: (v) => typeof v === 'number',
  correct: (v) => typeof v === 'number',
  lastSeen: (v) => v === null || typeof v === 'string',
  nextReview: (v) => v === null || typeof v === 'string',
  reviewInterval: (v) => typeof v === 'number',
  recentParams: (v) => Array.isArray(v),
  misconceptions: (v) => isPlainObject(v),
};

/**
 * Strict, all-or-nothing structural check for one skill-state entry: exactly the allowlisted
 * keys (no extras — DECISIONS wants the envelope "guarded, not merely reviewed once"), correct
 * types, and the entry's own `skillId` must match the object key it's stored under (a cheap
 * tamper/corruption check on a hand-edited or damaged file).
 */
function isValidSkillStateEntry(entry, mapKey) {
  if (!isPlainObject(entry)) return false;
  const keys = Object.keys(entry);
  if (keys.length !== SKILL_STATE_KEYS.length) return false;
  if (!keys.every((k) => SKILL_STATE_KEY_SET.has(k))) return false;
  if (!SKILL_STATE_KEYS.every((k) => FIELD_TYPES[k](entry[k]))) return false;
  return entry.skillId === mapKey;
}

/**
 * Validate a raw backup JSON string and return either the restorable skills map or a refusal.
 *
 * @param {string} rawJsonString
 * @param {Iterable<string>} knownSkillIds - today's curriculum skillIds (caller supplies —
 *   this module never imports the skill map, same decoupling as composer.js).
 * @returns {{ valid: true, skills: object, ignoredSkillCount: number }
 *          | { valid: false, error: 'not-json'|'wrong-format'|'unsupported-version'|'malformed-skills' }}
 */
export function parseImportPayload(rawJsonString, knownSkillIds) {
  let parsed;
  try {
    parsed = JSON.parse(rawJsonString);
  } catch {
    return { valid: false, error: 'not-json' };
  }

  if (!isPlainObject(parsed) || parsed.format !== BACKUP_FORMAT) {
    return { valid: false, error: 'wrong-format' };
  }
  if (!SUPPORTED_VERSIONS.includes(parsed.version)) {
    return { valid: false, error: 'unsupported-version' };
  }
  if (!isPlainObject(parsed.skills)) {
    return { valid: false, error: 'malformed-skills' };
  }

  // Strict layer: EVERY entry must structurally match, or the whole import is refused.
  const entries = Object.entries(parsed.skills);
  for (const [skillId, entry] of entries) {
    if (!isValidSkillStateEntry(entry, skillId)) {
      return { valid: false, error: 'malformed-skills' };
    }
  }

  // Lenient layer, kept structurally separate from the strict one above: a skillId the
  // structurally-sound entry names but that isn't in today's curriculum is dropped and
  // counted, never fatal — the skill map grows and an old backup must stay restorable.
  const known = new Set(knownSkillIds);
  const skills = {};
  let ignoredSkillCount = 0;
  for (const [skillId, entry] of entries) {
    if (known.has(skillId)) {
      skills[skillId] = entry;
    } else {
      ignoredSkillCount += 1;
    }
  }

  return { valid: true, skills, ignoredSkillCount };
}
