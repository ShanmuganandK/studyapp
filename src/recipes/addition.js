/**
 * Recipe: addition within 20 (Grade 1).
 *
 * One recipe = infinite questions. Conforms to the contract in RECIPE_TEMPLATE.md.
 * Difficulty is capped at the curriculum ceiling (sums to 5 / 10 / 20); a harder range
 * would be a DIFFERENT skill, not difficulty 4 here.
 *
 * Distractors deliberately encode known misconceptions so the remediation ladder can give
 * targeted hints and the parent dashboard can explain WHY a child struggles. Tags + rules
 * are canonical per misconceptions-reference.md ("Addition within 20"/"within 10") — the
 * source of truth:
 *   - crossing-ten-misstep : added the ones but dropped the carried ten   (sum - 10, when
 *                            the ones digits actually carry: ones(a)+ones(b) >= 10)
 *   - add-tens-to-ones     : for teen + single digit, added the single digit onto the tens
 *                            place instead of the ones   ((tens+c)*10 + ones; 13+6 -> 73)
 *   - operator-mixup       : subtracted instead of adding   (|a - b|)
 *   - off-by-one           : miscounted the final hop by one   (sum +/- 1)
 *   - random-slip          : doc-sanctioned nearby-value fill
 *
 * (forgot-carry is the doc's Grade-2 two-digit-carry tag; this Grade-1 skill uses
 * crossing-ten-misstep. identity-error-zero needs a 0 operand, which we never generate.)
 */

const OPTION_COUNT = 4;

// Curriculum ceiling per rung: easy/medium/hard cap the largest possible sum.
const SUM_CAP = { 1: 5, 2: 10, 3: 20 };

const ones = (n) => n % 10;
const tens = (n) => Math.floor(n / 10);
const isTeen = (n) => n >= 10 && n <= 19;
const isSingleDigit = (n) => n >= 1 && n <= 9;

/**
 * If this is a "teen + single-digit" addition, return which operand is the teen and which is
 * the single digit (order-independent); otherwise null. Used to gate add-tens-to-ones.
 */
function teenPlusSingle(a, b) {
  if (isTeen(a) && isSingleDigit(b)) return { teen: a, c: b };
  if (isTeen(b) && isSingleDigit(a)) return { teen: b, c: a };
  return null;
}

const recipe = {
  skillId: 'g1.add.within20',
  maxDifficulty: 3,

  generate(difficulty, rng) {
    const cap = SUM_CAP[difficulty];
    const a = rng.int(1, cap - 1);
    const b = rng.int(1, cap - a); // guarantees a + b <= cap
    const sum = a + b;

    // Candidate wrong answers, each tagged with the misconception it represents, ordered
    // most-specific first so random-slip is only ever a fallback.
    const candidates = [];

    // crossing-ten-misstep: dropped the carried ten — only when the ones actually carry.
    if (ones(a) + ones(b) >= 10) {
      candidates.push({ value: sum - 10, tag: 'crossing-ten-misstep' });
    }

    // add-tens-to-ones: for teen + single digit, the single digit was added onto the tens
    // place of the teen instead of its ones (12 + 5 -> 62).
    const teenSingle = teenPlusSingle(a, b);
    if (teenSingle) {
      const { teen, c } = teenSingle;
      candidates.push({ value: (tens(teen) + c) * 10 + ones(teen), tag: 'add-tens-to-ones' });
    }

    // operator-mixup: subtracted the addends instead of adding them.
    candidates.push({ value: Math.abs(a - b), tag: 'operator-mixup' });

    // off-by-one: miscounted the last hop (both directions are valid instances).
    candidates.push({ value: sum + 1, tag: 'off-by-one' });
    candidates.push({ value: sum - 1, tag: 'off-by-one' });

    // random-slip: safe nearby fillers.
    candidates.push({ value: sum + 2, tag: 'random-slip' });
    candidates.push({ value: sum - 2, tag: 'random-slip' });
    candidates.push({ value: sum + 3, tag: 'random-slip' });

    const distractors = pickDistinctDistractors(candidates, sum, rng);

    // Shuffle the {value, tag} pairs together so misconceptions stay index-aligned with
    // options after shuffling (the correct option carries a null tag).
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
  // Safety net: only fires for tiny sums where candidates collided.
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
