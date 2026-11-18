/**
 * Recipe: Coins recognition & small coin sums — 1, 2, 5, 10 (Grade 1).
 * Serves g1.money.coins. Format `coins-mcq`.
 *
 * Rung 1 (cap 10): single coin value recognition or 2 identical 1/2/5 coins.
 * Rung 2 (cap 20): summing 2 or 3 coins from {1, 2, 5, 10}.
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md:
 *   - size-value-bias        : confuses 5 and 2 by physical coin size
 *   - coin-count-as-value    : outputs number of coins instead of summing coin values (guard: coins.length !== ans)
 *   - sum-as-concatenation   : concatenates two single-digit coin values (c1*10 + c2)
 *   - off-by-one             : ans ± 1
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;

const recipe = {
  skillId: 'g1.money.coins',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    let coins;
    if (difficulty === 1) {
      const single = rng.int(0, 1) === 0;
      if (single) {
        coins = [rng.pick([1, 2, 5, 10])];
      } else {
        const denom = rng.pick([1, 2, 5]);
        coins = [denom, denom];
      }
    } else {
      const count = rng.int(2, 3);
      if (count === 2) {
        const c1 = rng.pick([2, 5, 10]);
        const c2 = rng.pick([1, 2, 5]);
        coins = [c1, c2];
      } else {
        const c1 = rng.pick([2, 5, 10]);
        const c2 = rng.pick([1, 2, 5]);
        const c3 = rng.pick([1, 2, 5]);
        coins = [c1, c2, c3];
      }
    }

    const answer = coins.reduce((sum, c) => sum + c, 0);
    const candidates = [];

    if (coins.length === 1 && coins[0] === 5) {
      candidates.push({ value: 2, tag: 'size-value-bias' });
    } else if (coins.length === 1 && coins[0] === 2) {
      candidates.push({ value: 5, tag: 'size-value-bias' });
    }

    if (coins.length >= 2 && coins.length !== answer) {
      candidates.push({ value: coins.length, tag: 'coin-count-as-value' });
    }
    if (coins.length === 2 && coins[0] < 10 && coins[1] < 10) {
      candidates.push({ value: coins[0] * 10 + coins[1], tag: 'sum-as-concatenation' });
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
    const labelList = coins.map((c) => `🪙 ${c}`).join(' + ');

    return {
      questionText: coins.length === 1
        ? `What is the value of this 🪙 ${coins[0]} coin?`
        : `Count the coins: ${labelList} = ?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'coins-mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: { coins },
    };
  },
};

export default recipe;
