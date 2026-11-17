/**
 * Recipe: hundreds, tens, ones — expanded form to 999 (Grade 2). Serves g2.place.hundreds.
 * Format `mcq`.
 *
 * Distinct from g2.num.3digit (which uses word-place decomposition "H hundreds, T tens and O ones"):
 * this recipe uses expanded-form addition ("300 + 40 + 5 = ?" and zero-column cases like
 * "300 + 8 = ?"), so `correctAnswer` is independently re-derivable by summing the numbers in the
 * prompt.
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Place value — hundreds, tens, ones (expanded form)"):
 *   - zero-placeholder-ignored : drops a zero tens column (300 + 8 -> 38; condition: t === 0 && o > 0)
 *   - digit-value-blindness    : sums the leading face digits (h + t + o, e.g. 300 + 40 + 5 -> 12)
 *   - reverse-period-reading   : reverses hundreds and ones (o*100 + t*10 + h; guard: h !== o && o > 0)
 *   - place-column-shift       : swaps tens and ones columns (h*100 + o*10 + t; guard: t !== o)
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;
const ZERO_COL_CHANCE = { 1: 0, 2: 40, 3: 50 };

// Curriculum ceiling per rung.
const VALUE_CAP = { 1: 299, 2: 599, 3: 999 };

function buildDigits(difficulty, rng) {
  const cap = VALUE_CAP[difficulty];
  const maxH = Math.floor(cap / 100);
  const minH = difficulty === 3 ? 2 : 1;
  const h = rng.int(minH, maxH);

  const zeroChance = ZERO_COL_CHANCE[difficulty];
  if (zeroChance > 0 && rng.int(0, 99) < zeroChance) {
    return [h, 0, rng.int(1, 9)];
  }
  return [h, rng.int(1, 9), rng.int(1, 9)];
}

const recipe = {
  skillId: 'g2.place.hundreds',
  maxDifficulty: 3,

  generate(difficulty, rng) {
    const [h, t, o] = buildDigits(difficulty, rng);
    const answer = h * 100 + t * 10 + o;

    const candidates = [];
    if (t === 0 && o > 0) {
      candidates.push({ value: h * 10 + o, tag: 'zero-placeholder-ignored' });
    }
    if (t !== o) {
      candidates.push({ value: h * 100 + o * 10 + t, tag: 'place-column-shift' });
    }
    if (h !== o && o > 0) {
      candidates.push({ value: o * 100 + t * 10 + h, tag: 'reverse-period-reading' });
    }
    candidates.push({ value: h + t + o, tag: 'digit-value-blindness' });

    const distractors = selectDistractors({
      candidates,
      kind: 'place',
      context: { answer },
      count: OPTION_COUNT - 1,
      rng,
    });

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);

    const terms = [h * 100];
    if (t > 0) terms.push(t * 10);
    if (o > 0) terms.push(o);

    return {
      questionText: `${terms.join(' + ')} = ?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
    };
  },
};

export default recipe;
