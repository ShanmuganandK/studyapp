/**
 * Recipe: data handling — simple pictographs (Grade 2).
 * Serves g2.data.pictograph. Format `pictograph`.
 *
 * Rung 1 (scale 1:1): direct row reading ("How many Apples are in the chart?").
 * Rung 2 (scale 1:2 or comparison): scaled reading ("Each picture = 2. How many Apples?") or
 * difference ("How many MORE Apples than Bananas?").
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Data handling — simple pictographs"):
 *   - adjacent-row-read           : reads the count of a different row in the table
 *   - total-instead-of-difference : adds two rows when asked "How many MORE A than B?"
 *   - scale-factor-ignored        : counts raw symbols instead of multiplying by scale (when scale === 2)
 *   - off-by-one                  : ans ± 1
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;
const ROW_THEMES = [
  [
    { label: 'Apples', glyph: '🍎' },
    { label: 'Bananas', glyph: '🍌' },
    { label: 'Grapes', glyph: '🍇' },
  ],
  [
    { label: 'Dogs', glyph: '🐶' },
    { label: 'Cats', glyph: '🐱' },
    { label: 'Rabbits', glyph: '🐰' },
  ],
  [
    { label: 'Buses', glyph: '🚌' },
    { label: 'Bikes', glyph: '🚲' },
    { label: 'Trains', glyph: '🚂' },
  ],
];

const recipe = {
  skillId: 'g2.data.pictograph',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    const theme = rng.pick(ROW_THEMES);
    const counts = rng.shuffle([2, 3, 4, 5, 6]).slice(0, 3);
    const rows = theme.map((t, i) => ({ ...t, count: counts[i] }));

    if (difficulty === 1) {
      const targetIdx = rng.int(0, 2);
      const targetRow = rows[targetIdx];
      const answer = targetRow.count;

      const candidates = rows
        .filter((_, i) => i !== targetIdx)
        .map((r) => ({ value: r.count, tag: 'adjacent-row-read' }));
      candidates.push({ value: answer + 1, tag: 'off-by-one' });
      candidates.push({ value: answer - 1, tag: 'off-by-one' });

      const distractors = selectDistractors({
        candidates,
        kind: 'place',
        context: { answer },
        count: OPTION_COUNT - 1,
        rng,
      });

      const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
      return {
        questionText: `How many ${targetRow.label} are in the chart?`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'pictograph',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { rows, scale: 1 },
      };
    }

    // Difficulty 2: either scale = 2 direct read, or scale = 1 "How many MORE A than B?"
    const useScale2 = rng.int(0, 1) === 0;
    if (useScale2) {
      const scale = 2;
      const targetIdx = rng.int(0, 2);
      const targetRow = rows[targetIdx];
      const answer = targetRow.count * scale;

      const candidates = [
        { value: targetRow.count, tag: 'scale-factor-ignored' },
        ...rows
          .filter((_, i) => i !== targetIdx)
          .map((r) => ({ value: r.count * scale, tag: 'adjacent-row-read' })),
        { value: answer + 1, tag: 'off-by-one' },
      ];

      const distractors = selectDistractors({
        candidates,
        kind: 'place',
        context: { answer },
        count: OPTION_COUNT - 1,
        rng,
      });

      const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
      return {
        questionText: `Each picture stands for 2. How many ${targetRow.label} are there?`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'pictograph',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { rows, scale },
      };
    }

    // Comparison: sort rows by count descending so rowHi > rowLo
    const sorted = [...rows].sort((a, b) => b.count - a.count);
    const rowHi = sorted[0];
    const rowLo = sorted[2];
    const answer = rowHi.count - rowLo.count;

    const candidates = [
      { value: rowHi.count + rowLo.count, tag: 'total-instead-of-difference' },
      { value: sorted[1].count, tag: 'adjacent-row-read' },
      { value: answer + 1, tag: 'off-by-one' },
    ];

    const distractors = selectDistractors({
      candidates,
      kind: 'sub',
      context: { a: rowHi.count, b: rowLo.count, answer },
      count: OPTION_COUNT - 1,
      rng,
    });

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
    return {
      questionText: `How many MORE ${rowHi.label} than ${rowLo.label}?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'pictograph',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: { rows, scale: 1 },
    };
  },
};

export default recipe;
