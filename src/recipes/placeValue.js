/**
 * Recipe: tens & ones place value intro (Grade 1). Serves g1.place.tens-ones. Format `mcq`.
 *
 * Question text spells out the tens-and-ones decomposition ("3 tens and 4 ones make ?") so
 * `correctAnswer` is independently re-derivable from the two digits in the text.
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md ("Place value intro — tens & ones"):
 *   - separate-digit-reading : writes the tens value with its zero alongside the ones (t*100 + o, e.g. 4 tens 2 ones -> 402)
 *   - digit-reversal         : swaps tens and ones (o*10 + t; guard: t !== o && o !== 0)
 *   - expanded-addition      : adds face values t + o instead of place values (guard: o !== 0)
 *   - tens-only-counted      : counts the tens bundles (t*10) and forgets the ones (or t when o === 0)
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;
const ZERO_ONES_CHANCE = 30;

// Curriculum ceiling per rung.
const VALUE_CAP = { 1: 39, 2: 69, 3: 99 };

function buildDigits(difficulty, rng) {
  const cap = VALUE_CAP[difficulty];
  const maxT = Math.floor(cap / 10);
  const minT = difficulty === 3 ? 2 : 1;
  const t = rng.int(minT, maxT);

  if (difficulty === 1) {
    return [t, rng.int(1, 9)];
  }
  if (difficulty === 3 && rng.int(0, 99) < ZERO_ONES_CHANCE) {
    return [t, 0];
  }
  return [t, rng.int(0, 9)];
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const recipe = {
  skillId: 'g1.place.tens-ones',
  maxDifficulty: 3,

  generate(difficulty, rng) {
    const [t, o] = buildDigits(difficulty, rng);
    const answer = t * 10 + o;

    const candidates = [
      { value: t * 100 + o, tag: 'separate-digit-reading' },
    ];
    if (t !== o && o !== 0) {
      candidates.push({ value: o * 10 + t, tag: 'digit-reversal' });
    }
    if (o !== 0) {
      candidates.push({ value: t + o, tag: 'expanded-addition' });
      candidates.push({ value: t * 10, tag: 'tens-only-counted' });
    } else {
      candidates.push({ value: t, tag: 'tens-only-counted' });
    }

    const distractors = selectDistractors({
      candidates,
      kind: 'place',
      context: { answer },
      count: OPTION_COUNT - 1,
      rng,
    });

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);

    return {
      questionText: `${plural(t, 'ten')} and ${plural(o, 'one')} make ?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
    };
  },
};

export default recipe;
