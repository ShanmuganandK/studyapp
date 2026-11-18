/**
 * Recipe: data handling — scaled pictographs & comparisons (Grade 2).
 * Serves g2.data.pictograph. Format `pictograph`.
 *
 * Upgraded for Grade 2 cognitive parity & 8-question session variety (6 themes × 3 modes):
 *   Rung 1:
 *     - Scale = 2 direct row reading ("Each picture stands for 2. How many Apples are there?")
 *     - Scale = 1 comparison ("How many MORE Apples than Bananas?")
 *     - Scale = 1 two-row total ("How many Apples and Bananas are there ALTOGETHER?")
 *   Rung 2:
 *     - Scale = 2 or 5 direct reading (up to 30)
 *     - Scale = 2 or 5 comparison ("Each picture stands for 2. How many MORE Dogs than Cats?")
 *     - Scale = 2 two-row total ("Each picture stands for 2. How many Dogs and Cats ALTOGETHER?")
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md:
 *   - adjacent-row-read           : reads the count of a different row in the table
 *   - total-instead-of-difference : adds two rows when asked "How many MORE A than B?" (or subtracts on ALTOGETHER)
 *   - scale-factor-ignored        : counts raw symbols instead of multiplying by scale (when scale > 1)
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
  [
    { label: 'Balls', glyph: '⚽' },
    { label: 'Kites', glyph: '🪁' },
    { label: 'Drums', glyph: '🥁' },
  ],
  [
    { label: 'Cupcakes', glyph: '🧁' },
    { label: 'Cookies', glyph: '🍪' },
    { label: 'Donuts', glyph: '🍩' },
  ],
  [
    { label: 'Roses', glyph: '🌹' },
    { label: 'Sunflowers', glyph: '🌻' },
    { label: 'Tulips', glyph: '🌷' },
  ],
];

const recipe = {
  skillId: 'g2.data.pictograph',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    const theme = rng.pick(ROW_THEMES);
    const counts = rng.shuffle([2, 3, 4, 5, 6]).slice(0, 3);
    const rows = theme.map((t, i) => ({ ...t, count: counts[i] }));
    const mode = rng.pick(['scaled-read', 'more', 'altogether']);

    if (difficulty === 1) {
      if (mode === 'scaled-read') {
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

      if (mode === 'altogether') {
        const [rowA, rowB, rowC] = rows;
        const answer = rowA.count + rowB.count;
        const candidates = [
          { value: Math.abs(rowA.count - rowB.count), tag: 'total-instead-of-difference' },
          { value: rowA.count + rowC.count, tag: 'adjacent-row-read' },
          { value: answer + 1, tag: 'off-by-one' },
          { value: answer - 1, tag: 'off-by-one' },
        ];
        const distractors = selectDistractors({
          candidates,
          kind: 'add',
          context: { a: rowA.count, b: rowB.count, answer },
          count: OPTION_COUNT - 1,
          rng,
        });
        const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
        return {
          questionText: `How many ${rowA.label} and ${rowB.label} are there ALTOGETHER?`,
          correctAnswer: answer,
          options: optionPairs.map((opt) => opt.value),
          format: 'pictograph',
          misconceptions: optionPairs.map((opt) => opt.tag),
          render: { rows, scale: 1 },
        };
      }

      // Rung 1 'more' (scale = 1)
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
    }

    // ── Difficulty 2: Scaled (scale = 2 or 5) reading, comparison, or total ────
    const scale = rng.pick([2, 5]);
    if (mode === 'scaled-read') {
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
        questionText: `Each picture stands for ${scale}. How many ${targetRow.label} are there?`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'pictograph',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { rows, scale },
      };
    }

    if (mode === 'altogether') {
      const [rowA, rowB, rowC] = rows;
      const answer = (rowA.count + rowB.count) * 2;
      const candidates = [
        { value: rowA.count + rowB.count, tag: 'scale-factor-ignored' },
        { value: Math.abs(rowA.count - rowB.count) * 2, tag: 'total-instead-of-difference' },
        { value: (rowA.count + rowC.count) * 2, tag: 'adjacent-row-read' },
        { value: answer + 2, tag: 'off-by-one' },
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
        questionText: `Each picture stands for 2. How many ${rowA.label} and ${rowB.label} are there ALTOGETHER?`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'pictograph',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { rows, scale: 2 },
      };
    }

    // Scaled comparison ('more' with scale = 2 or 5)
    const sorted = [...rows].sort((a, b) => b.count - a.count);
    const rowHi = sorted[0];
    const rowLo = sorted[2];
    const rawDiff = rowHi.count - rowLo.count;
    const answer = rawDiff * scale;

    const candidates = [
      { value: rawDiff, tag: 'scale-factor-ignored' },
      { value: (rowHi.count + rowLo.count) * scale, tag: 'total-instead-of-difference' },
      { value: sorted[1].count * scale, tag: 'adjacent-row-read' },
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
      questionText: `Each picture stands for ${scale}. How many MORE ${rowHi.label} than ${rowLo.label}?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'pictograph',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: { rows, scale },
    };
  },
};

export default recipe;
