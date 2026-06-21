/**
 * Recipe: subtraction (Grade 1). Multi-skill — serves two ranges from one parameterised
 * recipe (per the skill map's recipe-reuse note):
 *   - g1.sub.within10  (minuend ≤ 10)
 *   - g1.sub.within20  (minuend ≤ 20)
 *
 * Structured parallel to addition.js. `generate(difficulty, rng, skillId)` selects the range.
 * Operands satisfy a ≥ b ≥ 0 (no negative answers for Grade 1), so the question reads
 * "a - b = ?".
 *
 * Distractors encode subtraction misconceptions. Tags + rules are canonical per
 * misconceptions-reference.md ("Subtraction within 10 / within 20") — the source of truth:
 *   - operator-mixup            : added instead of subtracting        (a + b, always)
 *   - tens-ignored              : teen minuend, kept only the ones,
 *                                 dropped the ten                     (ones(a) - b, when
 *                                 a is a teen and ones(a) >= b)
 *   - smaller-from-larger-force : borrow case — took |ones difference|
 *                                 in the ones column, kept the ten    (10*tens(a) +
 *                                 |ones(a) - b|, when a teen and ones(a) < b; e.g. 13-5 -> 12)
 *   - off-by-one                : miscounted the last hop             (answer +/- 1)
 *   - random-slip               : doc-sanctioned nearby-value fill
 *
 * (regroup-ignored is omitted: the doc's rule 10+(ones(a)-b) collapses to the correct answer
 *  for borrow problems — flagged for teacher review. smaller-from-larger-force covers the
 *  borrow ones-error instead. subtract-zero-error needs b==0, which we never generate.)
 */

const OPTION_COUNT = 4;

// Per-skill curriculum ceiling: largest minuend, per difficulty rung.
const MINUEND_CAP = {
  'g1.sub.within10': { 1: 5, 2: 8, 3: 10 },
  'g1.sub.within20': { 1: 10, 2: 15, 3: 20 },
};
const SKILL_IDS = ['g1.sub.within10', 'g1.sub.within20'];
const DEFAULT_SKILL = 'g1.sub.within20';

const ones = (n) => n % 10;
const tens = (n) => Math.floor(n / 10);
const isTeen = (n) => n >= 11 && n <= 19; // a teen has a ten that can be mishandled

const recipe = {
  skillIds: SKILL_IDS,
  maxDifficulty: 3,

  generate(difficulty, rng, skillId = DEFAULT_SKILL) {
    const cap = (MINUEND_CAP[skillId] ?? MINUEND_CAP[DEFAULT_SKILL])[difficulty];
    const a = rng.int(2, cap); // minuend
    const b = rng.int(1, a); // subtrahend ≤ a → answer ≥ 0
    const answer = a - b;

    // Candidate wrong answers, most-specific first so random-slip is only ever a fallback.
    const candidates = [];

    // tens-ignored: teen minuend, subtracted in the ones but threw away the ten (15-4 -> 1).
    if (isTeen(a) && ones(a) >= b) {
      candidates.push({ value: ones(a) - b, tag: 'tens-ignored' });
    }

    // smaller-from-larger-force: borrow case — couldn't do ones(a)-b, so took the absolute
    // ones difference and kept the ten (13-5 -> 10 + |3-5| = 12).
    if (isTeen(a) && ones(a) < b) {
      candidates.push({ value: 10 * tens(a) + Math.abs(ones(a) - b), tag: 'smaller-from-larger-force' });
    }

    // operator-mixup: added the two numbers instead of subtracting.
    candidates.push({ value: a + b, tag: 'operator-mixup' });

    // off-by-one: miscounted the last backward hop (both directions are valid instances).
    candidates.push({ value: answer + 1, tag: 'off-by-one' });
    candidates.push({ value: answer - 1, tag: 'off-by-one' });

    // random-slip: safe nearby fillers.
    candidates.push({ value: answer + 2, tag: 'random-slip' });
    candidates.push({ value: answer - 2, tag: 'random-slip' });
    candidates.push({ value: answer + 3, tag: 'random-slip' });

    const distractors = pickDistinctDistractors(candidates, answer, rng);

    // Shuffle {value, tag} pairs together so misconceptions stay index-aligned with options.
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

/**
 * Choose OPTION_COUNT-1 distinct, non-negative distractors (never equal to the answer).
 * Falls back to nearby slips if misconception-based candidates collide, so we always return
 * a full, valid option set.
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
