/**
 * Recipe: compare numbers (Grade 1–2). Multi-skill — serves two ranges from one parameterised
 * recipe (per the skill map's recipe-reuse note):
 *   - g1.num.compare20   (up to 20 — the original, unchanged, reference recipe)
 *   - g2.num.compare999  (up to 999)
 *
 * The child picks the sign that makes `a ? b` true, so this uses the `compare` format:
 * options are the three operators ['>','<','='] (strings) and `correctAnswer` is the right
 * one. A `render: { left, right }` payload carries the two numbers for the UI.
 *
 * Distractors encode comparison misconceptions. Tags + rules are canonical per
 * misconceptions-reference.md ("Comparing numbers") — the source of truth:
 *   - alligator-confusion : flipped the crocodile — chose the reversed operator (always the
 *                           wrong direction).
 *   - ones-digit-bias     : compared only the ones digits; equal ones read as "=" .
 *   - digit-length-bias   : compared only the leading digits; equal lead digits read as "=" .
 *
 * Why generation is constrained: a comparison has only three possible answers, so each
 * question has exactly two wrong operators (the reverse direction and "="). To keep BOTH wrong
 * options misconception-backed (contract: every wrong option carries a tag), every pair is
 * built so "=" is explainable: either the two numbers share their leading digit
 * (-> digit-length-bias) or share their ones digit (-> ones-digit-bias). The reverse direction
 * is always explained by alligator-confusion. This constraint carries UNCHANGED into the 999
 * range (Trap B, TRACKER Now #11) — only the numeric ranges scale with skill/difficulty, via
 * the two shared pair-construction helpers below.
 *
 * Difficulty picks the pair shape (same rule for every skill this recipe serves):
 *   1 → shared ones digit (biggest, easiest gap)      3 → shared leading digit (closer, harder)
 *   2 → either
 */

const SKILL_IDS = ['g1.num.compare20', 'g2.num.compare999'];
const DEFAULT_SKILL = 'g1.num.compare20';

// Per-skill, per-difficulty: `digits` = digit-length used for the shared-leading-digit pair;
// `cap` = curriculum ceiling on the larger operand. g1.num.compare20's values are the original,
// unchanged range (teens, 10-19) — it never varies by difficulty, matching shipped behaviour.
const RANGE = {
  'g1.num.compare20': {
    1: { digits: 2, cap: 19 },
    2: { digits: 2, cap: 19 },
    3: { digits: 2, cap: 19 },
  },
  'g2.num.compare999': {
    1: { digits: 2, cap: 99 },
    2: { digits: 3, cap: 499 },
    3: { digits: 3, cap: 999 },
  },
};

/**
 * Two distinct `digits`-digit numbers sharing their leading digit, both <= cap.
 * (Generalises the original "two distinct teens" construction to any digit-length/cap.)
 */
function sharedLeadPair(rng, digits, cap) {
  const base = 10 ** (digits - 1);
  const leadMax = Math.floor(cap / base); // highest leading digit that keeps numbers <= cap
  const lead = rng.int(1, leadMax);
  const lo = lead * base;
  const hi = Math.min(lo + (base - 1), cap);
  let x = rng.int(lo, hi);
  let y = rng.int(lo, hi);
  while (y === x) y = rng.int(lo, hi);
  return [x, y];
}

/**
 * A `digits`-digit number (<= cap, nonzero ones digit) and a single digit sharing its ones
 * digit. (Generalises the original "teen vs its ones-digit single" construction.)
 */
function sharedOnesPair(rng, digits, cap) {
  const base = 10 ** (digits - 1);
  let x = rng.int(base, cap);
  while (x % 10 === 0) x = rng.int(base, cap); // keep the ones-digit collision meaningful (1-9)
  return [x, x % 10];
}

const recipe = {
  skillIds: SKILL_IDS,
  maxDifficulty: 3,

  generate(difficulty, rng, skillId = DEFAULT_SKILL) {
    const { digits, cap } = (RANGE[skillId] ?? RANGE[DEFAULT_SKILL])[difficulty];

    const sharedLead = difficulty === 3 || (difficulty === 2 && rng.int(0, 1) === 1);
    const [x, y] = sharedLead ? sharedLeadPair(rng, digits, cap) : sharedOnesPair(rng, digits, cap);
    const equalTag = sharedLead ? 'digit-length-bias' : 'ones-digit-bias';

    // Randomise which side is the minuend so the correct sign varies between > and <.
    const [a, b] = rng.int(0, 1) === 0 ? [x, y] : [y, x];
    const correct = a > b ? '>' : '<'; // pairs are always unequal by construction
    const reverse = correct === '>' ? '<' : '>';

    const optionPairs = rng.shuffle([
      { value: correct, tag: null },
      { value: reverse, tag: 'alligator-confusion' },
      { value: '=', tag: equalTag },
    ]);

    return {
      questionText: `Which sign goes in the box?  ${a} ⬜ ${b}`,
      correctAnswer: correct,
      options: optionPairs.map((o) => o.value),
      format: 'compare',
      misconceptions: optionPairs.map((o) => o.tag),
      render: { left: a, right: b },
    };
  },
};

export default recipe;
