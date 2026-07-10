import { PRIVACY_NOTICE } from '../config/constants';

/**
 * PrivacyNotice — a parent-facing reassurance about the app's privacy posture.
 * Presentational only; the copy is the single source of truth in `config/constants`
 * (PRIVACY_NOTICE) so both placements stay identical and are edited in one place.
 *
 * Variants:
 *   'card'   — prominent, calm bordered card for the parent zone / dashboard.
 *   'footer' — subtle muted text for the home (skill-select) screen; reassures a
 *              glancing parent without cluttering the kid's view.
 *
 * Do NOT render this on the quiz / gameplay screens (kid-facing).
 *
 * @param {'card'|'footer'} variant
 */
export default function PrivacyNotice({ variant = 'card' }) {
  const { title, body } = PRIVACY_NOTICE;

  if (variant === 'footer') {
    return (
      <p className="text-[11px] leading-snug text-muted text-center max-w-xs mx-auto mt-8 px-2">
        <span className="font-semibold text-muted">{title}</span> {body}
      </p>
    );
  }

  return (
    <div className="bg-bg-card rounded-card shadow-card p-4 text-left">
      <p className="text-sm font-bold text-learn-ink">{title}</p>
      <p className="text-sm text-muted mt-1 leading-snug">{body}</p>
    </div>
  );
}
