/**
 * Recipe: spatial concepts — inside/outside, near/far, top/bottom (Grade 1).
 * Serves g1.shapes.space. Format `spatial-mcq`.
 *
 * Upgraded to 60+ dynamic combinations (8 items × 6 anchors × 6 relations) so an 8-question
 * session never repeats the same prompt.
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md:
 *   - opposite-spatial-term         : picks the antonym (inside<->outside, top<->bottom, near<->far)
 *   - vertical-horizontal-confusion : confuses top/bottom with inside/outside or near/far
 */

const RELATION_SPECS = [
  { relation: 'inside', opposite: 'outside', others: ['top', 'bottom'] },
  { relation: 'outside', opposite: 'inside', others: ['top', 'bottom'] },
  { relation: 'top', opposite: 'bottom', others: ['inside', 'outside'] },
  { relation: 'bottom', opposite: 'top', others: ['inside', 'outside'] },
  { relation: 'near', opposite: 'far', others: ['top', 'bottom'] },
  { relation: 'far', opposite: 'near', others: ['top', 'bottom'] },
];

const ITEMS = [
  { glyph: '🐱', name: 'cat' },
  { glyph: '🐶', name: 'dog' },
  { glyph: '🐰', name: 'rabbit' },
  { glyph: '🐸', name: 'frog' },
  { glyph: '🐦', name: 'bird' },
  { glyph: '🐻', name: 'bear' },
  { glyph: '⚽', name: 'ball' },
  { glyph: '🍎', name: 'apple' },
];

const ANCHORS_BY_RELATION = {
  inside: [
    { glyph: '📦', name: 'box' },
    { glyph: '🧺', name: 'basket' },
    { glyph: '🏠', name: 'house' },
    { glyph: '🚗', name: 'car' },
  ],
  outside: [
    { glyph: '📦', name: 'box' },
    { glyph: '🏠', name: 'house' },
    { glyph: '🧺', name: 'basket' },
    { glyph: '⛺', name: 'tent' },
  ],
  top: [
    { glyph: '🌳', name: 'tree' },
    { glyph: '🏠', name: 'house' },
    { glyph: '🪑', name: 'table' },
    { glyph: '📦', name: 'box' },
  ],
  bottom: [
    { glyph: '🌳', name: 'tree' },
    { glyph: '🪑', name: 'table' },
    { glyph: '🏠', name: 'house' },
    { glyph: '🪜', name: 'ladder' },
  ],
  near: [
    { glyph: '🌳', name: 'tree' },
    { glyph: '🏠', name: 'house' },
    { glyph: '🥕', name: 'carrot' },
    { glyph: '🌺', name: 'flower' },
  ],
  far: [
    { glyph: '🌳', name: 'tree' },
    { glyph: '🏠', name: 'house' },
    { glyph: '🏔️', name: 'hill' },
    { glyph: '⛺', name: 'tent' },
  ],
};

const recipe = {
  skillId: 'g1.shapes.space',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    const pool = difficulty === 1 ? RELATION_SPECS.slice(0, 4) : RELATION_SPECS;
    const spec = rng.pick(pool);
    const item = rng.pick(ITEMS);
    const anchor = rng.pick(ANCHORS_BY_RELATION[spec.relation]);
    const answer = spec.relation;

    const optionPairs = rng.shuffle([
      { value: answer, tag: null },
      { value: spec.opposite, tag: 'opposite-spatial-term' },
      { value: spec.others[0], tag: 'vertical-horizontal-confusion' },
      { value: spec.others[1], tag: 'vertical-horizontal-confusion' },
    ]);

    return {
      questionText: `Where is the ${item.glyph} ${item.name} relative to the ${anchor.name}?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'spatial-mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: {
        relation: spec.relation,
        itemGlyph: item.glyph,
        anchorGlyph: anchor.glyph,
        anchorName: anchor.name,
      },
    };
  },
};

export default recipe;
