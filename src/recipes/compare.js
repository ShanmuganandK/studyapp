/**
 * Recipe: pre-number comparison — big/small, more/less, tall/short (Grade 1).
 * Serves g1.prenum.compare (`recipe: 'compare'`). Format `mcq` with `render` group tray.
 *
 * Compares two labelled groups (Box A vs Box B) and asks which group has MORE or FEWER items
 * (with contrasting physical glyph sizes on rung 2 to test Piaget quantity-size conservation).
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Pre-number — big/small, more/less, tall/short"):
 *   - opposite-attribute-confusion : picks the smaller count when asked for MORE, or larger when asked for FEWER
 *   - quantity-size-illusion       : picks the count of larger-looking objects when asked for MORE
 *   - off-by-one                   : ans ± 1
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;
const PAIRS = [
  { smallGlyph: '🐜', bigGlyph: '🐘' },
  { smallGlyph: '🍓', bigGlyph: '🍉' },
  { smallGlyph: '🐝', bigGlyph: '🐻' },
  { smallGlyph: '🍒', bigGlyph: '🍍' },
];

const recipe = {
  skillId: 'g1.prenum.compare',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    const pair = rng.pick(PAIRS);
    const askMore = difficulty === 1 ? true : rng.int(0, 1) === 1;

    let countA;
    let countB;
    if (difficulty === 1) {
      countA = rng.int(2, 4);
      countB = countA + rng.int(2, 4);
      if (rng.int(0, 1) === 1) [countA, countB] = [countB, countA];
    } else {
      // Rung 2: small count of big objects vs larger count of small objects (diff 1..2)
      const smaller = rng.int(3, 6);
      const larger = smaller + rng.int(1, 2);
      // Put the bigger glyph on the smaller count so size-illusion points to `smaller`
      countA = smaller;
      countB = larger;
    }

    const answer = askMore ? Math.max(countA, countB) : Math.min(countA, countB);
    const other = askMore ? Math.min(countA, countB) : Math.max(countA, countB);

    const candidates = [];
    if (difficulty === 2 && askMore) {
      candidates.push({ value: other, tag: 'quantity-size-illusion' });
    } else {
      candidates.push({ value: other, tag: 'opposite-attribute-confusion' });
    }
    candidates.push({ value: answer + 1, tag: 'off-by-one' });
    if (answer > 1) {
      candidates.push({ value: answer - 1, tag: 'off-by-one' });
    }

    const distractors = selectDistractors({
      candidates,
      kind: 'place',
      context: { answer },
      count: OPTION_COUNT - 1,
      rng,
    });

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
    const word = askMore ? 'MORE' : 'FEWER';

    return {
      questionText: `Group A has ${countA} ${pair.bigGlyph}. Group B has ${countB} ${pair.smallGlyph}. How many are in the group with ${word}?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: {
        kind: 'group-compare',
        countA,
        glyphA: pair.bigGlyph,
        countB,
        glyphB: pair.smallGlyph,
        word,
      },
    };
  },
};

export default recipe;
