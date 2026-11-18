/**
 * Recipe: length measurement (Grade 1 non-standard units & Grade 2 standard cm/m).
 * Multi-skill module serving `g1.measure.length` and `g2.measure.length-std`.
 *
 * Upgraded for 8-question session variety and Grade 1 / Grade 2 difficulty parity:
 *   - `g1.measure.length`:
 *       Rung 1 (cap 8): 8 distinct everyday objects measured in 3..8 unit blocks (48 combinations)
 *       Rung 2 (cap 14): comparing two block-measured lengths (difference `a - b` or combined `a + b`)
 *   - `g2.measure.length-std`:
 *       Rung 1 (cap 25): offset ruler reading (`Starts at s cm, ends at e cm`) or 2-digit cm addition (`a cm + b cm`)
 *       Rung 2 (cap 50): offset ruler up to 30 cm or 2-digit length subtraction (`a cm - b cm`)
 *       Rung 3 (cap 99): 2-digit standard length addition & subtraction (`cm` and `m`) up to 99
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;

const G1_OBJECTS = [
  { glyph: '✏️', name: 'pencil' },
  { glyph: '🖍️', name: 'crayon' },
  { glyph: '🪥', name: 'toothbrush' },
  { glyph: '🥄', name: 'spoon' },
  { glyph: '🔑', name: 'key' },
  { glyph: '🥕', name: 'carrot' },
  { glyph: '🐛', name: 'caterpillar' },
  { glyph: '🥖', name: 'breadstick' },
];

const recipe = {
  skillIds: ['g1.measure.length', 'g2.measure.length-std'],
  maxDifficulty: 3,

  generate(difficulty, rng, skillId = 'g2.measure.length-std') {
    if (skillId === 'g1.measure.length') {
      const d = Math.min(difficulty, 2);
      if (d === 1) {
        const obj = rng.pick(G1_OBJECTS);
        const count = rng.int(3, 8);
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
          questionText: `How many blocks long is the ${obj.name}?`,
          correctAnswer: count,
          options: optionPairs.map((opt) => opt.value),
          format: 'unit-length',
          misconceptions: optionPairs.map((opt) => opt.tag),
          render: { objectGlyph: obj.glyph, objectName: obj.name, unitGlyph: '🟦', count },
        };
      }

      // G1 Rung 2: compare two lengths in blocks (cap 12 on the larger length a)
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
      // Mix offset ruler reading (start 1..6 cm, length 4..18 cm) and simple cm addition (sum <= 25)
      if (rng.int(0, 1) === 0) {
        const start = rng.int(1, 6);
        const length = rng.int(4, 24 - start);
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

      const a = rng.int(6, 15);
      const b = rng.int(4, 25 - a);
      const answer = a + b;
      const candidates = [];
      if (a !== b) candidates.push({ value: Math.abs(a - b), tag: 'operator-mixup' });
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
        questionText: `${a} cm + ${b} cm = ? cm`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { kind: 'length-add', a, b, unit: 'cm' },
      };
    }

    if (difficulty === 2) {
      const start = rng.int(2, 12);
      const length = rng.int(6, 30 - start);
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
    const a = rng.int(15, 65);
    const b = rng.int(11, 99 - a);
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
