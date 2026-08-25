/**
 * Recipe: 2-digit addition (Grade 2). Multi-skill — serves two ranges from one parameterised
 * recipe (per the skill map's recipe-reuse note):
 *   - g2.add.2d-nocarry  (every column resolves without regrouping)
 *   - g2.add.2d-carry    (the ones column ALWAYS requires a carry)
 *
 * `generate(difficulty, rng, skillId)` builds two operands via rejection sampling on the sum
 * cap + the carry requirement. This is a STRUCTURAL guarantee, not a preference: without it
 * neither `forgot-carry` (carry skill) nor the "column resolves cleanly" premise (no-carry
 * skill) would have a real condition to fire on, and the two skills would not actually be two
 * different skills.
 *
 * Distractors encode addition misconceptions. Tags + rules are canonical per
 * misconceptions-reference.md ("2-digit addition without carry" / "...WITH carry") — the
 * source of truth:
 *   no-carry:
 *     - column-alignment-shift : misaligned a single-digit operand into the tens column
 *                                 (a + 10*b, when b is single-digit)
 *     - add-across-columns     : summed all four digits instead of columnwise
 *                                 (tens(a)+ones(a)+tens(b)+ones(b), always)
 *     - operator-mixup         : subtracted instead of adding (|a - b|, always)
 *     - place-value-swap       : swapped the tens/ones of the correct sum
 *                                 (swapDigits(sum) — guard: skip palindromes, sum % 11 === 0)
 *   carry:
 *     - forgot-carry              : dropped the carried ten (sum - 10, always — carry required)
 *     - write-full-sum-in-column  : wrote the 2-digit ones-sum straight into the ones place,
 *                                   uncarried (tensSum*100 + onesSum, always)
 *     - double-carry              : added the carried ten to BOTH columns (sum + 10, always)
 *     - carry-subtraction-instead : subtracted the carry from the tens column (sum - 20, always)
 * (Both skills' condition is always true by construction — carry-required/carry-free is exactly
 * what buildOperands guarantees — so every question offers 3-4 real tagged candidates before any
 * random-slip fallback fires.)
 *
 * Distractor SELECTION (not the tag rules above) goes through the shared `selectDistractors`
 * (`_plausibility.js`): at most one of the four options may be eliminable without arithmetic.
 * Both branches here had TWO structurally-implausible candidates competing for one slot — found
 * in the kid-test plausibility audit at ~99-100% of no-carry questions:
 *   no-carry: `add-across-columns` tops out at 9+9+9+9=36, always, far below the 69/99 sum caps;
 *             `operator-mixup` (`|a-b|`) collapses below max(a,b) whenever a and b differ.
 *   carry:    `write-full-sum-in-column` (a 3+ digit concatenation) is always digit-length-off;
 *             `forgot-carry` (sum-10) is ALSO frequently magnitude-implausible whenever one
 *             operand is small relative to the other — an audit finding that contradicted the
 *             "carry branch is mostly fine" expectation this fix was scoped against.
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;
const MAX_ATTEMPTS = 30;

const ones = (n) => n % 10;
const tens = (n) => Math.floor(n / 10);
const swapDigits = (n) => ones(n) * 10 + tens(n);

// Per-skill curriculum ceiling: largest possible sum, per difficulty rung.
const CAPS = {
  'g2.add.2d-nocarry': { 1: 39, 2: 69, 3: 99 },
  'g2.add.2d-carry': { 1: 49, 2: 79, 3: 99 },
};
const SKILL_IDS = ['g2.add.2d-nocarry', 'g2.add.2d-carry'];
const DEFAULT_SKILL = 'g2.add.2d-nocarry';

/**
 * Two operands (a always 2-digit, b >= 1) whose sum <= cap and whose ones-column carry status
 * matches `needsCarry` exactly. Rejection sampling over (a, b); the fallback pairs are
 * unreachable in practice given these caps but keep the function total (never hangs).
 */
function buildOperands(rng, cap, needsCarry) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const a = rng.int(10, cap - 1);
    const maxB = cap - a;
    if (maxB < 1) continue;
    const b = rng.int(1, maxB);
    if ((ones(a) + ones(b) >= 10) === needsCarry) return [a, b];
  }
  return needsCarry ? [19, 19] : [10, 9]; // safety net: guaranteed-valid pairs
}

const recipe = {
  skillIds: SKILL_IDS,
  maxDifficulty: 3,

  generate(difficulty, rng, skillId = DEFAULT_SKILL) {
    const needsCarry = skillId === 'g2.add.2d-carry';
    const cap = (CAPS[skillId] ?? CAPS[DEFAULT_SKILL])[difficulty];
    const [a, b] = buildOperands(rng, cap, needsCarry);
    const sum = a + b;

    // Candidate wrong answers, most-specific first so random-slip is only ever a fallback.
    const candidates = [];
    if (needsCarry) {
      const tensSum = tens(a) + tens(b);
      const onesSum = ones(a) + ones(b);
      candidates.push({ value: sum - 10, tag: 'forgot-carry' });
      candidates.push({ value: tensSum * 100 + onesSum, tag: 'write-full-sum-in-column' });
      candidates.push({ value: sum + 10, tag: 'double-carry' });
      candidates.push({ value: sum - 20, tag: 'carry-subtraction-instead' });
    } else {
      if (tens(b) === 0) {
        candidates.push({ value: a + 10 * b, tag: 'column-alignment-shift' });
      }
      candidates.push({ value: tens(a) + ones(a) + tens(b) + ones(b), tag: 'add-across-columns' });
      candidates.push({ value: Math.abs(a - b), tag: 'operator-mixup' });
      if (sum % 11 !== 0) {
        candidates.push({ value: swapDigits(sum), tag: 'place-value-swap' });
      }
    }

    const distractors = selectDistractors({
      candidates,
      kind: 'add',
      context: { a, b, answer: sum },
      count: OPTION_COUNT - 1,
      rng,
    });

    // Shuffle the {value, tag} pairs together so misconceptions stay index-aligned with options.
    const optionPairs = rng.shuffle([{ value: sum, tag: null }, ...distractors]);

    return {
      questionText: `${a} + ${b} = ?`,
      correctAnswer: sum,
      options: optionPairs.map((o) => o.value),
      format: 'mcq',
      misconceptions: optionPairs.map((o) => o.tag),
    };
  },
};

export default recipe;
