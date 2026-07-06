import { useState } from 'react';
import { SKILLS } from '../recipes/skillMap';
import { loadAllSkillStates } from '../services/progressStore';
import { isDueForReview } from '../engine/mastery';
import { recommendNext } from '../engine/composer';
import Mascot from './Mascot';
import PrivacyNotice from './PrivacyNotice';
import SkillCard from './SkillCard';

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
 *
 * UI overhaul (Screen 3): reskinned onto the design tokens; each card is the presentational
 * <SkillCard> primitive. The engine data-flow is UNCHANGED — recommendation (recommendNext) and
 * review-due (isDueForReview) stay in the engine and are consumed here, then passed to SkillCard
 * as plain booleans (SkillCard never calls the engine).
 */
export default function SkillSelectScreen({ onSelectSkill }) {
  // Lazy init: single synchronous localStorage read on mount. Both allStates and
  // recommendation are derived from the same snapshot so they stay consistent.
  // The component remounts after every quiz session (ThemeManager conditional render)
  // so this always reflects the latest saved state.
  // NOTE (Screen 3): these engine calls in the component are PRESERVED, not overlooked — a
  // conscious scope decision. It's a thin delegation to the pure engine (composer/mastery), not
  // recomputed logic; the reskin only changed rendering, not this data-flow.
  const [{ allStates, recommendation }] = useState(() => {
    const states = loadAllSkillStates();
    const nowDate = new Date().toISOString().slice(0, 10);
    return { allStates: states, recommendation: recommendNext(states, SKILLS, nowDate) };
  });
  const today = new Date().toISOString().slice(0, 10);

  const skills = Object.values(SKILLS)
    .filter((s) => s.status === 'ready')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col items-center min-h-full bg-bg px-6 py-8 text-center">
      <Mascot emotion="waving" size={140} />
      <h2 className="font-display text-2xl font-extrabold text-primary-ink mt-3">What shall we practise?</h2>
      <p className="text-muted text-sm mb-6">Pick a skill to play with Tinku!</p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {skills.map((skill, i) => {
          const skillState = allStates[skill.id];
          const level = skillState?.level ?? 0;
          const isDue = skillState ? isDueForReview(skillState, today) : false;

          // Highlight only when this skill is the active recommendation.
          // 'all_caught_up' with a non-null skillId gets the gentle 'frontier' style —
          // it's a soft nudge, not a review urgency. null skillId means no highlight.
          const isSuggested =
            recommendation.skillId === skill.id &&
            recommendation.reason !== 'all_caught_up';
          const isReviewSuggested = isSuggested && recommendation.reason === 'review';

          return (
            <SkillCard
              key={skill.id}
              skill={skill}
              level={level}
              isDue={isDue}
              isSuggested={isSuggested}
              isReviewSuggested={isReviewSuggested}
              index={i}
              onClick={() => onSelectSkill(skill.id)}
            />
          );
        })}
      </div>

      {/* Subtle privacy reassurance for a glancing parent — muted, unobtrusive. */}
      <PrivacyNotice variant="footer" />
    </div>
  );
}
