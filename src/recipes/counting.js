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
 * Distractors encode counting misconceptions. Tags + rules are canonical per
 * misconceptions-reference.md ("Counting & number sense (1–20)") — the source of truth:
 *   - double-count-object : counted one object twice          (answer + 1, always)
 *   - skip-count-sequence : skipped a number word             (answer - 1, when count >= 6)
 *   - count-from-zero     : started counting at 0, not 1      (answer - 1, always)
 *   - random-slip         : doc-sanctioned nearby-value fill
 *
 * skip-count-sequence and count-from-zero share the value (answer - 1); only one appears per
 * question (dedup). We prefer skip-count-sequence once a set is large enough to lose track
 * (count >= 6, the doc's condition) and fall back to count-from-zero for small sets.
 * teen-reversal is hint-only in the doc, so it is NOT used as a distractor.
 */

const OPTION_COUNT = 4;

// Curriculum ceiling per rung: largest set the child is asked to count.
const COUNT_MAX = { 1: 5, 2: 10, 3: 20 };

// Kid-friendly, visually distinct objects to count.
const GLYPHS = ['🍎', '⭐', '🐶', '🌸', '🚗', '🍌', '🐟', '🎈'];

// Doc condition for skip-count-sequence: large enough sets to plausibly lose track.
const SKIP_COUNT_MIN = 6;

const recipe = {
  skillId: 'g1.count.1-20',
  maxDifficulty: 3,

  generate(difficulty, rng) {
    const max = COUNT_MAX[difficulty];
    const count = rng.int(1, max);
    const glyph = rng.pick(GLYPHS);

    // Most-specific misconceptions first so random-slip is only ever a fallback.
    const candidates = [{ value: count + 1, tag: 'double-count-object' }];
    // The (count - 1) slot: skip-count-sequence for larger sets, else count-from-zero.
    if (count >= SKIP_COUNT_MIN) {
      candidates.push({ value: count - 1, tag: 'skip-count-sequence' });
    }
    candidates.push({ value: count - 1, tag: 'count-from-zero' });
    candidates.push({ value: count + 2, tag: 'random-slip' });
    candidates.push({ value: count - 2, tag: 'random-slip' });
    candidates.push({ value: count + 3, tag: 'random-slip' });

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
