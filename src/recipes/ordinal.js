/**
 * Recipe: ordinal numbers 1st–10th (Grade 1). Serves g1.num.ordinal. Format `mcq`.
 *
 * Shows a row of N distinct animals facing left and asks for the 1-based position from the left.
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Ordinal numbers (1st–10th)"):
 *   - cardinal-confusion  : outputs total count N instead of position p (guard: p < N)
 *   - right-to-left-start : counts from the right end ((N + 1) - p; guard: 2 * p !== N + 1)
 *   - off-by-one          : p ± 1
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;
const ITEMS = ['🐶', '🐱', '🐰', '🐼', '🦊', '🐸', '🐵', '🐯', '🦁', '🐮'];
const LINE_CAP = { 1: 5, 2: 10 };

const recipe = {
  skillId: 'g1.num.ordinal',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    const maxN = LINE_CAP[difficulty] ?? 10;
    const minN = difficulty === 1 ? 4 : 6;
    const N = rng.int(minN, maxN);
    const line = rng.shuffle(ITEMS).slice(0, N);
    const pos = rng.int(1, N);
    const target = line[pos - 1];

    const candidates = [];
    if (pos < N) {
      candidates.push({ value: N, tag: 'cardinal-confusion' });
    }
    if (2 * pos !== N + 1) {
      candidates.push({ value: N + 1 - pos, tag: 'right-to-left-start' });
    }
    if (pos > 1) {
      candidates.push({ value: pos - 1, tag: 'off-by-one' });
    }
    if (pos < N) {
      candidates.push({ value: pos + 1, tag: 'off-by-one' });
    }

    const distractors = selectDistractors({
      candidates,
      kind: 'place',
      context: { answer: pos },
      count: OPTION_COUNT - 1,
      rng,
    });

    const optionPairs = rng.shuffle([{ value: pos, tag: null }, ...distractors]);

    return {
      questionText: `From the left, ${target} is at position ? in: ${line.join(' ')}`,
      correctAnswer: pos,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
    };
  },
};

export default recipe;
