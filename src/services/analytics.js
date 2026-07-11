/**
 * analytics — a tiny, swappable wrapper around event logging (analytics-plan.md).
 *
 * Everything calls `logEvent` here, never Firebase directly — so it's mockable in tests,
 * silent in dev, and we can swap providers later without touching feature code.
 *
 * Child-safety (Families Policy / DPDP): callers must pass behaviour only — skill ids,
 * difficulty, correctness, tags, counts, timings. NO names/emails/free-text/PII, ever.
 *
 * Fire-and-forget: logging must never block or break the UI.
 */

import logger from '../utils/logger';

/**
 * Log a behavioural analytics event.
 * @param {string} name - snake_case event name (analytics-plan.md is the source of truth)
 * @param {object} [params] - low-cardinality, non-PII properties
 */
export function logEvent(name, params = {}) {
  try {
    // Dev: surface events via logger so the kid-test + local runs are observable.
    // logger.info is a no-op in prod, so this line is automatically stripped there.
    logger.info('[analytics]', name, params);
    // TODO(prod): forward to Firebase Analytics once it's enabled:
    //   if (!import.meta.env.DEV) { firebaseLogEvent(analytics, name, params); }
    //   Deferred — only the wrapper + event shapes are needed now; prod forwarding
    //   lands with the Firebase task.
  } catch (err) {
    logger.warn('[analytics] logEvent failed', err);
  }
}
