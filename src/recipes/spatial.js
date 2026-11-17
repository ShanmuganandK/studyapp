/**
 * Recipe: spatial concepts — inside/outside, near/far, top/bottom (Grade 1).
 * Serves g1.shapes.space. Format `spatial-mcq`.
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Shapes — spatial (inside/outside, near/far, top/bottom)"):
 *   - opposite-spatial-term         : picks the antonym (inside<->outside, top<->bottom, near<->far)
 *   - vertical-horizontal-confusion : confuses top/bottom with inside/outside or near/far
 */

const RELATIONS = [
  { relation: 'inside', opposite: 'outside', others: ['top', 'bottom'], item: '🐱', anchor: '📦', anchorName: 'box' },
  { relation: 'outside', opposite: 'inside', others: ['top', 'bottom'], item: '🐶', anchor: '🏠', anchorName: 'house' },
  { relation: 'top', opposite: 'bottom', others: ['inside', 'outside'], item: '🐦', anchor: '🌳', anchorName: 'tree' },
  { relation: 'bottom', opposite: 'top', others: ['inside', 'outside'], item: '🐸', anchor: '🌳', anchorName: 'tree' },
  { relation: 'near', opposite: 'far', others: ['top', 'bottom'], item: '🐰', anchor: '🥕', anchorName: 'carrot' },
  { relation: 'far', opposite: 'near', others: ['top', 'bottom'], item: '🐘', anchor: '🌳', anchorName: 'tree' },
];

const recipe = {
  skillId: 'g1.shapes.space',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    const pool = difficulty === 1 ? RELATIONS.slice(0, 4) : RELATIONS;
    const spec = rng.pick(pool);
    const answer = spec.relation;

    const optionPairs = rng.shuffle([
      { value: answer, tag: null },
      { value: spec.opposite, tag: 'opposite-spatial-term' },
      { value: spec.others[0], tag: 'vertical-horizontal-confusion' },
      { value: spec.others[1], tag: 'vertical-horizontal-confusion' },
    ]);

    return {
      questionText: `Where is the ${spec.item} relative to the ${spec.anchorName}?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'spatial-mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: {
        relation: spec.relation,
        itemGlyph: spec.item,
        anchorGlyph: spec.anchor,
        anchorName: spec.anchorName,
      },
    };
  },
};

export default recipe;
