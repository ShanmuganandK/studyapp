/**
 * PRIVACY_POLICY — the full privacy policy, as DATA. SINGLE SOURCE OF TRUTH.
 *
 * The policy has to exist in two places at once and they must never disagree:
 *   1. a PUBLIC URL   — Play requires a policy link in the store listing, and a reviewer
 *                       must be able to open it without installing anything. Generated to
 *                       `public/privacy.html` by `scripts/build-privacy-page.mjs`.
 *   2. INSIDE the app — Designed-for-Families expects the policy to be reachable in-app.
 *                       Rendered by `components/PrivacyPolicy.jsx` from the parent zone.
 *
 * Both read THIS module, so the two can only drift if someone hand-edits the generated HTML —
 * which `config/__tests__/privacyPolicy.test.js` fails the build for.
 *
 * WORDING IS LOAD-BEARING — read DECISIONS 2026-08-14 (+ its 2026-08-15 amendment) before
 * touching a sentence:
 *   - The app-side claim is stated FLATLY (no accounts, no auth SDK, no analytics, no network
 *     calls from the app) because the 2026-08-15 network audit MEASURED it: the built app makes
 *     12 requests, all same-origin, zero off-origin. Guarded by
 *     `services/__tests__/noFirebaseAuth.test.js`.
 *   - The store/hosting technical-data section STAYS. Play Console vitals and Netlify request
 *     logs are real, outside our control, and NOT covered by the app-side claim.
 *   - The absolute claim "we collect no personal data" is REJECTED, for that same reason.
 *
 * Claims are limited to what is TRUE TODAY (same rule as PRIVACY_NOTICE in `constants.js`).
 * Do not describe a feature that has not shipped — see the export/import note below.
 */

/** Display name used in the policy prose and the generated page title. */
export const APP_NAME = 'Tinku Math';

/** Shown to the reader and re-published on every change. Update when the text changes. */
export const LAST_UPDATED = '15 August 2026';

/** Grievance/contact address. Also the Rule 9 contact if Layer 2 ever returns. */
export const CONTACT_EMAIL = 'shanmuganand.kanniappan@gmail.com';

/**
 * Ordered sections. `heading: null` renders as an unheaded lede paragraph.
 * Plain strings only — no markup — so the same data renders safely as HTML and as React.
 */
export const SECTIONS = [
  {
    id: 'summary',
    heading: null,
    paragraphs: [
      'Short version: the app collects nothing about you or your child.',
    ],
  },
  {
    id: 'no-accounts',
    heading: 'No sign-up, no accounts',
    paragraphs: [
      `${APP_NAME} has no sign-up and no accounts. Your child's progress — skills practised, ` +
        'levels, streaks — is saved on your device only. It is never sent to us. We cannot see it.',
    ],
  },
  {
    id: 'not-collected',
    heading: 'What we do not collect',
    paragraphs: [
      'We do not collect: names, email addresses, phone numbers, dates of birth, photos, ' +
        'voice recordings, location, contacts, or school details.',
    ],
  },
  {
    id: 'not-used',
    heading: 'What we do not use',
    paragraphs: [
      'We do not use: advertising, analytics, tracking, or third-party marketing tools of any kind.',
    ],
  },
  {
    id: 'on-device',
    heading: 'Progress stays on your device',
    // TODO (TRACKER "Now" #3 — progress export/import): when the parent-zone export ships,
    // append the second sentence of the approved draft here:
    //   'You can save a backup copy from the Parent Zone at any time.'
    // It is deliberately ABSENT today because the feature does not exist yet, and this file
    // may only claim what is true now.
    paragraphs: [
      'Because progress is stored on your device, clearing your browser data, uninstalling, ' +
        'or switching devices will erase it.',
    ],
  },
  {
    id: 'technical',
    heading: 'Standard technical information',
    paragraphs: [
      `Like any app or website, the services that deliver ${APP_NAME} to you — our hosting ` +
        'provider and the app store — record standard technical information such as IP address ' +
        "and app crash reports. We do not use this to identify or profile anyone, and it is not " +
        "linked to your child's progress.",
    ],
  },
  {
    id: 'children',
    heading: 'Children',
    paragraphs: [
      `${APP_NAME} is designed for children aged roughly 5–9 and their parents. Because we ` +
        'process no personal data about children, no parental consent is required for the app to work.',
    ],
  },
  {
    id: 'contact',
    heading: 'Questions or complaints',
    paragraphs: [
      `${CONTACT_EMAIL} — we aim to respond within 30 days.`,
    ],
  },
  {
    id: 'changes',
    heading: 'Changes',
    paragraphs: [
      'If this policy changes, the updated version will be posted here with a new date.',
    ],
  },
];

export const PRIVACY_POLICY = {
  appName: APP_NAME,
  title: `${APP_NAME} — Privacy Policy`,
  lastUpdated: LAST_UPDATED,
  contactEmail: CONTACT_EMAIL,
  sections: SECTIONS,
};

/**
 * Split a paragraph around the contact email so each renderer can turn it into a mailto link
 * in its own idiom (an `<a>` element in React, an escaped `<a href>` in the generated HTML)
 * without either one re-deriving where the address sits.
 *
 * @param {string} text
 * @param {string} [email]
 * @returns {Array<{ type: 'text'|'email', value: string }>} parts in original order
 */
export function linkifyEmailParts(text, email = CONTACT_EMAIL) {
  const parts = [];
  let rest = text;

  for (let i = rest.indexOf(email); i !== -1; i = rest.indexOf(email)) {
    if (i > 0) parts.push({ type: 'text', value: rest.slice(0, i) });
    parts.push({ type: 'email', value: email });
    rest = rest.slice(i + email.length);
  }
  if (rest) parts.push({ type: 'text', value: rest });

  return parts;
}
