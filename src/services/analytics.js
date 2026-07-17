/**
 * analytics — an INERT no-op seam (MVP ships with NO analytics whatsoever).
 *
 * Per DECISIONS 2026-07-16: no Firebase Analytics SDK in the build, no telemetry (guest or
 * otherwise). Feature code still calls `logEvent(...)` everywhere (the seam is preserved), but the
 * wrapper does nothing — it emits no console output, no network, no Firebase. Analytics returns only
 * post-traction and only behind verified parental consent; when it does, ONLY this file changes
 * (call-sites stay identical). Do NOT re-add emission here without that consent decision.
 *
 * Child-safety (Families Policy / DPDP): if/when this is wired, callers must pass behaviour only —
 * skill ids, difficulty, correctness, tags, counts, timings. NO names/emails/free-text/PII, ever.
 */

/**
 * Log a behavioural analytics event. Currently a deliberate no-op (see file header).
 * @param {string} name - snake_case event name (analytics-plan.md is the source of truth)
 * @param {object} [params] - low-cardinality, non-PII properties
 */
// eslint-disable-next-line no-unused-vars
export function logEvent(name, params = {}) {
  // Intentionally inert — no emission of any kind (DECISIONS 2026-07-16).
}
