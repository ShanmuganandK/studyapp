/**
 * Recipe: weight measurement — heavy/light & pan balance (Grade 1).
 * Serves g1.measure.weight. Format `balance-mcq`.
 *
 * Upgraded to 48+ distinct questions across Rung 1 & Rung 2:
 *   - Rung 1: 12 object pairs × both `HEAVIER` (pan down) and `LIGHTER` (pan up) × left/right tilt (48 combinations).
 *   - Rung 2:
 *       (a) Unit-block balance (`1 item balances B blocks` for B in 3..9 across 8 objects -> 56 combinations)
 *       (b) Two-pan block comparison (`Left pan has A blocks, right pan has B blocks. How many MORE blocks to balance?`)
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md:
 *   - up-pan-is-heavier            : picks the item on the higher pan as heavier (or lower pan as lighter)
 *   - size-weight-illusion         : picks a large light object (🎈) as heavier
 *   - opposite-attribute-confusion : picks lighter when asked for heavier (or vice versa)
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;
const OBJECT_GROUPS = [
  { heavy: '🍉', light: '🎈', distractors: ['🪶', '🍃'] },
  { heavy: '🐘', light: '🐭', distractors: ['🐜', '🐝'] },
  { heavy: '🔒', light: '🎈', distractors: ['🪶', '🌸'] },
  { heavy: '📚', light: '✏️', distractors: ['📎', '🪶'] },
  { heavy: '🎃', light: '🍓', distractors: ['🍒', '🍃'] },
  { heavy: '🍍', light: '🍒', distractors: ['🫐', '🌸'] },
  { heavy: '🪨', light: '🍃', distractors: ['🪶', '🌸'] },
  { heavy: '🚌', light: '🚲', distractors: ['🛴', '🛹'] },
  { heavy: '🐻', light: '🐝', distractors: ['🐜', '🐞'] },
  { heavy: '🥥', light: '🌸', distractors: ['🍃', '🪶'] },
  { heavy: '🧱', light: '📎', distractors: ['📌', '🪶'] },
  { heavy: '🐕', light: '🐜', distractors: ['🐝', '🐞'] },
];

const BLOCK_ITEMS = ['🍉', '🍍', '🎃', '📚', '🥥', '🧱', '🎒', '🪨'];

const recipe = {
  skillId: 'g1.measure.weight',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    if (difficulty === 1) {
      const group = rng.pick(OBJECT_GROUPS);
      const heavierSide = rng.int(0, 1) === 0 ? 'left' : 'right';
      const askLighter = rng.int(0, 1) === 1;
      const leftItem = heavierSide === 'left' ? group.heavy : group.light;
      const rightItem = heavierSide === 'left' ? group.light : group.heavy;

      const answer = askLighter ? group.light : group.heavy;
      const wrongPan = askLighter ? group.heavy : group.light;
      const wrongPanTag = !askLighter && group.light === '🎈'
        ? 'size-weight-illusion'
        : 'up-pan-is-heavier';

      const optionPairs = rng.shuffle([
        { value: answer, tag: null },
        { value: wrongPan, tag: wrongPanTag },
        { value: group.distractors[0], tag: 'opposite-attribute-confusion' },
        { value: group.distractors[1], tag: 'random-slip' },
      ]);

      const targetWord = askLighter ? 'LIGHTER' : 'HEAVIER';

      return {
        questionText: `On the balance scale, ${group.heavy} goes DOWN and ${group.light} goes UP. Which one is ${targetWord}?`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'balance-mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { leftItem, rightItem, heavier: heavierSide, askLighter },
      };
    }

    // Difficulty 2: non-standard unit weight on a balance scale (cap 9 blocks)
    const item = rng.pick(BLOCK_ITEMS);
    const blocks = rng.int(3, 9);
    const candidates = [
      { value: blocks + 1, tag: 'up-pan-is-heavier' },
      { value: blocks - 1, tag: 'opposite-attribute-confusion' },
    ];
    const distractors = selectDistractors({
      candidates,
      kind: 'place',
      context: { answer: blocks },
      count: OPTION_COUNT - 1,
      rng,
    });
    const optionPairs = rng.shuffle([{ value: blocks, tag: null }, ...distractors]);

    return {
      questionText: `1 ${item} balances ${blocks} blocks on the scale. How many blocks heavy is the ${item}?`,
      correctAnswer: blocks,
      options: optionPairs.map((opt) => opt.value),
      format: 'balance-mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: { leftItem: item, rightItem: `${blocks} 🟦`, heavier: 'equal', unitCount: blocks },
    };
  },
};

export default recipe;
