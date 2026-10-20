/**
 * practiceDays — device-local list of the calendar days the child finished a practice session.
 *
 * WHY (DECISIONS 2026-10-20): the closed-test success bar (L8) is "7 of 12 children practise on 3+ different
 * days in week 1 and 2+ in week 2", and the app has no analytics by design. The progress store only keeps ONE
 * `lastSeen` date per skill, so "days practised" cannot be derived from it; this is the smallest record that can.
 *
 * WHAT IT HOLDS: bare dates, 'YYYY-MM-DD', sorted, unique — no name, no identifier, no skill, no time of day.
 * It is progress (like skill levels), so it lives on the device, travels in the parent-zone progress export
 * (`progressBackup`), and is never sent anywhere.
 *
 * LOCAL DATE, not UTC: a child practising at 06:00 in India is still "today" on the family's own clock; UTC
 * would file that under yesterday and miscount days. (Same deliberate deviation `exportFilename` makes.)
 *
 * Own key (not inside `tinku:v1:skills`) so the skills store's allowlisted shape and its guards are untouched.
 * FAILURE HANDLING (§8): every function catches, degrades to "no days", and never crashes the app.
 */

import logger from '../utils/logger';

const STORAGE_KEY = 'tinku:v1:practiceDays';
export const SCHEMA_VERSION = 1;
/** About two years of daily practice. The oldest days are dropped past this, so the record cannot grow forever. */
export const MAX_DAYS = 800;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a well-formed 'YYYY-MM-DD' string. */
export function isValidDay(value) {
  return typeof value === 'string' && DAY_RE.test(value);
}

/** The device's LOCAL calendar date as 'YYYY-MM-DD'. */
export function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Sorted, de-duplicated, valid days only, capped at MAX_DAYS (newest kept). Pure. */
export function normaliseDays(days) {
  if (!Array.isArray(days)) return [];
  const unique = [...new Set(days.filter(isValidDay))].sort();
  return unique.length > MAX_DAYS ? unique.slice(unique.length - MAX_DAYS) : unique;
}

function write(days) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, days }));
  } catch (err) {
    logger.warn("[practiceDays] write failed — practice days won't persist this session.", err);
  }
}

/** @returns {string[]} sorted 'YYYY-MM-DD' days; [] when nothing saved, on any error, or on an unknown version. */
export function loadPracticeDays() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed?.version !== SCHEMA_VERSION) return [];
    return normaliseDays(parsed.days);
  } catch (err) {
    logger.warn('[practiceDays] read failed — treating as no practice days.', err);
    return [];
  }
}

/** Record that a session was finished on `date` (default: today, local). Idempotent. */
export function recordPracticeDay(date = localDateString()) {
  if (!isValidDay(date)) return;
  const days = loadPracticeDays();
  if (days.includes(date)) return;
  write(normaliseDays([...days, date]));
}

/** Replace the whole list (used by progress import, after it has been validated). */
export function replacePracticeDays(days) {
  write(normaliseDays(days));
}
