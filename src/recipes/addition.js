/**
 * Recipe: addition within 20 (Grade 1).
 *
 * One recipe = infinite questions. Conforms to the contract in RECIPE_TEMPLATE.md.
 * Difficulty is capped at the curriculum ceiling (sums to 5 / 10 / 20); a harder range
 * would be a DIFFERENT skill, not difficulty 4 here.
 *
 * Distractors deliberately encode known misconceptions so the remediation ladder can give
 * targeted hints and the parent dashboard can explain WHY a child struggles:
 *   - forgot-carry  : added the units but dropped the tens carry (7+8 -> 5, not 15)
 *   - counted-extra : counted one object too many (off by +1)
 *   - random-slip   : a plausible nearby slip (no specific misconception)
 */

const OPTION_COUNT = 4;

// Curriculum ceiling per rung: easy/medium/hard cap the largest possible sum.
const SUM_CAP = { 1: 5, 2: 10, 3: 20 };

const recipe = {
  skillId: 'g1.add.within20',
  maxDifficulty: 3,

  generate(difficulty, rng) {
    const cap = SUM_CAP[difficulty];
    const a = rng.int(1, cap - 1);
    const b = rng.int(1, cap - a); // guarantees a + b <= cap
    const sum = a + b;

    // Candidate wrong answers, each tagged with the misconception it represents.
    // forgot-carry only applies when the addition actually carries a ten.
    const candidates = [];
    if (sum >= 10) candidates.push({ value: sum - 10, tag: 'forgot-carry' });
    candidates.push({ value: sum + 1, tag: 'counted-extra' });
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
