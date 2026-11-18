/**
 * Recipe: 2D shapes — circle, triangle, square, rectangle & pentagon (Grade 1).
 * Serves g1.shapes.2d. Format `shape-mcq`.
 *
 * Upgraded to 40+ distinct questions across 4 modes so an 8-question session never repeats:
 *   Mode 1 (`identify`): Visual shape recognition across 5 shapes + 4 contexts/styles (upright or tilted).
 *   Mode 2 (`count-props`): Counting straight sides or corners (`0, 3, 4, 5`).
 *   Mode 3 (`by-property`): "Which shape has 3 corners / 0 straight sides / 4 equal sides / 5 corners?"
 *   Mode 4 (`real-object`): "A pizza slice / coin / door / chessboard / house roof looks like which 2D shape?"
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md:
 *   - rotation-blindness         : fails on a tilted square/triangle/pentagon
 *   - square-rectangle-confusion : confuses square and rectangle (both have 4 sides/corners)
 *   - side-corner-count-slip     : sides ± 1
 *   - curved-straight-mixup      : answers 1 straight side for a circle instead of 0
 */

const CORE_SHAPES = ['Circle', 'Square', 'Triangle', 'Rectangle'];
const ALL_SHAPES = ['Circle', 'Triangle', 'Square', 'Rectangle', 'Pentagon'];
const SIDES = { Circle: 0, Triangle: 3, Square: 4, Rectangle: 4, Pentagon: 5 };

const SHAPE_STYLES = ['classic', 'bold', 'badge', 'tile'];

const PROPERTY_CLUES = [
  { clue: '0 corners and 1 curved edge', answer: 'Circle', shape: 'circle', pool: CORE_SHAPES },
  { clue: '0 straight sides', answer: 'Circle', shape: 'circle', pool: CORE_SHAPES },
  { clue: '3 straight sides', answer: 'Triangle', shape: 'triangle', pool: CORE_SHAPES },
  { clue: '3 corners', answer: 'Triangle', shape: 'triangle', pool: CORE_SHAPES },
  { clue: '4 equal straight sides', answer: 'Square', shape: 'square', pool: CORE_SHAPES },
  { clue: '2 long sides and 2 short sides', answer: 'Rectangle', shape: 'rectangle', pool: CORE_SHAPES },
  { clue: '5 straight sides', answer: 'Pentagon', shape: 'pentagon', pool: ['Pentagon', 'Square', 'Triangle', 'Circle'] },
  { clue: '5 corners', answer: 'Pentagon', shape: 'pentagon', pool: ['Pentagon', 'Rectangle', 'Triangle', 'Square'] },
];

const REAL_OBJECTS = [
  { item: '🍕 pizza slice', answer: 'Triangle', shape: 'triangle' },
  { item: '🥪 half sandwich', answer: 'Triangle', shape: 'triangle' },
  { item: '🪙 round coin', answer: 'Circle', shape: 'circle' },
  { item: '🛞 bicycle wheel', answer: 'Circle', shape: 'circle' },
  { item: '🍪 round cookie', answer: 'Circle', shape: 'circle' },
  { item: '🚪 tall door', answer: 'Rectangle', shape: 'rectangle' },
  { item: '📱 phone screen', answer: 'Rectangle', shape: 'rectangle' },
  { item: '📏 long ruler', answer: 'Rectangle', shape: 'rectangle' },
  { item: '🎲 square game tile', answer: 'Square', shape: 'square' },
  { item: '🖼️ square window pane', answer: 'Square', shape: 'square' },
];

function buildShapeDistractors(target, pool, rotated) {
  return pool
    .filter((s) => s !== target)
    .slice(0, 3)
    .map((s) => {
      if (rotated && (target === 'Square' || target === 'Triangle')) {
        return { value: s, tag: 'rotation-blindness' };
      }
      if ((target === 'Square' && s === 'Rectangle') || (target === 'Rectangle' && s === 'Square')) {
        return { value: s, tag: 'square-rectangle-confusion' };
      }
      return { value: s, tag: 'random-slip' };
    });
}

const recipe = {
  skillId: 'g1.shapes.2d',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    const modeRoll = rng.int(0, 99);

    // ── Mode 1: Visual shape recognition (30%) ───────────────────────────────
    if (modeRoll < 30) {
      const shapesPool = difficulty === 2 ? ALL_SHAPES : CORE_SHAPES;
      const target = rng.pick(shapesPool);
      const style = rng.pick(SHAPE_STYLES);
      const rotated = difficulty === 2 && (target === 'Square' || target === 'Triangle' || target === 'Rectangle');
      const optionPool = target === 'Pentagon'
        ? ['Pentagon', 'Square', 'Triangle', 'Rectangle']
        : CORE_SHAPES;
      const distractors = buildShapeDistractors(target, optionPool, rotated);
      const optionPairs = rng.shuffle([{ value: target, tag: null }, ...distractors]);

      return {
        questionText: rotated
          ? `This ${style} shape is tilted! Which 2D shape is it?`
          : `Which 2D shape is shown on the ${style} card?`,
        correctAnswer: target,
        options: optionPairs.map((opt) => opt.value),
        format: 'shape-mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { shape: target.toLowerCase(), rotated, mode: 'identify' },
      };
    }

    // ── Mode 2: Real-world object shape match (30%) ──────────────────────────
    if (modeRoll < 60) {
      const obj = rng.pick(REAL_OBJECTS);
      const distractors = buildShapeDistractors(obj.answer, CORE_SHAPES, false);
      const optionPairs = rng.shuffle([{ value: obj.answer, tag: null }, ...distractors]);

      return {
        questionText: `A ${obj.item} looks like which 2D shape?`,
        correctAnswer: obj.answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'shape-mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { shape: obj.shape, rotated: false, mode: 'real-object', objectLabel: obj.item },
      };
    }

    // ── Mode 3: Reverse property lookup ("Which shape has 3 corners?") (20%) ─
    if (modeRoll < 80) {
      const pool = difficulty === 1 ? PROPERTY_CLUES.slice(0, 6) : PROPERTY_CLUES;
      const item = rng.pick(pool);
      const distractors = buildShapeDistractors(item.answer, item.pool, false);
      const optionPairs = rng.shuffle([{ value: item.answer, tag: null }, ...distractors]);

      return {
        questionText: `Which 2D shape has ${item.clue}?`,
        correctAnswer: item.answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'shape-mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { shape: item.shape, rotated: false, mode: 'by-property', clue: item.clue },
      };
    }

    // ── Mode 4: Count straight sides or corners (20%) ────────────────────────
    const shape = difficulty === 1
      ? rng.pick(CORE_SHAPES)
      : rng.pick(ALL_SHAPES);
    const answer = SIDES[shape];
    const propWord = rng.int(0, 1) === 0 ? 'straight sides' : 'corners';
    const rotated = difficulty === 2 && (shape === 'Square' || shape === 'Triangle');

    const used = new Set([answer]);
    const distractors = [];
    const addCandidate = (value, tag) => {
      if (value >= 0 && !used.has(value) && distractors.length < 3) {
        used.add(value);
        distractors.push({ value, tag });
      }
    };

    if (shape === 'Circle') {
      addCandidate(1, 'curved-straight-mixup');
      addCandidate(2, 'side-corner-count-slip');
      addCandidate(3, 'side-corner-count-slip');
      addCandidate(4, 'side-corner-count-slip');
    } else {
      addCandidate(answer + 1, 'side-corner-count-slip');
      addCandidate(answer - 1, 'side-corner-count-slip');
      addCandidate(answer + 2, 'side-corner-count-slip');
      addCandidate(0, 'curved-straight-mixup');
    }

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
    return {
      questionText: `How many ${propWord} does a ${shape} have?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'shape-mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: { shape: shape.toLowerCase(), rotated, mode: 'count-props' },
    };
  },
};

export default recipe;
