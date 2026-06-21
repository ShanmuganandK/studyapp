/**
 * Recipe: count objects (Grade 1). Multi-skill — serves several counting ranges from one
 * parameterised recipe (per the skill map's recipe-reuse note):
 *   - g1.count.1-9   (numbers 1–9)
 *   - g1.count.1-20  (numbers up to 20)
 * (g1.num.21-99 is deliberately NOT served here: drawing dozens of objects is unsuitable and
 *  misconceptions-reference.md has no 21–99 counting tags yet — it stays `planned`.)
 *
 * `generate(difficulty, rng, skillId)` selects the range from `skillId`. Shows a set of
 * identical objects and asks how many there are, using the `count-objects` format: alongside
 * the core fields it carries a `render` payload ({ glyph, count }) so the UI can draw the set.
 * The number drawn equals the answer — intentional: in counting the visible set IS the prompt.
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

// Per-skill curriculum ceiling: largest set the child is asked to count, per difficulty rung.
const COUNT_MAX = {
  'g1.count.1-9': { 1: 3, 2: 6, 3: 9 },
  'g1.count.1-20': { 1: 5, 2: 10, 3: 20 },
};
const SKILL_IDS = ['g1.count.1-9', 'g1.count.1-20'];
const DEFAULT_SKILL = 'g1.count.1-20';

// Kid-friendly, visually distinct objects to count.
const GLYPHS = ['🍎', '⭐', '🐶', '🌸', '🚗', '🍌', '🐟', '🎈'];

// Doc condition for skip-count-sequence: large enough sets to plausibly lose track.
const SKIP_COUNT_MIN = 6;

const recipe = {
  skillIds: SKILL_IDS,
  maxDifficulty: 3,

  generate(difficulty, rng, skillId = DEFAULT_SKILL) {
    const caps = COUNT_MAX[skillId] ?? COUNT_MAX[DEFAULT_SKILL];
    const max = caps[difficulty];
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
