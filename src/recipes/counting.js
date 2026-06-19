/**
 * Recipe: count objects 1–20 (Grade 1).
 *
 * Shows a set of identical objects and asks how many there are. Conforms to the contract
 * in RECIPE_TEMPLATE.md, using the `count-objects` format: alongside the core fields it
 * carries an optional `render` payload ({ glyph, count }) so the UI can draw the actual set
 * of objects to count. The number drawn equals the answer — that is intentional: in a
 * counting question the visible set IS the prompt.
 *
 * Difficulty caps the largest set (1–5 / 1–10 / 1–20); bigger ranges are a different skill.
 *
 * Distractors encode counting misconceptions:
 *   - off-by-one   : counted one too many (answer + 1)
 *   - miscount-low : missed one while counting (answer - 1)
 *   - random-slip  : a plausible nearby slip
 */

const OPTION_COUNT = 4;

// Curriculum ceiling per rung: largest set the child is asked to count.
const COUNT_MAX = { 1: 5, 2: 10, 3: 20 };

// Kid-friendly, visually distinct objects to count.
const GLYPHS = ['🍎', '⭐', '🐶', '🌸', '🚗', '🍌', '🐟', '🎈'];

const recipe = {
  skillId: 'g1.count.1-20',
  maxDifficulty: 3,

  generate(difficulty, rng) {
    const max = COUNT_MAX[difficulty];
    const count = rng.int(1, max);
    const glyph = rng.pick(GLYPHS);

    const candidates = [
      { value: count + 1, tag: 'off-by-one' },
      { value: count - 1, tag: 'miscount-low' },
      { value: count + 2, tag: 'random-slip' },
      { value: count - 2, tag: 'random-slip' },
      { value: count + 3, tag: 'random-slip' },
    ];

    const distractors = pickDistinctDistractors(candidates, count, rng);

    // Shuffle {value, tag} pairs together to keep misconceptions index-aligned with options.
    const optionPairs = rng.shuffle([{ value: count, tag: null }, ...distractors]);

    return {
      questionText: `How many ${glyph} are there?`,
      correctAnswer: count,
      options: optionPairs.map((o) => o.value),
      format: 'count-objects',
      misconceptions: optionPairs.map((o) => o.tag),
      // Format-specific render payload: draw `count` copies of `glyph`.
      render: { glyph, count },
    };
  },
};

/**
 * Choose OPTION_COUNT-1 distinct, non-negative distractors (never equal to the answer).
 * Falls back to nearby slips if candidates collide, so we always return a full option set.
 */
function pickDistinctDistractors(candidates, answer, rng) {
  const used = new Set([answer]);
  const chosen = [];
  for (const c of candidates) {
    if (chosen.length === OPTION_COUNT - 1) break;
    if (c.value < 0 || used.has(c.value)) continue;
    used.add(c.value);
    chosen.push(c);
  }
  let offset = 1;
  while (chosen.length < OPTION_COUNT - 1) {
    const value = answer + offset;
    offset = offset > 0 ? -offset : -offset + 1; // walk +1,-1,+2,-2,...
    if (value < 0 || used.has(value)) continue;
    used.add(value);
    chosen.push({ value, tag: 'random-slip' });
  }
  return chosen;
}

export default recipe;
