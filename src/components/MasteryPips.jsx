import { MASTERY } from '../config/masteryConfig';

/**
 * MasteryPips — shared pip indicator for a skill's mastery LEVEL (level only).
 *
 * Used by SkillCard (home screen) and ParentDashboard. NOT used by SkillPathScreen's
 * PathPips — that duplicate is intentional pending the home-screen A/B test decision
 * (ARCHITECTURE.md — Experiments).
 *
 * Colour progression reads as "getting stronger": sky (learn) → indigo (primary) → amber
 * (accent, mastered = reward only). Deliberately not stars — stars are the in-session
 * reward (DECISIONS). The review-due ↻ cue lives in the LABEL now (shared skillStateVisual
 * grammar, 2026-07-15), NOT in the pips — pips carry level only, in every consumer.
 *
 * @param {number}  level     - mastery level 0–MASTERY.MAX_LEVEL
 * @param {string}  [className] - extra Tailwind classes for call-site layout (e.g. "mt-1.5")
 */
export default function MasteryPips({ level, className = '' }) {
  return (
    <span
      className={`flex gap-1 items-center ${className}`}
      aria-label={`Level ${level} of ${MASTERY.MAX_LEVEL}`}
    >
      {Array.from({ length: MASTERY.MAX_LEVEL }).map((_, i) => {
        const filled = i < level;
        const colour = filled
          ? level >= MASTERY.MASTERED_LEVEL
            ? 'bg-accent'
            : level >= MASTERY.UNLOCK_LEVEL
            ? 'bg-primary'
            : 'bg-learn'
          : 'bg-primary-soft';
        return <span key={i} className={`w-2 h-2 rounded-full ${colour}`} />;
      })}
    </span>
  );
}
