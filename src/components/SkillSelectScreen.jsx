import { useState } from 'react';
import { SKILLS } from '../recipes/skillMap';
import { loadAllSkillStates } from '../services/progressStore';
import { isDueForReview } from '../engine/mastery';
import { MASTERY } from '../config/masteryConfig';
import Mascot from './Mascot';

/**
 * SkillSelectScreen — the home / landing screen and the ONLY path into practice.
 *
 * Lists every `status:'ready'` skill from the skill map (the validated recipes), ordered by the
 * map's `order` field, as tappable cards. Tapping one launches RecipeQuizScreen for that skill.
 * Light Wonder-band palette + Tinku, consistent with SessionPlayer / RecipeQuizScreen.
 *
 * Reads the skill map directly (pure data, not legacy): a `planned` skill has no recipe yet, so
 * it never appears here.
 *
 * Mastery pips: reads all saved skill states on mount via progressStore. ThemeManager renders
 * this screen conditionally (`{currentView === 'skills' && ...}`) so it is unmounted while the
 * child plays and remounted when they return — the lazy useState initialiser re-reads storage
 * on every mount, so pips always reflect the latest state after a completed session.
 */
export default function SkillSelectScreen({ onSelectSkill }) {
  // Lazy init: synchronous localStorage read once on mount. No subscription needed — the
  // component remounts after every quiz session (ThemeManager conditional render).
  const [allStates] = useState(() => loadAllSkillStates());
  const today = new Date().toISOString().slice(0, 10);

  const skills = Object.values(SKILLS)
    .filter((s) => s.status === 'ready')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col items-center min-h-full bg-sky-50 px-6 py-8 text-center">
      <Mascot emotion="waving" size={140} />
      <h2 className="text-2xl font-extrabold text-indigo-700 mt-3">What shall we practise?</h2>
      <p className="text-slate-500 text-sm mb-6">Pick a skill to play with Tinku!</p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {skills.map((skill) => {
          const skillState = allStates[skill.id];
          const level = skillState?.level ?? 0;
          const isDue = skillState ? isDueForReview(skillState, today) : false;
          return (
            <button
              key={skill.id}
              onClick={() => onSelectSkill(skill.id)}
              className="bg-white border-4 border-indigo-200 rounded-2xl shadow-sm py-4 px-5 flex items-center gap-4 hover:scale-105 active:scale-95 transition-transform text-left"
            >
              {skill.icon && (
                <span className="text-4xl leading-none flex-shrink-0" aria-hidden="true">
                  {skill.icon}
                </span>
              )}
              <span className="flex flex-col min-w-0">
                <span className="text-indigo-700 font-extrabold text-lg leading-tight">
                  {skill.displayName ?? skill.name}
                </span>
                {skill.subtitle && (
                  <span className="text-slate-400 text-xs font-medium mt-0.5">
                    {skill.subtitle}
                  </span>
                )}
                <MasteryPips level={level} isDue={isDue} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Five filled dots showing a skill's mastery level (0–5).
 * Colour progression reads as "getting stronger": sky → indigo → amber (mastered).
 * Deliberately not stars — stars are reserved for the in-session reward (DECISIONS).
 * A ↻ glyph signals a skill is due for spaced-repetition review.
 */
function MasteryPips({ level, isDue }) {
  return (
    <span className="flex gap-1 items-center mt-1.5" aria-label={`Level ${level} of ${MASTERY.MAX_LEVEL}`}>
      {Array.from({ length: MASTERY.MAX_LEVEL }).map((_, i) => {
        const filled = i < level;
        const colour = filled
          ? level >= MASTERY.MASTERED_LEVEL
            ? 'bg-amber-400'
            : level >= MASTERY.UNLOCK_LEVEL
            ? 'bg-indigo-400'
            : 'bg-sky-400'
          : 'bg-slate-200';
        return <span key={i} className={`w-2 h-2 rounded-full ${colour}`} />;
      })}
      {isDue && (
        <span className="ml-0.5 text-amber-500 text-xs font-bold leading-none" aria-label="due for review">
          ↻
        </span>
      )}
    </span>
  );
}
