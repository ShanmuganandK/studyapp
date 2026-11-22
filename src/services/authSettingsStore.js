import logger from '../utils/logger';

/**
 * authSettingsStore — device-local persistence seam for parent passcode settings (and legacy
 * multi-profile keys).
 *
 * DESIGN RULE: `AuthContext` never touches `localStorage` directly; all reads/writes pass through
 * this service so storage failures degrade gracefully instead of crashing.
 */

const SETTINGS_PREFIX = 'math_kids_settings_';
const PROFILES_PREFIX = 'math_kids_profiles_';
const LAST_PROFILE_PREFIX = 'math_kids_last_profile_';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    logger.warn(`[authSettingsStore] read failed for ${key}`, err);
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    logger.warn(`[authSettingsStore] write failed for ${key}`, err);
  }
}

export function loadParentSettings(uid = 'anon') {
  return readJson(`${SETTINGS_PREFIX}${uid}`, { passcodeHash: null });
}

export function saveParentSettings(uid = 'anon', settings) {
  writeJson(`${SETTINGS_PREFIX}${uid}`, settings);
}

export function loadProfiles(uid) {
  if (!uid) return [];
  return readJson(`${PROFILES_PREFIX}${uid}`, []);
}

export function saveProfiles(uid, profiles) {
  if (!uid) return;
  writeJson(`${PROFILES_PREFIX}${uid}`, profiles);
}

export function loadLastProfileId(uid) {
  if (!uid) return null;
  try {
    return localStorage.getItem(`${LAST_PROFILE_PREFIX}${uid}`);
  } catch (err) {
    logger.warn('[authSettingsStore] read failed for last profile', err);
    return null;
  }
}

export function saveLastProfileId(uid, profileId) {
  if (!uid || !profileId) return;
  try {
    localStorage.setItem(`${LAST_PROFILE_PREFIX}${uid}`, profileId);
  } catch (err) {
    logger.warn('[authSettingsStore] write failed for last profile', err);
  }
}

export function clearLastProfileId(uid) {
  if (!uid) return;
  try {
    localStorage.removeItem(`${LAST_PROFILE_PREFIX}${uid}`);
  } catch (err) {
    logger.warn('[authSettingsStore] remove failed for last profile', err);
  }
}
