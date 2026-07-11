/**
 * progressStore — the single place mastery state is saved and loaded.
 *
 * DESIGN RULE: callers (hooks, screens) never touch the storage API directly.
 * Only this service does. This is the swap-point: today the backend is localStorage
 * (anonymous, on-device, no account); when cloud sync arrives (Firestore, lawyer-gated
 * separate task), this service is replaced/augmented without touching any caller.
 *
 * STORAGE: anonymous, behaviour-only, no PII. Data is keyed by skillId only — no user
 * name, email, or identifier. Fully DPDP-safe per DECISIONS.md.
 *
 * FAILURE HANDLING (§8): storage can fail (quota exceeded, private-browsing restrictions,
 * disabled by user). Every function catches, degrades gracefully, and never crashes. In
 * dev mode errors surface as warnings so they're observable during testing.
 */

import logger from '../utils/logger';

const STORAGE_KEY = 'tinku:v1:skills';
export const SCHEMA_VERSION = 1;

// ─── Internal read/write helpers ─────────────────────────────────────────────

/** Parse the stored blob, or return a fresh empty store on any failure. */
function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: SCHEMA_VERSION, skills: {} };
    const parsed = JSON.parse(raw);
    // Unknown or future schema version: return empty rather than crash.
    if (parsed?.version !== SCHEMA_VERSION) return { version: SCHEMA_VERSION, skills: {} };
    return { version: SCHEMA_VERSION, skills: parsed.skills ?? {} };
  } catch (err) {
    logger.warn('[progressStore] read failed — progress won\'t persist this session.', err);
    return { version: SCHEMA_VERSION, skills: {} };
  }
}

/** Persist the store blob. Errors are caught and logged; callers are unaffected. */
function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    logger.warn('[progressStore] write failed — progress won\'t persist this session.', err);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Load all saved skill states.
 * @returns {{ [skillId: string]: SkillState }} — empty object when nothing saved or on error.
 */
export function loadAllSkillStates() {
  return readStore().skills;
}

/**
 * Load one skill's saved state.
 * @param {string} skillId
 * @returns {SkillState | null} — null when no state has been saved yet.
 */
export function loadSkillState(skillId) {
  return readStore().skills[skillId] ?? null;
}

/**
 * Persist one skill's state (merges into the existing store so other skills are unaffected).
 * Fire-and-forget: storage failures are logged in dev but never bubble to the caller.
 * @param {string} skillId
 * @param {SkillState} skillState
 */
export function saveSkillState(skillId, skillState) {
  const store = readStore();
  store.skills[skillId] = skillState;
  writeStore(store);
}
