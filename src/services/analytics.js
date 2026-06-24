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

// Vite sets import.meta.env.DEV; default to dev-safe if unavailable (e.g. plain node).
const IS_DEV = (() => {
  try {
    return import.meta.env?.DEV ?? true;
  } catch {
    return true;
  }
})();

/**
 * Log a behavioural analytics event.
 * @param {string} name - snake_case event name (analytics-plan.md is the source of truth)
 * @param {object} [params] - low-cardinality, non-PII properties
 */
export function logEvent(name, params = {}) {
  try {
    if (IS_DEV) {
      // Dev/test: surface events to the console so the kid-test + local runs are observable.
      // eslint-disable-next-line no-console
      console.log('[analytics]', name, params);
      return;
    }
    // TODO(prod): forward to Firebase Analytics once it's enabled
    //   (getAnalytics(app) → logEvent(analytics, name, params)). Deferred — this thin build
    //   only needs the wrapper + event shapes; prod forwarding lands with the Firebase task.
  } catch {
    // Never let analytics break the UI.
  }
}
