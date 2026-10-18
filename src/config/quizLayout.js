/**
 * quizLayout — which SPACING PROFILE the quiz screen uses.
 *
 * The quiz screen has ONE spacing budget (see `.quiz-stage` / `.quiz-grid` in `src/index.css`).
 * Every size inside it (Tinku, the hint slot, the question text, the answer tiles) is computed from
 * the screen's real height in that one place; no component resizes another. The only thing JS decides
 * is the PROFILE, and it is decided per GRADE, never per question, so Tinku never changes size
 * mid-session:
 *
 *   roomy     Classes 1-2. Short questions ("10 × 4 = ?", "How many apples?"), so Tinku and the
 *             answer tiles get the room and the right emotion carries the moment.
 *   standard  Class 3 and up (not built yet). Wordier questions, so the question area is
 *             bigger and Tinku smaller. Tune when Class 3 content exists.
 *
 * The numbers for each profile live in CSS (`.quiz-grid[data-profile='…']`). This module only picks
 * the name; `quizLayout.test.js` fails if a name here has no CSS behind it.
 *
 * DECISIONS 2026-10-18: the hint no longer shrinks Tinku; it has its own reserved slot.
 */
export const QUIZ_PROFILES = ['roomy', 'standard'];

export function quizProfileForGrade(grade) {
  return Number(grade) >= 3 ? 'standard' : 'roomy';
}
