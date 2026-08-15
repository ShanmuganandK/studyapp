import MasteryPips from './MasteryPips';
import { getSkillVisual, SkillStateCue } from './skillStateVisual';

/**
 * SkillCard — presentational card for one skill on the home screen (UI overhaul, Screen 3).
 *
 * PURELY PRESENTATIONAL (STANDARDS §2). Recommendation ("Tinku suggests") and review-due are
 * computed in the ENGINE (composer / mastery) and handed in as plain booleans — this card never
 * calls the engine or recomputes that logic. All colours/radii/shadows are design tokens.
 *
 * State→visual mapping is the SHARED `getSkillVisual` grammar (skillStateVisual.jsx), identical to
 * SkillPathScreen so the two Home views can't drift. LOCKED colour rule: amber = reward-only;
 * review-due = teal, never amber; due-but-not-suggested = neutral ring + muted teal cue
 * (DECISIONS 2026-07-05 / 2026-07-15). The ↻ lives in the label — pips are level-only (dedupe).
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
  const visual = getSkillVisual({ level, isDue, isSuggested, isReviewSuggested });

  // The suggested card (the one loud element) enters with the emphasis pulse; others stagger in.
  const entranceClass = visual.loud ? 'animate-card-in-suggest' : 'animate-opt-in';

  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${index * 45}ms` }}
      className={`${entranceClass} bg-bg-card rounded-card shadow-card py-4 px-5 flex items-center gap-4 text-left border-4 ${visual.ring} hover:scale-[1.03] active:scale-95 transition-transform`}
    >
      {skill.icon && (
        <span className="text-[#ff00ff] text-4xl leading-none flex-shrink-0" aria-hidden="true">
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
        <SkillStateCue cue={visual.cue} className="mt-1" />
        <MasteryPips level={level} className="mt-1.5" />
      </span>
    </button>
  );
}
