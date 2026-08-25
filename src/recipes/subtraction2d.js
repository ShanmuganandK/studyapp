/**
 * Recipe: 2-digit subtraction (Grade 2). Multi-skill — serves two ranges from one parameterised
 * recipe (per the skill map's recipe-reuse note):
 *   - g2.sub.2d-noborrow  (every column resolves without regrouping)
 *   - g2.sub.2d-borrow    (the ones column ALWAYS requires a borrow)
 *
 * `generate(difficulty, rng, skillId)` builds two operands via rejection sampling on the
 * minuend cap + the borrow requirement. STRUCTURAL, not a preference: without it neither the
 * borrow tags nor the "column resolves cleanly" premise would have a real condition to fire on,
 * and the pair would not actually be two different skills.
 *
 * a > b > 0 always (Grade 2 never sees a negative difference). Given that, `ones(a) < ones(b)`
 * (borrow needed) implies `tens(a) > tens(b)` strictly, and `ones(a) >= ones(b)` (no borrow)
 * implies `tens(a) >= tens(b)` — both proven by the digit-place argument, not assumed — so every
 * distractor formula below that reads `tens(a) - tens(b)` (or `- 1 - tens(b)` for the borrow
 * skill) is guaranteed non-negative by construction.
 *
 * Distractors encode subtraction misconceptions. Tags + rules are canonical per
 * misconceptions-reference.md ("2-digit subtraction without borrow" / "...WITH borrow") — the
 * source of truth. The two skills' tag sets are entirely disjoint (matching the doc's two
 * separate tables):
 *   no-borrow:
 *     - operator-mixup             : added instead of subtracting (a + b, always)
 *     - column-alignment-shift     : misaligned a single-digit subtrahend under the tens column
 *                                    ((tens(a)-b)*10 + ones(a), when b is single-digit)
 *     - digit-subtraction-isolation: swapped the tens/ones of the correct answer
 *                                    (swapDigits(ans) — guard: skip palindromes, ans % 11 === 0)
 *     - ones-subtraction-ignored   : subtracted only the tens, copied a's ones unchanged
 *                                    ((tens(a)-tens(b))*10 + ones(a), always)
 *   borrow:
 *     - smaller-from-larger-force  : per-column, forced the smaller ones digit from the larger
 *                                    ((tens(a)-tens(b))*10 + |ones(a)-ones(b)|, always)
 *     - borrow-without-reducing-tens : borrowed into the ones but never reduced the tens
 *                                      (ans + 10, always)
 *     - regroup-ten-ones-shortchange : set the ones to a bare 10 instead of ones(a)+10 before
 *                                      subtracting ((tens(a)-1-tens(b))*10 + (10-ones(b)), always)
 *     - borrow-from-nowhere        : reduced the tens but never added the borrowed 10 to the
 *                                    ones (ans - 10, always)
 *
 * Distractor SELECTION (not the tag rules above) goes through the shared `selectDistractors`
 * (`_plausibility.js`): at most one of the four options may be eliminable without arithmetic.
 * `operator-mixup` (`a+b`) is implausible on EVERY no-borrow question by construction — a
 * difference plus its subtrahend is always greater than the minuend, which is exactly the
 * subtraction monotonic rule — found in the audit at 51-81% combined 2-implausible rate across
 * both branches.
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;
const MAX_ATTEMPTS = 30;

const ones = (n) => n % 10;
const tens = (n) => Math.floor(n / 10);
const swapDigits = (n) => ones(n) * 10 + tens(n);

// Per-skill curriculum ceiling: largest possible minuend, per difficulty rung.
const CAPS = {
  'g2.sub.2d-noborrow': { 1: 39, 2: 69, 3: 99 },
  'g2.sub.2d-borrow': { 1: 49, 2: 79, 3: 99 },
};
const SKILL_IDS = ['g2.sub.2d-noborrow', 'g2.sub.2d-borrow'];
const DEFAULT_SKILL = 'g2.sub.2d-noborrow';

/**
 * Two operands (a always 2-digit, 0 < b < a) whose minuend a <= cap and whose ones-column
 * borrow status matches `needsBorrow` exactly. Rejection sampling; the fallback pairs are
 * unreachable in practice given these caps but keep the function total (never hangs).
 */
function buildOperands(rng, cap, needsBorrow) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const a = rng.int(10, cap);
    const maxB = a - 1;
    if (maxB < 1) continue;
    const b = rng.int(1, maxB);
    if ((ones(a) < ones(b)) === needsBorrow) return [a, b];
  }
  return needsBorrow ? [21, 19] : [39, 15]; // safety net: guaranteed-valid pairs
}

const recipe = {
  skillIds: SKILL_IDS,
  maxDifficulty: 3,

  generate(difficulty, rng, skillId = DEFAULT_SKILL) {
    const needsBorrow = skillId === 'g2.sub.2d-borrow';
    const cap = (CAPS[skillId] ?? CAPS[DEFAULT_SKILL])[difficulty];
    const [a, b] = buildOperands(rng, cap, needsBorrow);
    const answer = a - b;

    // Candidate wrong answers, most-specific first so random-slip is only ever a fallback.
    const candidates = [];
    if (needsBorrow) {
      const tensDiff = tens(a) - tens(b);
      candidates.push({ value: tensDiff * 10 + Math.abs(ones(a) - ones(b)), tag: 'smaller-from-larger-force' });
      candidates.push({ value: answer + 10, tag: 'borrow-without-reducing-tens' });
      candidates.push({ value: (tens(a) - 1 - tens(b)) * 10 + (10 - ones(b)), tag: 'regroup-ten-ones-shortchange' });
      candidates.push({ value: answer - 10, tag: 'borrow-from-nowhere' });
    } else {
      candidates.push({ value: a + b, tag: 'operator-mixup' });
      if (tens(b) === 0) {
        candidates.push({ value: (tens(a) - b) * 10 + ones(a), tag: 'column-alignment-shift' });
      }
      if (answer % 11 !== 0) {
        candidates.push({ value: swapDigits(answer), tag: 'digit-subtraction-isolation' });
      }
      candidates.push({ value: (tens(a) - tens(b)) * 10 + ones(a), tag: 'ones-subtraction-ignored' });
    }

    const distractors = selectDistractors({
      candidates,
      kind: 'sub',
      context: { a, b, answer },
      count: OPTION_COUNT - 1,
      rng,
    });

    // Shuffle the {value, tag} pairs together so misconceptions stay index-aligned with options.
    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);

    return {
      questionText: `${a} - ${b} = ?`,
      correctAnswer: answer,
      options: optionPairs.map((o) => o.value),
      format: 'mcq',
      misconceptions: optionPairs.map((o) => o.tag),
    };
  },
};

export default recipe;
