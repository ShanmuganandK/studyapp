import { useState } from 'react';
import { readySkills } from '../engine/sessionLite';
import SessionPlayer from './SessionPlayer';
import Mascot from './Mascot';

/**
 * RecipeQuizScreen — the new-engine playable quiz, shown behind the `useRecipeEngine` flag.
 *
 * Lets the player pick a ready skill (so the kid-test can reach counting / addition /
 * subtraction / compare), then hands off to SessionPlayer. Legacy QuizEngine is untouched and
 * still rendered when the flag is off.
 */
export default function RecipeQuizScreen({ grade = 1, onBack }) {
  const [skillId, setSkillId] = useState(null);

  if (skillId) {
    return <SessionPlayer grade={grade} skillId={skillId} onExit={() => setSkillId(null)} />;
  }

  const skills = readySkills(grade);
  return (
    <div className="flex flex-col items-center min-h-full bg-sky-50 px-6 py-8 text-center">
      <Mascot emotion="waving" size={140} />
      <h2 className="text-2xl font-extrabold text-indigo-700 mt-3">What shall we practise?</h2>
      <p className="text-slate-500 text-sm mb-6">Pick a skill to play with Tinku!</p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {skills.map((skill) => (
          <button
            key={skill.id}
            onClick={() => setSkillId(skill.id)}
            className="bg-white border-4 border-indigo-200 text-indigo-700 font-bold text-lg py-4 rounded-2xl shadow-sm hover:scale-105 active:scale-95 transition-transform"
          >
            {skill.name}
          </button>
        ))}
      </div>

      {onBack && (
        <button onClick={onBack} className="text-slate-400 font-semibold mt-8 hover:text-slate-600">
          ← Back to map
        </button>
      )}
    </div>
  );
}
