/**
 * Recipe: day/night, days of week, sequence (Grade 1). Serves g1.time.daynight. Format `mcq`
 * (string options).
 *
 * Rung 1 asks what comes right AFTER a day of the week (Monday..Saturday) or part of the day
 * (Morning, Afternoon, Evening).
 * Rung 2 asks what comes right BEFORE a day/part or tests cycle wrap-around (after Sunday ->
 * Monday, before Monday -> Sunday, after Night -> Morning).
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Time — day/night, days of week, sequence"):
 *   - before-after-reversal : steps in the opposite direction (before instead of after, or vice versa)
 *   - sequence-off-by-one   : skips one item in the asked direction
 *   - cycle-wrap-error      : fails wrap-around at the end/start of the cycle
 */

const OPTION_COUNT = 4;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_PARTS = ['Morning', 'Noon', 'Afternoon', 'Evening', 'Night'];

const recipe = {
  skillId: 'g1.time.daynight',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    const useDays = rng.int(0, 99) < 75;
    const seq = useDays ? DAYS : DAY_PARTS;
    const len = seq.length;

    let idx;
    let dir; // +1 = AFTER, -1 = BEFORE
    if (difficulty === 1) {
      dir = 1;
      idx = rng.int(0, len - 2); // non-wrapping AFTER
    } else {
      dir = rng.int(0, 1) === 0 ? -1 : 1;
      idx = rng.int(0, len - 1);
    }

    const current = seq[idx];
    const answerIdx = (idx + dir + len) % len;
    const answer = seq[answerIdx];
    const isBoundary = (dir === 1 && idx === len - 1) || (dir === -1 && idx === 0);

    const used = new Set([answer, current]);
    const distractors = [];

    const addCandidate = (value, tag) => {
      if (!used.has(value) && distractors.length < OPTION_COUNT - 1) {
        used.add(value);
        distractors.push({ value, tag });
      }
    };

    // 1. Opposite direction (before vs after)
    const revIdx = (idx - dir + len) % len;
    addCandidate(seq[revIdx], 'before-after-reversal');

    // 2. Skip one step in the asked direction
    const skipIdx = (idx + 2 * dir + len) % len;
    addCandidate(seq[skipIdx], 'sequence-off-by-one');

    // 3. Cycle-wrap error on boundary, or 2 steps in opposite direction
    if (isBoundary) {
      const wrapErrIdx = dir === 1 ? len - 2 : 1;
      addCandidate(seq[wrapErrIdx], 'cycle-wrap-error');
    }

    for (let step = 1; distractors.length < OPTION_COUNT - 1 && step < len; step++) {
      const fallback = seq[(answerIdx + step) % len];
      addCandidate(fallback, isBoundary ? 'cycle-wrap-error' : 'random-slip');
    }

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
    const word = dir === 1 ? 'AFTER' : 'BEFORE';
    const noun = useDays ? 'day' : 'time of day';

    return {
      questionText: `What ${noun} comes right ${word} ${current}?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
    };
  },
};

export default recipe;
