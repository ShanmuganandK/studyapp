/**
 * Recipe: multiplication tables 2/5/10 (Grade 2). Multi-skill — serves three fixed tables from
 * one parameterised recipe (per the skill map's recipe-reuse note):
 *   - g2.mul.table2, g2.mul.table5, g2.mul.table10
 *
 * `generate(difficulty, rng, skillId)` picks the fixed table value T from `skillId` (2, 5 or
 * 10) and a multiplier m; the question is `T × m = ?`. The curriculum ceiling is on the
 * MULTIPLIER, not the product (a "table" skill drills the count of multiples, not a range).
 *
 * Distractors encode multiplication misconceptions. Tags + rules are canonical per
 * misconceptions-reference.md ("Multiplication tables (2,5,10)") — the source of truth. Note
 * these are DIFFERENT tag strings from mulIntro.js's near-identical concepts (that skill's
 * table has its own tag names) — each skill emits only what its own doc table lists:
 *   - skip-count-misstep            : one skip-count step off (product ± T, always)
 *   - add-instead-of-multiply       : added the two factors instead of multiplying (T + m, when
 *                                     m is not 0 or 1 — see the collision note below)
 *   - multiplication-by-one-identity: if m == 1, returns the other factor + 1 (T + 1)
 *   - zero-identity-error           : if m == 0, returns the other factor (T)
 *
 * Collision note: "T + m" (add-instead-of-multiply) reduces to the SAME number as
 * zero-identity-error (T) when m=0, and as multiplication-by-one-identity (T+1) when m=1 —
 * adding 0 or 1 does nothing extra there. Rather than let the generic dedup silently always
 * pick whichever is listed first, generate() picks the tag that actually APPLIES for the drawn
 * m, exactly as mulIntro.js does for its analogous zero-identity collision.
 *
 * A multiplier of 0 is deliberately drawn some of the time (ZERO_CHANCE) so zero-identity-error
 * is genuinely reachable, not defined-but-dead content.
 *
 * Distractor SELECTION (not the tag rules above) goes through the shared `selectDistractors`
 * (`_plausibility.js`): at most one of the four options may be eliminable without arithmetic.
 * Same known, reported (not patched) gap as mulIntro.js: when m=0 (product=0), the
 * magnitude-ratio rule makes every nonzero distractor implausible — no selection order can
 * produce 3 plausible options for a zero answer.
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;
const ZERO_CHANCE = 10; // percent chance the multiplier is deliberately 0

const TABLE_VALUE = {
  'g2.mul.table2': 2,
  'g2.mul.table5': 5,
  'g2.mul.table10': 10,
};
const SKILL_IDS = ['g2.mul.table2', 'g2.mul.table5', 'g2.mul.table10'];
const DEFAULT_SKILL = 'g2.mul.table2';

// Curriculum ceiling per rung: largest possible multiplier.
const MULTIPLIER_CAP = { 1: 5, 2: 8, 3: 10 };

const recipe = {
  skillIds: SKILL_IDS,
  maxDifficulty: 3,

  generate(difficulty, rng, skillId = DEFAULT_SKILL) {
    const table = TABLE_VALUE[skillId] ?? TABLE_VALUE[DEFAULT_SKILL];
    const cap = MULTIPLIER_CAP[difficulty];
    const m = rng.int(0, 99) < ZERO_CHANCE ? 0 : rng.int(1, cap);
    const product = table * m;

    // Candidate wrong answers, most-specific first so random-slip is only ever a fallback.
    const candidates = [];
    if (m === 0) {
      candidates.push({ value: table, tag: 'zero-identity-error' });
    } else if (m === 1) {
      candidates.push({ value: table + 1, tag: 'multiplication-by-one-identity' });
    } else {
      candidates.push({ value: table + m, tag: 'add-instead-of-multiply' });
    }
    candidates.push({ value: product + table, tag: 'skip-count-misstep' });
    candidates.push({ value: product - table, tag: 'skip-count-misstep' });

    const distractors = selectDistractors({
      candidates,
      kind: 'mul',
      context: { a: table, b: m, answer: product },
      count: OPTION_COUNT - 1,
      rng,
    });

    // Shuffle the {value, tag} pairs together so misconceptions stay index-aligned with options.
    const optionPairs = rng.shuffle([{ value: product, tag: null }, ...distractors]);

    return {
      questionText: `${table} × ${m} = ?`,
      correctAnswer: product,
      options: optionPairs.map((o) => o.value),
      format: 'mcq',
      misconceptions: optionPairs.map((o) => o.tag),
    };
  },
};

export default recipe;
