/**
 * HintBubble — Tinku's speech bubble for the remediation hint (the core teaching moment).
 *
 * PURELY PRESENTATIONAL. All hint LOGIC (which hint, when it shows/re-shows, the soft read
 * window) lives in useQuizSession; this component only renders what it's handed. That split
 * (STANDARDS §2) means a future visual redesign restyles this file without touching the ladder.
 *
 * Rendered directly below Tinku (who is in his 'encourage' pose on a wrong answer) with an
 * upward tail, so the hint reads as Tinku speaking. The parent gives it a changing `key`
 * (the hook's hintNonce) so the pop-in animation replays on every hint (re)emission — the
 * moment must grab a young child's attention, not slip by unnoticed.
 *
 * Styled from design tokens (theme-wonder). A hint is a LEARNING moment, so it wears the
 * gentle `learn` (sky) tint — not amber (amber = reward only) and not the wrong-answer coral.
 *
 * @param {string|null} hint     - the hint text; renders nothing when empty
 * @param {string}      emotion  - Tinku's current emotion (for aria/future styling hooks)
 */
export default function HintBubble({ hint, emotion = 'encourage' }) {
  if (!hint) return null;

  return (
    <div className="flex-shrink-0 flex justify-center mt-0.5 mb-1 px-2">
      <div
        role="status"
        aria-live="polite"
        data-emotion={emotion}
        // Compact but prominent: fluid text so a long hint stays a line or two and never crowds
        // the question off-screen (STANDARDS §5 fit-one-viewport).
        className="animate-hint-pop origin-top relative max-w-xs bg-learn-soft border-2 border-learn text-learn-ink rounded-card px-3.5 py-1.5 text-center font-semibold leading-snug shadow-card"
        style={{ fontSize: 'clamp(0.8rem, 3.4vw, 0.95rem)' }}
      >
        {/* Tail pointing up to Tinku — a rotated square sharing the bubble's top/left border. */}
        <span
          aria-hidden="true"
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-learn-soft border-t-2 border-l-2 border-learn rotate-45"
        />
        {hint}
      </div>
    </div>
  );
}
