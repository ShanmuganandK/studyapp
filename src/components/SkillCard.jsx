import MasteryPips from './MasteryPips';

/**
 * SkillCard — presentational card for one skill on the home screen (UI overhaul, Screen 3).
 *
 * PURELY PRESENTATIONAL (STANDARDS §2). Recommendation ("Tinku suggests") and review-due are
 * computed in the ENGINE (composer / mastery) and handed in as plain booleans — this card never
 * calls the engine or recomputes that logic. All colours/radii/shadows are design tokens.
 *
 * Colour meanings (LOCKED): review-due (border + ↻ glyph) uses the dedicated `review` token
 * (calm teal), NEVER amber — amber = reward/achievement only (DECISIONS 2026-07-05). "Tinku
 * suggests" uses the `learn` (sky) family, kept distinct from review so the two read differently
 * on the same list. The review LABEL text uses a readable ink token (never light-on-light).
 *
 * @param {object} skill - skill-map entry ({ icon, displayName, name, subtitle })
 * @param {number} level - mastery level 0–MAX_LEVEL (drives the pips)
 * @param {boolean} isDue - due for spaced-rep review (from engine isDueForReview)
 * @param {boolean} isSuggested - this skill is the active recommendation
 * @param {boolean} isReviewSuggested - the recommendation reason is 'review'
 * @param {number} index - position in the list; drives the stagger-in delay
 * @param {() => void} onClick
 */
export default function SkillCard({ skill, level, isDue, isSuggested, isReviewSuggested, index = 0, onClick }) {
  const borderClass = isReviewSuggested
    ? 'border-review'
    : isSuggested
    ? 'border-learn'
    : 'border-primary-soft';

  // The suggested card enters with the emphasis pulse; others get the quick stagger-in.
  const entranceClass = isSuggested ? 'animate-card-in-suggest' : 'animate-opt-in';

  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${index * 45}ms` }}
      className={`${entranceClass} bg-bg-card rounded-card shadow-card py-4 px-5 flex items-center gap-4 text-left border-4 ${borderClass} hover:scale-[1.03] active:scale-95 transition-transform`}
    >
      {skill.icon && (
        <span className="text-4xl leading-none flex-shrink-0" aria-hidden="true">
          {skill.icon}
        </span>
      )}
      <span className="flex flex-col min-w-0">
        <span className="font-display text-primary-ink font-extrabold text-lg leading-tight">
          {skill.displayName ?? skill.name}
        </span>
        {skill.subtitle && (
          <span className="text-muted text-xs font-medium mt-0.5">{skill.subtitle}</span>
        )}
        {isSuggested &&
          (isReviewSuggested ? (
            // ↻ glyph carries the review token; the label text stays readable ink (contrast).
            <span className="text-xs font-bold mt-1 text-ink">
              <span className="text-review">↻</span> Review time!
            </span>
          ) : (
            <span className="text-xs font-bold mt-1 text-learn-ink">Tinku suggests!</span>
          ))}
        <MasteryPips level={level} isDue={isDue} className="mt-1.5" />
      </span>
    </button>
  );
}
