/**
 * BRAND — the product's name and one-line description. SINGLE SOURCE OF TRUTH.
 *
 * Five surfaces used to hold five separate literals and they drifted: the manifest said
 * "CBSE Math Kids", the launcher said "Math Kids", `index.html` said "CBSE Math Kids App", and the
 * privacy policy said "Tinku Math". **A privacy policy naming a different app than the store
 * listing is a Play review flag** — the policy has to name the app as the store lists it.
 *
 * So the name is defined ONCE here and every live surface derives from it. This is a stronger
 * guarantee than a guard that merely *detects* drift: `vite.config.js` (PWA manifest + the
 * `index.html` <title>) and `config/privacyPolicy.js` all import from this file, so they cannot
 * disagree by construction. The guard in `config/__tests__/brand.test.js` then covers the surfaces
 * that can only be checked, not derived (`package.json`, `README.md`).
 *
 * Node reads this at config-load time (vite.config.js imports it), so keep it dependency-free
 * plain JS — no JSX, no React, no imports. Same constraint as `config/privacyPolicy.js`, which
 * `scripts/build-privacy-page.mjs` imports the same way.
 *
 * ─── What does NOT live here ────────────────────────────────────────────────────────────────
 *
 * The **Play Store listing title** is deliberately absent. It is `Tinku Math: Maths for Kids`
 * (26/30 chars), it is entered by hand in Play Console, and nothing in the codebase should read
 * it — a listing title is ASO copy that changes on its own schedule, whereas PRODUCT_NAME is the
 * app's identity. Recorded in DECISIONS 2026-08-16 and the TRACKER pre-launch checklist.
 *
 * The rule locked with it: **brand first, keyword second.** "CBSE" must not appear in the NAME —
 * CBSE is a statutory board and a name implying affiliation risks Play's impersonation policy.
 * Describing the app as CBSE-*aligned* in the DESCRIPTION is a different and much safer claim,
 * which is why the word survives below but not in PRODUCT_NAME.
 */

/** The product's name. In-app, in the PWA manifest, in the page title, in the privacy policy. */
export const PRODUCT_NAME = 'Tinku Math';

/**
 * Home-screen / launcher name. Android truncates around 12 characters, so this is checked against
 * that limit by the brand guard — 'Tinku Math' is 10 and needs no abbreviation. If PRODUCT_NAME
 * ever grows, pick a real short form here rather than letting the launcher truncate blindly.
 */
export const SHORT_NAME = 'Tinku Math';

/** Manifest description. Keeps "CBSE-aligned" — descriptive use is the safe form (see above). */
export const DESCRIPTION = 'CBSE-aligned maths practice for Grades 1-3';
