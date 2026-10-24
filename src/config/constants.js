import { CONTACT_EMAIL } from './privacyPolicy';

// Parent-zone feedback goes to the PUBLISHED contact address (privacyPolicy.js CONTACT_EMAIL, the one address the
// privacy policy and the store listing name). It is a mailto: link, so the phone opens the parent's own email app
// with the address and subject filled in and the app sends nothing. Never put a personal phone number or personal
// address here (founder, DECISIONS 2026-10-22; AGENTS.md "keep personal addresses out of the repo").
const FEEDBACK_SUBJECT = 'Tinku Math feedback';

export function feedbackMailtoUrl() {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(FEEDBACK_SUBJECT)}`;
}

// Privacy reassurance shown to parents. SINGLE SOURCE OF TRUTH — edited here only; the parent
// dashboard (prominent card) and the home screen (subtle footer) both render this exact copy.
// Claims are limited to what is TRUE today (anonymous, on-device). Do NOT add "offline" or
// "no tracking" — those would be false. `title` + `body` concatenate to the exact approved copy.
export const PRIVACY_NOTICE = {
  title: 'Safe & private by design.',
  body:
    "No sign-up needed to play. We never collect your child's name, email, or " +
    "personal information. Your child's progress is saved right here on your device.",
};
