/**
 * Recipe: multiplication as repeated addition (Grade 2). Serves g2.mul.intro — the
 * "groups of" concept builder ahead of the specific times-tables (mulTable.js). Only two
 * difficulty rungs (per the skill map's `maxDifficulty: 2`): the curriculum ceiling here is
 * "product", not a table.
 *
 * `a × b` reads "a groups of b". Factors stay kid-sized (a group COUNT up to MAX_GROUPS) so the
 * repeated-addition mental model (b + b + ... + b, a times) stays countable by hand.
 *
 * Distractors encode multiplication misconceptions. Tags + rules are canonical per
 * misconceptions-reference.md ("Multiplication as repeated addition") — the source of truth:
 *   - multiplication-as-addition       : added the factors instead of multiplying (a + b, when
 *                                        NEITHER factor is 0 — see the collision note below)
 *   - skip-count-misstep               : lost track of the skip count (product ± a — two
 *                                        distractors, over/undershoot — when a != b and a != 0;
 *                                        a == 0 is excluded because product ± 0 == product,
 *                                        a real collision, not a meaningful distractor)
 *   - multiplication-by-zero-identity  : returns the OTHER factor when exactly one factor is 0
 *                                        (guard: the other factor must be nonzero — never on
 *                                        0×0, which has no "other" factor to fall back to)
 * (count-factor-swap is hint-only per the doc — never a generated distractor.)
 *
 * Collision note: multiplication-as-addition (a+b) and multiplication-by-zero-identity (the
 * other factor) compute the SAME number whenever exactly one factor is 0 — adding 0 does
 * nothing, so a+b reduces to the nonzero factor either way. Rather than let one silently shadow
 * the other via the generic dedup, generate() picks whichever tag actually APPLIES: zero-identity
 * when a factor is 0, multiplication-as-addition otherwise. A zero factor is deliberately
 * generated some of the time (ZERO_FACTOR_CHANCE) so zero-identity — real, doc-listed content —
 * actually gets exercised, not left permanently unreachable.
 *
 * Distractor SELECTION (not the tag rules above) goes through the shared `selectDistractors`
 * (`_plausibility.js`): at most one of the four options may be eliminable without arithmetic.
 * Known, reported (not patched) gap: when the zero-factor branch fires (product = 0), the
 * magnitude-ratio rule (`value < answer/2 or > answer*2`) makes EVERY nonzero distractor
 * implausible — there is no selection order that produces 3 plausible options when the answer
 * is 0. This is the same degenerate-answer case documented in `_plausibility.js`, not new here.
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;
const MAX_GROUPS = 5; // "a groups of b" — keeps the repeated-addition count kid-countable
const ZERO_FACTOR_CHANCE = 15; // percent chance either factor is deliberately 0

const PRODUCT_CAP = { 1: 12, 2: 20 };

/**
 * Two factors (a, b) with a*b <= cap. Deliberately produces a zero factor ZERO_FACTOR_CHANCE%
 * of the time so multiplication-by-zero-identity is genuinely reachable, never both zero.
 */
function buildFactors(rng, cap) {
  if (rng.int(0, 99) < ZERO_FACTOR_CHANCE) {
    const nonZero = rng.int(1, Math.min(cap, MAX_GROUPS + 3));
    return rng.int(0, 1) === 0 ? [0, nonZero] : [nonZero, 0];
  }
  const a = rng.int(1, Math.min(cap, MAX_GROUPS));
  const maxB = Math.max(1, Math.floor(cap / a));
  const b = rng.int(1, maxB);
  return [a, b];
}

const recipe = {
  skillId: 'g2.mul.intro',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    const cap = PRODUCT_CAP[difficulty];
    const [a, b] = buildFactors(rng, cap);
    const product = a * b;

    // Candidate wrong answers, most-specific first so random-slip is only ever a fallback.
    // multiplication-as-addition (a+b) and multiplication-by-zero-identity (the other factor)
    // are the SAME number whenever one factor is 0 (adding 0 does nothing) — a genuine
    // numeric collision, not just a priority choice. Zero-identity gets the slot in that case
    // so it stays reachable; multiplication-as-addition otherwise covers the always-nonzero case.
    const candidates = [];
    if ((a === 0) !== (b === 0)) {
      candidates.push({ value: a === 0 ? b : a, tag: 'multiplication-by-zero-identity' });
    } else {
      candidates.push({ value: a + b, tag: 'multiplication-as-addition' });
    }
    if (a !== b && a !== 0) {
      candidates.push({ value: product + a, tag: 'skip-count-misstep' });
      candidates.push({ value: product - a, tag: 'skip-count-misstep' });
    }

    const distractors = selectDistractors({
      candidates,
      kind: 'mul',
      context: { a, b, answer: product },
      count: OPTION_COUNT - 1,
    });

    // Shuffle the {value, tag} pairs together so misconceptions stay index-aligned with options.
    const optionPairs = rng.shuffle([{ value: product, tag: null }, ...distractors]);

    return {
      questionText: `${a} × ${b} = ?`,
      correctAnswer: product,
      options: optionPairs.map((o) => o.value),
      format: 'mcq',
      misconceptions: optionPairs.map((o) => o.tag),
    };
  },
};

export default recipe;
