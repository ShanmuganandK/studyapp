/**
 * Recipe: basic fractions — equal parts, halves, thirds & quarters (Grade 2).
 * Serves g2.frac.halves-quarters.
 *
 * Generates 60+ distinct questions across 3 rich modes so an 8-question session never repeats:
 *   Mode A (`fraction-mcq`): Visual partitioned shapes (`circle`, `grid`, `bar`) across 8 contexts
 *     (`pizza`, `cake`, `chocolate bar`, `pie`, `window`, `waffle`, `garden bed`, `tile`), testing
 *     `1/2`, `1/3`, `2/3`, `1/4`, `3/4` (and on Rung 2, both SHADED and UNSHADED fraction prompts).
 *   Mode B (`mcq`, `half-collection`): Finding `1/2`, `1/4`, or `3/4` of a group of objects up to 24.
 *   Mode C (`mcq`, `fraction-whole`): Whole-part equivalence ("How many quarters (1/4) make 2 whole pizzas?").
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md:
 *   - denominator-magnitude-bias : swaps 1/2 and 1/4 or picks wrong denominator
 *   - shaded-to-unshaded-ratio   : writes shaded/unshaded (1/3 instead of 1/4)
 *   - unshaded-complement-picked : counts unshaded parts instead of shaded parts (or vice versa)
 *   - double-instead-of-half     : doubles n instead of halving/quartering n
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;

const SHAPE_CONTEXTS = [
  { label: 'pizza', visualShape: 'circle' },
  { label: 'pie', visualShape: 'circle' },
  { label: 'wheel', visualShape: 'circle' },
  { label: 'cake', visualShape: 'grid' },
  { label: 'window', visualShape: 'grid' },
  { label: 'waffle', visualShape: 'grid' },
  { label: 'chocolate bar', visualShape: 'bar' },
  { label: 'ribbon strip', visualShape: 'bar' },
];

const GROUP_ITEMS = [
  { word: 'apples', glyph: '🍎' },
  { word: 'strawberries', glyph: '🍓' },
  { word: 'cookies', glyph: '🍪' },
  { word: 'balloons', glyph: '🎈' },
  { word: 'cupcakes', glyph: '🧁' },
  { word: 'oranges', glyph: '🍊' },
];

const FRACTION_POOL_R1 = [
  { shaded: 1, total: 2, ans: '1/2', comp: '1/2', ratio: '1/1', alt: '1/4', fourth: '3/4' },
  { shaded: 1, total: 3, ans: '1/3', comp: '2/3', ratio: '1/2', alt: '1/4', fourth: '3/4' },
  { shaded: 1, total: 4, ans: '1/4', comp: '3/4', ratio: '1/3', alt: '1/2', fourth: '2/3' },
  { shaded: 3, total: 4, ans: '3/4', comp: '1/4', ratio: '3/1', alt: '1/2', fourth: '2/3' },
];

const FRACTION_POOL_R2 = [
  { shaded: 1, total: 4, ansShaded: '1/4', ansUnshaded: '3/4', ratio: '1/3', alt: '1/2' },
  { shaded: 3, total: 4, ansShaded: '3/4', ansUnshaded: '1/4', ratio: '1/3', alt: '1/2' },
  { shaded: 1, total: 3, ansShaded: '1/3', ansUnshaded: '2/3', ratio: '1/2', alt: '1/4' },
  { shaded: 2, total: 3, ansShaded: '2/3', ansUnshaded: '1/3', ratio: '1/2', alt: '3/4' },
];

const recipe = {
  skillId: 'g2.frac.halves-quarters',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    const roll = rng.int(0, 99);

    // ── Mode A: Visual partitioned shape (45% of questions) ──────────────────
    if (roll < 45) {
      const ctx = rng.pick(SHAPE_CONTEXTS);
      if (difficulty === 1) {
        const spec = rng.pick(FRACTION_POOL_R1);
        const visualShape = spec.total === 3 && ctx.visualShape === 'grid' ? 'bar' : ctx.visualShape;
        const offset = rng.int(0, spec.total - 1);
        const verb = spec.shaded === 1 ? 'is' : 'are';

        const optionsList = [
          { value: spec.ans, tag: null },
          { value: spec.alt, tag: 'denominator-magnitude-bias' },
          { value: spec.ratio === '1/1' || spec.ratio === '3/1' ? '1/3' : spec.ratio, tag: 'shaded-to-unshaded-ratio' },
          { value: spec.comp === spec.ans ? spec.fourth : spec.comp, tag: 'unshaded-complement-picked' },
        ];
        const optionPairs = rng.shuffle(optionsList);

        return {
          questionText: `${spec.shaded} of ${spec.total} equal parts of the ${ctx.label} ${verb} shaded. What fraction is shaded?`,
          correctAnswer: spec.ans,
          options: optionPairs.map((opt) => opt.value),
          format: 'fraction-mcq',
          misconceptions: optionPairs.map((opt) => opt.tag),
          render: {
            totalParts: spec.total,
            shadedParts: spec.shaded,
            visualShape,
            offset,
            askUnshaded: false,
            label: ctx.label,
          },
        };
      }

      // Difficulty 2 visual: ask either SHADED or UNSHADED
      const spec = rng.pick(FRACTION_POOL_R2);
      const askUnshaded = rng.int(0, 1) === 1;
      const visualShape = spec.total === 3 && ctx.visualShape === 'grid' ? 'bar' : ctx.visualShape;
      const offset = rng.int(0, spec.total - 1);
      const answer = askUnshaded ? spec.ansUnshaded : spec.ansShaded;
      const complement = askUnshaded ? spec.ansShaded : spec.ansUnshaded;
      const verb = spec.shaded === 1 ? 'is' : 'are';

      const optionPairs = rng.shuffle([
        { value: answer, tag: null },
        { value: complement, tag: 'unshaded-complement-picked' },
        { value: spec.alt, tag: 'denominator-magnitude-bias' },
        { value: spec.ratio, tag: 'shaded-to-unshaded-ratio' },
      ]);

      return {
        questionText: askUnshaded
          ? `${spec.shaded} of ${spec.total} equal parts of the ${ctx.label} ${verb} shaded. What fraction is UNSHADED?`
          : `${spec.shaded} of ${spec.total} equal parts of the ${ctx.label} ${verb} shaded. What fraction is shaded?`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'fraction-mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: {
          totalParts: spec.total,
          shadedParts: spec.shaded,
          visualShape,
          offset,
          askUnshaded,
          label: ctx.label,
        },
      };
    }

    // ── Mode B: Fraction of a group (40% of questions) ───────────────────────
    if (roll < 85) {
      const item = rng.pick(GROUP_ITEMS);
      let num;
      let den;
      let total;

      if (difficulty === 1) {
        const isQuarter = rng.int(0, 2) === 0; // 1/3 chance of 1/4, 2/3 chance of 1/2
        den = isQuarter ? 4 : 2;
        num = 1;
        const unit = isQuarter ? rng.int(1, 4) : rng.int(2, 8);
        total = unit * den;
      } else {
        const kind = rng.pick(['half', 'quarter', 'three-quarters']);
        if (kind === 'half') {
          num = 1;
          den = 2;
          total = rng.int(6, 12) * 2;
        } else if (kind === 'quarter') {
          num = 1;
          den = 4;
          total = rng.int(2, 6) * 4;
        } else {
          num = 3;
          den = 4;
          total = rng.int(2, 5) * 4;
        }
      }

      const answer = (total / den) * num;
      const complementVal = total - answer;
      const candidates = [
        { value: total * 2, tag: 'double-instead-of-half' },
      ];
      if (complementVal !== answer && complementVal > 0) {
        candidates.push({ value: complementVal, tag: 'unshaded-complement-picked' });
      }
      if (den === 4 && total % 2 === 0 && total / 2 !== answer) {
        candidates.push({ value: total / 2, tag: 'denominator-magnitude-bias' });
      }
      candidates.push({ value: answer + 1, tag: 'random-slip' });
      if (answer > 1) candidates.push({ value: answer - 1, tag: 'random-slip' });

      const distractors = selectDistractors({
        candidates,
        kind: 'place',
        context: { answer },
        count: OPTION_COUNT - 1,
        rng,
      });

      const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
      const fracName = den === 2 ? 'half (1/2)' : num === 1 ? 'one quarter (1/4)' : 'three quarters (3/4)';

      return {
        questionText: `What is ${fracName} of ${total} ${item.word}?`,
        correctAnswer: answer,
        options: optionPairs.map((opt) => opt.value),
        format: 'mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
        render: {
          kind: 'half-collection',
          total,
          num,
          den,
          glyph: item.glyph,
          word: item.word,
        },
      };
    }

    // ── Mode C: Whole-Part Equivalence (15% of questions) ────────────────────
    const isQuarters = difficulty === 2 ? rng.int(0, 1) === 0 : false;
    const partsPerWhole = isQuarters ? 4 : 2;
    const wholes = difficulty === 1 ? rng.int(1, 3) : rng.int(2, 4);
    const answer = wholes * partsPerWhole;
    const otherDen = isQuarters ? 2 : 4;

    const candidates = [
      { value: wholes * otherDen, tag: 'denominator-magnitude-bias' },
      { value: wholes + partsPerWhole, tag: 'shaded-to-unshaded-ratio' },
      { value: answer + 1, tag: 'random-slip' },
      { value: Math.max(1, answer - 1), tag: 'random-slip' },
    ];

    const distractors = selectDistractors({
      candidates,
      kind: 'place',
      context: { answer },
      count: OPTION_COUNT - 1,
      rng,
    });

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
    const partWord = isQuarters ? 'quarters (1/4)' : 'halves (1/2)';
    const wholeWord = wholes === 1 ? '1 whole pizza' : `${wholes} whole pizzas`;

    return {
      questionText: `How many ${partWord} make ${wholeWord}?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: {
        kind: 'fraction-whole',
        wholes,
        partsPerWhole,
      },
    };
  },
};

export default recipe;
