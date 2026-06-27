import SessionPlayer from './SessionPlayer';

/**
 * RecipeQuizScreen — the new-engine playable quiz for a single chosen skill.
 *
 * Skill choosing now lives in SkillSelectScreen (the home); this screen receives the chosen
 * `skillId` and hands off to SessionPlayer, which drives the session (remediation, scoring,
 * session-end). A thin presentational seam between selection and play.
 */
export default function RecipeQuizScreen({ grade = 1, skillId, onBack }) {
  return <SessionPlayer grade={grade} skillId={skillId} onExit={onBack} />;
}
