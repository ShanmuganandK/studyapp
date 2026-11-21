/**
 * quizLayout — which SPACING PROFILE the quiz screen uses.
 *
 * The quiz screen has ONE spacing budget (see `.quiz-stage` / `.quiz-grid` in `src/index.css`).
 * Every size inside it (Tinku, the hint slot, the question text, the answer tiles) is computed from
 * the screen's real height in that one place; no component resizes another. The profile is chosen
 * once per skill/grade (never per question), so Tinku never changes size mid-session:
 *
 *   roomy     Pure equation & compare skills (Classes 1–2). Short equations ("7 + 8 = ?"), so
 *             Tinku (28cqh) and the answer tiles (10.5cqh) get maximum room.
 *   story     Sequence strips & structured concept cards (ordinal, patterns, sorting, 21–99,
 *             place-value houses, money change, ruler/capacity). Balanced Tinku (24cqh) and
 *             tiles (9.5cqh) so the question card/strip gets ~37% of the stage height.
 *   stage     Visual & SVG tray skills (counting, shapes, spatial, length blocks, weight scale,
 *             coins, clock, pictograph, fractions, group compare). Tinku at 20cqh so the visual
 *             stage gets generous room without scrolling on compact phones.
 *   standard  Class 3 and up (not built yet).
 *
 * The numbers for each profile live in CSS (`.quiz-grid[data-profile='…']`). This module only picks
 * the name; `quizLayout.test.js` fails if a name here has no CSS behind it.
 *
 * DECISIONS 2026-10-18: the hint no longer shrinks Tinku; it has its own reserved slot.
 */
import { SKILLS } from '../recipes/skillMap.js';

export const QUIZ_PROFILES = ['roomy', 'story', 'stage', 'standard'];

export function quizProfileForGrade(grade, skillId = null) {
  if (Number(grade) >= 3) return 'standard';
  const skillProfile = skillId ? SKILLS[skillId]?.layoutProfile : null;
  if (skillProfile && QUIZ_PROFILES.includes(skillProfile)) {
    return skillProfile;
  }
  return 'roomy';
}
