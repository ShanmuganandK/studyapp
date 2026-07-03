// E.164 format without the '+'. Swap to change the feedback recipient.
export const FEEDBACK_WHATSAPP_NUMBER = '919941230649';

const FEEDBACK_PREFILL = 'Tinku Math feedback: ';

export function feedbackWhatsAppUrl() {
  return `https://wa.me/${FEEDBACK_WHATSAPP_NUMBER}?text=${encodeURIComponent(FEEDBACK_PREFILL)}`;
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
