/**
 * Recipe: money — making amounts & simple change in whole rupees (Grade 2).
 * Serves g2.money.amounts. Format `mcq`.
 *
 * Rung 1 combines whole-rupee notes/coins ("₹20 + ₹15 = ₹?").
 * Rungs 2 and 3 compute change from a round note (₹20..₹50 on rung 2; ₹60..₹100 on rung 3)
 * with a non-zero ones digit in the cost so borrowing across zero is structurally required.
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Money — amounts & change (₹)"):
 *   - smaller-from-larger-force-money : per-column abs subtraction across zero ((tens(a)-tens(b))*10 + ones(b))
 *   - ten-across-zero-borrow          : borrows 10 for ones without reducing the tens column (ans + 10)
 *   - operator-mixup                  : subtracts on addition or adds on change subtraction
 *   - off-by-one                      : ans ± 1
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;

const recipe = {
  skillId: 'g2.money.amounts',
  maxDifficulty: 3,

  generate(difficulty, rng) {
    if (difficulty === 1) {
      const a = rng.pick([10, 15, 20, 25, 30]);
      const b = rng.int(5, 50 - a);
      const answer = a + b;

      const candidates = [];
      if (a !== b) {
        candidates.push({ value: Math.abs(a - b), tag: 'operator-mixup' });
      }
      candidates.push({ value: answer + 1, tag: 'off-by-one' });
      if (answer - 1 >= 0) {
        candidates.push({ value: answer - 1, tag: 'off-by-one' });
      }

      const distractors = selectDistractors({
        candidates,
        kind: 'add',
        context: { a, b, answer },
        count: OPTION_COUNT - 1,
        rng,
      });

      const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);

      return {
        questionText: `₹${a} + ₹${b} = ₹?`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { kind: 'money-add', a, b },
      };
    }

    // Difficulty 2 (cap 50) & Difficulty 3 (cap 100): change from a round note.
    const a = difficulty === 2
      ? rng.pick([20, 30, 40, 50])
      : rng.pick([60, 70, 80, 90, 100]);
    const maxB = a - 6;
    const bTens = rng.int(1, Math.floor(maxB / 10));
    const bOnes = rng.int(1, 9);
    const b = bTens * 10 + bOnes;
    const answer = a - b;

    const forceMoney = (Math.floor(a / 10) - Math.floor(b / 10)) * 10 + (b % 10);
    const tenBorrow = answer + 10;

    const candidates = [
      { value: tenBorrow, tag: 'ten-across-zero-borrow' },
      { value: forceMoney, tag: 'smaller-from-larger-force-money' },
      { value: a + b, tag: 'operator-mixup' },
      { value: answer - 1, tag: 'off-by-one' },
      { value: answer + 1, tag: 'off-by-one' },
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
      questionText: `Have ₹${a}, spend ₹${b}. ₹ left = ?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: { kind: 'money-change', have: a, spend: b },
    };
  },
};

export default recipe;
