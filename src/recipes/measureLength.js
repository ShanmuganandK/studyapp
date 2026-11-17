/**
 * Recipe: length measurement (Grade 1 non-standard units & Grade 2 standard cm/m).
 * Multi-skill module serving `g1.measure.length` and `g2.measure.length-std`.
 *
 * For `g2.measure.length-std` (format `mcq`):
 *   - Rung 1 (cap 15): zero-aligned ruler reading ("Starts at 0 cm, ends at L cm. Length = ? cm")
 *   - Rung 2 (cap 30): offset ruler reading ("Starts at s cm, ends at e cm. Length = ? cm" -> e - s)
 *   - Rung 3 (cap 99): adding standard lengths ("a cm + b cm = ? cm")
 *
 * For `g1.measure.length` (format `unit-length` on Rung 1, `mcq` on Rung 2):
 *   - Rung 1 (cap 5): object lined up with L unit blocks (`render: { objectGlyph, unitGlyph, count: L }`)
 *   - Rung 2 (cap 9): comparing two block-measured lengths ("Pencil A is a blocks, Pencil B is b blocks. How many blocks longer is A?")
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;

const recipe = {
  skillIds: ['g1.measure.length', 'g2.measure.length-std'],
  maxDifficulty: 3,

  generate(difficulty, rng, skillId = 'g2.measure.length-std') {
    if (skillId === 'g1.measure.length') {
      const d = Math.min(difficulty, 2);
      if (d === 1) {
        const count = rng.int(2, 5);
        const candidates = [
          { value: count + 1, tag: 'count-marks-not-units' },
          { value: count - 1, tag: 'skip-count-sequence' },
        ];
        const distractors = selectDistractors({
          candidates,
          kind: 'place',
          context: { answer: count },
          count: OPTION_COUNT - 1,
          rng,
        });
        const optionPairs = rng.shuffle([{ value: count, tag: null }, ...distractors]);
        return {
          questionText: 'How many blocks long is the pencil?',
          correctAnswer: count,
          options: optionPairs.map((opt) => opt.value),
          format: 'unit-length',
          misconceptions: optionPairs.map((opt) => opt.tag),
          render: { objectGlyph: '✏️', unitGlyph: '🟦', count },
        };
      }

      // G1 Rung 2: compare two lengths in blocks (cap 9 on the larger length a)
      const a = rng.int(5, 9);
      const b = rng.int(2, a - 1);
      const answer = a - b;
      const candidates = [
        { value: a + b, tag: 'operator-mixup' },
        { value: answer + 1, tag: 'count-marks-not-units' },
        { value: answer - 1, tag: 'skip-count-sequence' },
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
        questionText: `Ribbon A is ${a} blocks long. Ribbon B is ${b} blocks long. How many blocks longer is A?`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { kind: 'ribbon-compare', a, b },
      };
    }

    // ── g2.measure.length-std ──────────────────────────────────────────────────
    if (difficulty === 1) {
      const length = rng.int(2, 15);
      const candidates = [
        { value: length + 1, tag: 'ruler-one-start-error' },
        { value: length - 1, tag: 'off-by-one' },
      ];
      const distractors = selectDistractors({
        candidates,
        kind: 'place',
        context: { answer: length },
        count: OPTION_COUNT - 1,
        rng,
      });
      const optionPairs = rng.shuffle([{ value: length, tag: null }, ...distractors]);
      return {
        questionText: `Starts at 0 cm, ends at ${length} cm. Length = ? cm`,
        correctAnswer: length,
        options: optionPairs.map((opt) => opt.value),
        format: 'mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { kind: 'ruler-cm', start: 0, end: length },
      };
    }

    if (difficulty === 2) {
      const start = rng.int(1, 8);
      const length = rng.int(3, 30 - start);
      const end = start + length;
      const candidates = [
        { value: end, tag: 'end-mark-only-read' },
        { value: length + 1, tag: 'ruler-one-start-error' },
        { value: end + start, tag: 'operator-mixup' },
        { value: length - 1, tag: 'off-by-one' },
      ];
      const distractors = selectDistractors({
        candidates,
        kind: 'sub',
        context: { a: end, b: start, answer: length },
        count: OPTION_COUNT - 1,
        rng,
      });
      const optionPairs = rng.shuffle([{ value: length, tag: null }, ...distractors]);
      return {
        questionText: `Starts at ${start} cm, ends at ${end} cm. Length = ? cm`,
        correctAnswer: length,
        options: optionPairs.map((opt) => opt.value),
        format: 'mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { kind: 'ruler-cm', start, end },
      };
    }

    // Difficulty 3: adding standard lengths (cap 99)
    const unit = rng.int(0, 1) === 0 ? 'cm' : 'm';
    const a = rng.int(12, 65);
    const b = rng.int(8, 99 - a);
    const answer = a + b;
    const candidates = [];
    if (a !== b) {
      candidates.push({ value: Math.abs(a - b), tag: 'operator-mixup' });
    }
    candidates.push({ value: answer + 1, tag: 'ruler-one-start-error' });
    candidates.push({ value: answer - 1, tag: 'off-by-one' });

    const distractors = selectDistractors({
      candidates,
      kind: 'add',
      context: { a, b, answer },
      count: OPTION_COUNT - 1,
      rng,
    });
    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
    return {
      questionText: `${a} ${unit} + ${b} ${unit} = ? ${unit}`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: { kind: 'length-add', a, b, unit },
    };
  },
};

export default recipe;
