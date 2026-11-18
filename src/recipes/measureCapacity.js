/**
 * Recipe: capacity in litres — jugs, mugs, buckets & tanks (Grade 2).
 * Serves g2.measure.capacity. Format `mcq`.
 *
 * Upgraded for Grade 2 difficulty parity & 8-question session variety:
 *   - Rung 1 (cap 30 L):
 *       (a) Equal containers multiplication (`1 jug/bucket/pot/bottle holds k litres. How many litres in m ...?` with k in 2..6, m in 2..5)
 *       (b) Combining two containers (`Jug A holds a L and Jug B holds b L. Total = ? L`)
 *   - Rung 2 (cap 60 L):
 *       2-digit tank difference (`Tank A holds a L. Tank B holds b L. How many more litres in Tank A?`)
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;
const CONTAINERS = ['jug', 'bucket', 'watering can', 'water pot'];

const recipe = {
  skillId: 'g2.measure.capacity',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    if (difficulty === 1) {
      const container = rng.pick(CONTAINERS);
      const k = rng.int(2, 6);
      const m = rng.int(2, 5);
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
        questionText: `1 ${container} holds ${k} litres. How many litres in ${m} ${container}s?`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { kind: 'capacity-jugs', perJug: k, jugs: m, container },
      };
    }

    // Difficulty 2: comparing capacities (cap 60 L on the larger tank a)
    const a = rng.int(22, 60);
    const b = rng.int(8, a - 5);
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
