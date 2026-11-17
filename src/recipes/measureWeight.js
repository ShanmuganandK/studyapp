/**
 * Recipe: weight measurement — heavy/light & pan balance (Grade 1).
 * Serves g1.measure.weight. Format `balance-mcq` (pan balance comparison) or `mcq` (unit-block weight).
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Measurement — weight (heavy/light)"):
 *   - up-pan-is-heavier            : picks the item on the higher pan as heavier
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
];

const recipe = {
  skillId: 'g1.measure.weight',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    if (difficulty === 1) {
      const group = rng.pick(OBJECT_GROUPS);
      const heavierSide = rng.int(0, 1) === 0 ? 'left' : 'right';
      const leftItem = heavierSide === 'left' ? group.heavy : group.light;
      const rightItem = heavierSide === 'left' ? group.light : group.heavy;

      const lightTag = group.light === '🎈' ? 'size-weight-illusion' : 'up-pan-is-heavier';
      const optionPairs = rng.shuffle([
        { value: group.heavy, tag: null },
        { value: group.light, tag: lightTag },
        { value: group.distractors[0], tag: 'opposite-attribute-confusion' },
        { value: group.distractors[1], tag: 'random-slip' },
      ]);

      return {
        questionText: `On the balance scale, the ${group.heavy} side goes DOWN and the ${group.light} side goes UP. Which one is HEAVIER?`,
        correctAnswer: group.heavy,
        options: optionPairs.map((opt) => opt.value),
        format: 'balance-mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { leftItem, rightItem, heavier: heavierSide },
      };
    }

    // Difficulty 2: non-standard unit weight on a balance scale (cap 9 blocks)
    const item = rng.pick(['🍉', '🍍', '🎃', '📚']);
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
