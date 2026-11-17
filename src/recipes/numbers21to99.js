/**
 * Recipe: numbers 21–99 (Grade 1). Serves g1.num.21-99. Format `mcq` — NOT `count-objects`
 * (the counting tray caps at 15 objects).
 *
 * Question text asks for the next number in sequence ("Count on: 28, 29, ?") so `correctAnswer`
 * is independently re-derivable from the numbers in the prompt. Decade boundaries (n % 10 === 9)
 * are deliberately drawn at higher frequency on rungs 2 and 3 to exercise decade-rollover
 * misconceptions.
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md ("Numbers 21–99"):
 *   - decade-transition-stall : resets ones to 0 after 9, forgets to increment tens (29 -> 20)
 *   - decade-ten-overshoot    : increments tens at decade boundary, keeps 9 ones (29 -> 39)
 *   - before-instead-of-after : counts backward instead of forward (n - 1)
 *   - place-value-swap        : swaps tens and ones of the target answer (guard: non-palindrome, non-decade)
 *   - off-by-one              : skips the next number (ans + 1)
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;

// Curriculum ceiling on the correct answer per difficulty rung.
const VALUE_CAP = { 1: 50, 2: 80, 3: 99 };
const DECADE_CHANCE = { 1: 0, 2: 50, 3: 60 };

function swapDigits(n) {
  return (n % 10) * 10 + Math.floor(n / 10);
}

/** Pick n such that answer = n + 1 stays within 21..cap. */
function pickBaseNumber(difficulty, rng) {
  const cap = VALUE_CAP[difficulty];
  const chance = DECADE_CHANCE[difficulty];

  if (chance > 0 && rng.int(0, 99) < chance) {
    const maxTens = Math.floor(cap / 10) - 1;
    const t = rng.int(2, maxTens);
    return t * 10 + 9;
  }

  let n = rng.int(20, cap - 1);
  if (difficulty === 1 && n % 10 === 9) {
    n -= 1;
  }
  return n;
}

const recipe = {
  skillId: 'g1.num.21-99',
  maxDifficulty: 3,

  generate(difficulty, rng) {
    const n = pickBaseNumber(difficulty, rng);
    const answer = n + 1;

    const candidates = [];
    if (n % 10 === 9) {
      candidates.push({ value: Math.floor(n / 10) * 10, tag: 'decade-transition-stall' });
      candidates.push({ value: n + 10, tag: 'decade-ten-overshoot' });
    }
    candidates.push({ value: n - 1, tag: 'before-instead-of-after' });
    if (answer % 11 !== 0 && answer % 10 !== 0) {
      candidates.push({ value: swapDigits(answer), tag: 'place-value-swap' });
    }
    candidates.push({ value: answer + 1, tag: 'off-by-one' });

    const distractors = selectDistractors({
      candidates,
      kind: 'place',
      context: { answer },
      count: OPTION_COUNT - 1,
      rng,
    });

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);

    return {
      questionText: `Count on: ${n - 1}, ${n}, ?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: { kind: 'number-step', sequence: [n - 1, n] },
    };
  },
};

export default recipe;
