import { SKILLS } from '../recipes/skillMap';
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
 */
export default function SkillSelectScreen({ onSelectSkill }) {
  const skills = Object.values(SKILLS)
    .filter((s) => s.status === 'ready')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col items-center min-h-full bg-sky-50 px-6 py-8 text-center">
      <Mascot emotion="waving" size={140} />
      <h2 className="text-2xl font-extrabold text-indigo-700 mt-3">What shall we practise?</h2>
      <p className="text-slate-500 text-sm mb-6">Pick a skill to play with Tinku!</p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {skills.map((skill) => (
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
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
