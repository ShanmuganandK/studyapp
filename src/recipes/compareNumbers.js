/**
 * Recipe: compare numbers up to 20 (Grade 1). Serves g1.num.compare20.
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
 * options misconception-backed (contract: every wrong option carries a tag), we build pairs
 * where "=" is explainable: either the two numbers share their ones digit (-> ones-digit-bias
 * reads "=") or share their leading digit (-> digit-length-bias reads "="). The reverse
 * direction is always explained by alligator-confusion. Single-vs-single comparisons can't
 * back "=", so every pair includes a teen — matching the doc's "two-digit vs ..." conditions.
 */

const SKILL_ID = 'g1.num.compare20';

const recipe = {
  skillId: SKILL_ID,
  maxDifficulty: 3,

  generate(difficulty, rng, _skillId = SKILL_ID) {
    // Difficulty picks the pair shape:
    //   1 → teen vs its ones-digit single (shared ones; biggest, easiest gap)
    //   3 → teen vs teen (shared leading digit; closer, harder)
    //   2 → either
    const sharedLead = difficulty === 3 || (difficulty === 2 && rng.int(0, 1) === 1);

    let x;
    let y;
    let equalTag;
    if (sharedLead) {
      // Two distinct teens (10–19) — same leading digit (1).
      x = rng.int(10, 19);
      y = rng.int(10, 19);
      while (y === x) y = rng.int(10, 19);
      equalTag = 'digit-length-bias'; // same first digit → mis-read as "="
    } else {
      // A teen vs its own ones digit as a single number — same ones digit.
      const s = rng.int(1, 9);
      x = 10 + s;
      y = s;
      equalTag = 'ones-digit-bias'; // same ones digit → mis-read as "="
    }

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
