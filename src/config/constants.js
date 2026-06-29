// E.164 format without the '+'. Swap to change the feedback recipient.
export const FEEDBACK_WHATSAPP_NUMBER = '919941230649';

const FEEDBACK_PREFILL = 'Tinku Math feedback: ';

export function feedbackWhatsAppUrl() {
  return `https://wa.me/${FEEDBACK_WHATSAPP_NUMBER}?text=${encodeURIComponent(FEEDBACK_PREFILL)}`;
}
