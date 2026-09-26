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
 *
 * `bridgeEnabled` (DECISIONS 2026-09-22, bridge-in): the strategy-rung walk test toggle, default
 * OFF. Added WITHOUT bumping `SCHEMA_VERSION` — `loadTestSettings` resets to full defaults on
 * any version mismatch (`parsed?.version !== SCHEMA_VERSION`), so bumping it would wipe every
 * existing device's theme AND grade the moment this shipped, not just default the new field.
 * `normalise()` already falls back per-field on a value it doesn't recognise (including a
 * MISSING one), so a pre-existing v1 file with no `bridgeEnabled` key loads with its theme and
 * grade untouched and the toggle defaulting false — exactly the "must not reset anyone's theme
 * or grade" requirement, achieved by NOT touching the version.
 *
 * `gradeChosen` (DECISIONS 2026-09-23, launch scope): backs the first-run grade picker —
 * shown only when a device has NEVER had test settings written. Same NOT-bumping-SCHEMA_VERSION
 * reasoning applies, but the backfill rule is the OPPOSITE of `bridgeEnabled`'s: a legacy stored
 * record with no `gradeChosen` key must default to `true` (existing testers already picked a
 * grade — the picker must not reappear for them), while a brand-new device with NO record at
 * all defaults to `false` (never chosen — show the picker). `normalise()` therefore takes a
 * second, internal-only argument distinguishing "normalising an existing stored record" from
 * "building fresh defaults" — the only field where that distinction matters. Set to `true`
 * exclusively by the picker's own action (`chooseInitialGrade` in `useTestSettings.js`); the
 * ordinary parent-zone grade control does NOT set it, so it never re-triggers or suppresses the
 * picker as a side effect of unrelated use.
 */

import logger from '../utils/logger';

const STORAGE_KEY = 'tinku:v1:testSettings';
export const SCHEMA_VERSION = 1;

/** Theme slugs = the `.theme-<slug>` palettes in index.css. `wonder` = no class (the :root default). */
export const THEME_SLUGS = ['wonder', 'sunset', 'bubblegum', 'deepsea'];

/**
 * Selectable in the test panel TODAY. Launch scope is Grades 1–2 (DECISIONS 2026-09-23) — this
 * now MATCHES scope exactly (previously narrower than a stated 1–3 scope; the scope itself
 * changed). Grade 3 has no curriculum yet (TRACKER Now #12, skillMap.js has zero Grade-3
 * skills), and launch ships it as "coming soon" rather than offering it as a real choice.
 * Restore `3` here the same day Now #12's curriculum work lands.
 */
export const GRADES = [1, 2];

export const DEFAULT_TEST_SETTINGS = { theme: 'wonder', grade: 1, bridgeEnabled: false, gradeChosen: false };

/**
 * Coerce a stored/incoming value to a valid setting, falling back per-field on anything unknown.
 * `existingRecord`: true when `raw` came from an actual stored blob (as opposed to building the
 * all-defaults fallback for a genuinely empty/corrupt/version-mismatched read) — see
 * `gradeChosen`'s backfill below, the one field whose default depends on this distinction.
 */
function normalise(raw, { existingRecord = false } = {}) {
  const theme = THEME_SLUGS.includes(raw?.theme) ? raw.theme : DEFAULT_TEST_SETTINGS.theme;
  const grade = GRADES.includes(raw?.grade) ? raw.grade : DEFAULT_TEST_SETTINGS.grade;
  const bridgeEnabled =
    typeof raw?.bridgeEnabled === 'boolean' ? raw.bridgeEnabled : DEFAULT_TEST_SETTINGS.bridgeEnabled;
  // A pre-existing record with no gradeChosen key backfills to TRUE (a returning device already
  // picked a grade some other way); only the true first-run, no-record-at-all path backfills to
  // FALSE (DEFAULT_TEST_SETTINGS.gradeChosen, via loadTestSettings's early return below).
  const gradeChosen =
    typeof raw?.gradeChosen === 'boolean' ? raw.gradeChosen : existingRecord;
  return { theme, grade, bridgeEnabled, gradeChosen };
}

/**
 * Load the saved test settings, or safe defaults on missing/corrupt/failed storage.
 * @returns {{ theme: string, grade: number, bridgeEnabled: boolean, gradeChosen: boolean }}
 */
export function loadTestSettings() {
  try {
    const rawStr = localStorage.getItem(STORAGE_KEY);
    if (!rawStr) return { ...DEFAULT_TEST_SETTINGS }; // the ONLY path where gradeChosen is false
    const parsed = JSON.parse(rawStr);
    if (parsed?.version !== SCHEMA_VERSION) return { ...DEFAULT_TEST_SETTINGS };
    return normalise(parsed, { existingRecord: true });
  } catch (err) {
    logger.warn('[testSettings] read failed — using defaults this session.', err);
    return { ...DEFAULT_TEST_SETTINGS };
  }
}

/**
 * Persist the test settings in one write. Values are normalised so an out-of-range input can
 * never be stored. Fire-and-forget: failures are logged in dev, never thrown.
 * @param {{ theme: string, grade: number, bridgeEnabled: boolean, gradeChosen: boolean }} settings
 */
export function saveTestSettings(settings) {
  // A write always carries an existing-shaped record by the time it reaches here (the callers in
  // useTestSettings.js always spread over the previously loaded/saved state), so gradeChosen only
  // needs the same missing-key fallback as every other field — existingRecord: true is correct
  // for every real call site. A literally-empty `saveTestSettings({})` call (no caller does this)
  // would still safely default to false via DEFAULT_TEST_SETTINGS.gradeChosen — not a new risk.
  const { theme, grade, bridgeEnabled, gradeChosen } = normalise(settings, { existingRecord: true });
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, theme, grade, bridgeEnabled, gradeChosen }),
    );
  } catch (err) {
    logger.warn('[testSettings] write failed — setting won\'t persist this session.', err);
  }
}
