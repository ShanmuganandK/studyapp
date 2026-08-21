/**
 * testSettings — device-local storage seam for the PARENT TEST PANEL (theme + grade).
 *
 * WHAT THIS IS: a kid-test instrument, not a shipping feature (TRACKER Now #10). It lets a
 * parent, behind the gate, switch the colour theme and the working grade while testing on a
 * real device. Nothing here is kid-facing.
 *
 * DESIGN RULE (mirrors progressStore.js): callers never touch the storage API directly — only
 * this service does, and it owns its OWN key. These preferences are DELIBERATELY separate from
 * `progressStore` (`tinku:v1:skills`): that store is skills-only and allowlist-guarded, and
 * `progressBackup` rejects non-skill entries. Test settings must therefore NOT ride inside a
 * progress export — restoring a backup onto another device must never fight that device's test
 * settings. A separate key gives that for free (an export only ever reads the skills key).
 *
 * FAILURE HANDLING (§8): storage can fail (quota, private browsing, disabled). Every function
 * catches, degrades to defaults, and never crashes the app.
 */

import logger from '../utils/logger';

const STORAGE_KEY = 'tinku:v1:testSettings';
export const SCHEMA_VERSION = 1;

/** Theme slugs = the `.theme-<slug>` palettes in index.css. `wonder` = no class (the :root default). */
export const THEME_SLUGS = ['wonder', 'sunset', 'bubblegum', 'deepsea'];

/** Wonder-band launch scope is Grades 1–3 (DECISIONS). */
export const GRADES = [1, 2, 3];

export const DEFAULT_TEST_SETTINGS = { theme: 'wonder', grade: 1 };

/** Coerce a stored/incoming value to a valid setting, falling back per-field on anything unknown. */
function normalise(raw) {
  const theme = THEME_SLUGS.includes(raw?.theme) ? raw.theme : DEFAULT_TEST_SETTINGS.theme;
  const grade = GRADES.includes(raw?.grade) ? raw.grade : DEFAULT_TEST_SETTINGS.grade;
  return { theme, grade };
}

/**
 * Load the saved test settings, or safe defaults on missing/corrupt/failed storage.
 * @returns {{ theme: string, grade: number }}
 */
export function loadTestSettings() {
  try {
    const rawStr = localStorage.getItem(STORAGE_KEY);
    if (!rawStr) return { ...DEFAULT_TEST_SETTINGS };
    const parsed = JSON.parse(rawStr);
    if (parsed?.version !== SCHEMA_VERSION) return { ...DEFAULT_TEST_SETTINGS };
    return normalise(parsed);
  } catch (err) {
    logger.warn('[testSettings] read failed — using defaults this session.', err);
    return { ...DEFAULT_TEST_SETTINGS };
  }
}

/**
 * Persist the test settings in one write. Values are normalised so an out-of-range input can
 * never be stored. Fire-and-forget: failures are logged in dev, never thrown.
 * @param {{ theme: string, grade: number }} settings
 */
export function saveTestSettings(settings) {
  const { theme, grade } = normalise(settings);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, theme, grade }));
  } catch (err) {
    logger.warn('[testSettings] write failed — setting won\'t persist this session.', err);
  }
}
