/**
 * Recipe: 2D shapes — circle, square, triangle, rectangle (Grade 1).
 * Serves g1.shapes.2d. Format `shape-mcq` (when identifying a drawn shape) or `mcq` (when
 * counting sides/corners).
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Shapes — 2D shapes (circle, square, triangle, rectangle)"):
 *   - rotation-blindness         : fails on a 45°-rotated square
 *   - square-rectangle-confusion : confuses square and rectangle (both have 4 sides/corners)
 *   - side-corner-count-slip     : sides ± 1
 *   - curved-straight-mixup      : answers 1 straight side for a circle instead of 0
 */

const SHAPES = ['Circle', 'Square', 'Triangle', 'Rectangle'];
const SIDES = { Circle: 0, Triangle: 3, Square: 4, Rectangle: 4 };

const recipe = {
  skillId: 'g1.shapes.2d',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    const askShapeName = rng.int(0, 99) < 60;

    if (askShapeName) {
      const target = difficulty === 2
        ? rng.pick(['Square', 'Rectangle', 'Triangle', 'Circle'])
        : rng.pick(SHAPES);
      const rotated = difficulty === 2 && (target === 'Square' || target === 'Triangle');

      const distractors = SHAPES.filter((s) => s !== target).map((s) => {
        if (rotated && target === 'Square') {
          return { value: s, tag: 'rotation-blindness' };
        }
        if ((target === 'Square' && s === 'Rectangle') || (target === 'Rectangle' && s === 'Square')) {
          return { value: s, tag: 'square-rectangle-confusion' };
        }
        return { value: s, tag: 'random-slip' };
      });

      const optionPairs = rng.shuffle([{ value: target, tag: null }, ...distractors]);
      return {
        questionText: rotated
          ? `This shape is tilted! Which 2D shape is it?`
          : `Which 2D shape is shown?`,
        correctAnswer: target,
        options: optionPairs.map((opt) => opt.value),
        format: 'shape-mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: { shape: target.toLowerCase(), rotated },
      };
    }

    // Side / corner count question (numeric options)
    const shape = difficulty === 1
      ? rng.pick(['Triangle', 'Square', 'Rectangle'])
      : rng.pick(SHAPES);
    const answer = SIDES[shape];
    const propWord = rng.int(0, 1) === 0 ? 'straight sides' : 'corners';

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
      render: { shape: shape.toLowerCase(), rotated: false },
    };
  },
};

export default recipe;
