/**
 * Recipe: capacity in litres — jugs, mugs & buckets (Grade 2).
 * Serves g2.measure.capacity. Format `mcq`.
 *
 * Rung 1 (cap 20 L): filling m jugs of k litres each ("1 jug holds k litres. How many litres in m jugs?")
 * Rung 2 (cap 50 L): comparing two tanks/buckets in litres ("Tank A holds a L. Tank B holds b L. How many more litres in Tank A?")
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Measurement — capacity (litres)"):
 *   - container-count-confusion : outputs m or k + m instead of k * m
 *   - operator-mixup            : adds on difference prompt or subtracts on total prompt
 *   - off-by-one                : ans ± 1
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;

const recipe = {
  skillId: 'g2.measure.capacity',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    if (difficulty === 1) {
      const k = rng.int(2, 5);
      const m = rng.int(2, 4);
      const answer = k * m;

      const candidates = [
        { value: k + m, tag: 'container-count-confusion' },
        { value: m, tag: 'container-count-confusion' },
        { value: answer + 1, tag: 'off-by-one' },
        { value: answer - 1, tag: 'off-by-one' },
      ];

      const distractors = selectDistractors({
        candidates,
        kind: 'mul',
        context: { a: k, b: m, answer },
        count: OPTION_COUNT - 1,
        rng,
      });

      const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
      return {
        questionText: `1 jug holds ${k} litres. How many litres in ${m} jugs?`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { kind: 'capacity-jugs', perJug: k, jugs: m },
      };
    }

    // Difficulty 2: comparing capacities (cap 50 L on the larger tank a)
    const a = rng.int(15, 50);
    const b = rng.int(5, a - 3);
    const answer = a - b;

    const candidates = [
      { value: a + b, tag: 'operator-mixup' },
      { value: answer + 1, tag: 'off-by-one' },
      { value: answer - 1, tag: 'off-by-one' },
    ];

    const distractors = selectDistractors({
      candidates,
      kind: 'sub',
      context: { a, b, answer },
      count: OPTION_COUNT - 1,
      rng,
    });

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
    return {
      questionText: `Tank A holds ${a} L. Tank B holds ${b} L. How many more litres in Tank A?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: { kind: 'capacity-tanks', tankA: a, tankB: b },
    };
  },
};

export default recipe;
