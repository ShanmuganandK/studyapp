/**
 * Recipe: basic fractions — halves & quarters (1/2, 1/4, 3/4) (Grade 2).
 * Serves g2.frac.halves-quarters. Format `fraction-mcq` (visual partitioned shape) or `mcq`
 * (half of an even count).
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Fractions — basic halves & quarters (1/2, 1/4, 3/4)"):
 *   - denominator-magnitude-bias : thinks 1/4 > 1/2 because 4 > 2, or swaps 1/2 and 1/4
 *   - shaded-to-unshaded-ratio   : writes shaded/unshaded (1/3 instead of 1/4)
 *   - unshaded-complement-picked : counts unshaded parts instead of shaded parts (3/4 for 1/4)
 *   - double-instead-of-half     : doubles n instead of halving n
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;

const recipe = {
  skillId: 'g2.frac.halves-quarters',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    if (difficulty === 1) {
      const isHalf = rng.int(0, 1) === 0;
      const totalParts = isHalf ? 2 : 4;
      const shadedParts = 1;
      const answer = isHalf ? '1/2' : '1/4';

      const optionPairs = rng.shuffle(
        isHalf
          ? [
              { value: '1/2', tag: null },
              { value: '1/4', tag: 'denominator-magnitude-bias' },
              { value: '1/3', tag: 'shaded-to-unshaded-ratio' },
              { value: '3/4', tag: 'unshaded-complement-picked' },
            ]
          : [
              { value: '1/4', tag: null },
              { value: '1/2', tag: 'denominator-magnitude-bias' },
              { value: '1/3', tag: 'shaded-to-unshaded-ratio' },
              { value: '3/4', tag: 'unshaded-complement-picked' },
            ],
      );

      return {
        questionText: `${shadedParts} of ${totalParts} equal parts is shaded. What fraction is shaded?`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'fraction-mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { totalParts, shadedParts },
      };
    }

    // Difficulty 2: either 3/4 visual fraction OR "What is half of 2n?"
    const askThreeQuarters = rng.int(0, 1) === 0;
    if (askThreeQuarters) {
      const totalParts = 4;
      const shadedParts = 3;
      const answer = '3/4';

      const optionPairs = rng.shuffle([
        { value: '3/4', tag: null },
        { value: '1/4', tag: 'unshaded-complement-picked' },
        { value: '1/2', tag: 'denominator-magnitude-bias' },
        { value: '1/3', tag: 'shaded-to-unshaded-ratio' },
      ]);

      return {
        questionText: `${shadedParts} of ${totalParts} equal parts are shaded. What fraction is shaded?`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'fraction-mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { totalParts, shadedParts },
      };
    }

    // Numeric half of an even collection (2n in 4..12)
    const half = rng.int(2, 6);
    const total = half * 2;
    const candidates = [
      { value: total * 2, tag: 'double-instead-of-half' },
      { value: half + 1, tag: 'random-slip' },
      { value: half - 1, tag: 'random-slip' },
    ];

    const distractors = selectDistractors({
      candidates,
      kind: 'place',
      context: { answer: half },
      count: OPTION_COUNT - 1,
      rng,
    });

    const optionPairs = rng.shuffle([{ value: half, tag: null }, ...distractors]);
    return {
      questionText: `What is half (1/2) of ${total}?`,
      correctAnswer: half,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: { kind: 'half-collection', total },
    };
  },
};

export default recipe;
