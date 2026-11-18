/**
 * Recipe: day/night, days of week, sequence (Grade 1). Serves g1.time.daynight. Format `mcq`
 * (string options).
 *
 * Upgraded to 30+ distinct questions across Rung 1 and Rung 2:
 *   - Rung 1: non-wrapping AFTER, non-wrapping BEFORE, and "If today is X, what day is TOMORROW?"
 *     across all 7 days of the week and 5 parts of the day.
 *   - Rung 2: cycle wrap-arounds (After Sunday -> Monday, Before Monday -> Sunday),
 *     "If today is X, what day was YESTERDAY?", and "What day comes 2 days AFTER X?".
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md:
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
    let dir; // +1 = AFTER/TOMORROW, -1 = BEFORE/YESTERDAY, +2 = 2 DAYS AFTER
    let style = 'direct'; // 'direct' | 'tomorrow' | 'yesterday' | 'two-after'

    if (difficulty === 1) {
      if (useDays && rng.int(0, 2) === 0) {
        style = 'tomorrow';
        dir = 1;
        idx = rng.int(0, len - 2);
      } else {
        dir = rng.int(0, 1) === 0 ? 1 : -1;
        idx = dir === 1 ? rng.int(0, len - 2) : rng.int(1, len - 1);
      }
    } else {
      const mode = useDays ? rng.pick(['direct', 'yesterday', 'two-after']) : 'direct';
      style = mode;
      if (mode === 'yesterday') {
        dir = -1;
        idx = rng.int(0, len - 1);
      } else if (mode === 'two-after') {
        dir = 2;
        idx = rng.int(0, len - 1);
      } else {
        dir = rng.int(0, 1) === 0 ? -1 : 1;
        idx = rng.int(0, len - 1);
      }
    }

    const current = seq[idx];
    const stepDir = dir === 2 ? 1 : dir;
    const answerIdx = (idx + dir + len) % len;
    const answer = seq[answerIdx];
    const isBoundary = (stepDir === 1 && idx >= len - Math.abs(dir)) || (stepDir === -1 && idx === 0);

    const used = new Set([answer, current]);
    const distractors = [];

    const addCandidate = (value, tag) => {
      if (!used.has(value) && distractors.length < OPTION_COUNT - 1) {
        used.add(value);
        distractors.push({ value, tag });
      }
    };

    // 1. Opposite direction (before vs after)
    const revIdx = (idx - dir + len * 2) % len;
    addCandidate(seq[revIdx], 'before-after-reversal');

    // 2. Off-by-one step in the asked direction
    const slipIdx = dir === 2 ? (idx + 1) % len : (idx + 2 * stepDir + len) % len;
    addCandidate(seq[slipIdx], 'sequence-off-by-one');

    // 3. Cycle-wrap error on boundary
    if (isBoundary) {
      const wrapErrIdx = stepDir === 1 ? len - 2 : 1;
      addCandidate(seq[wrapErrIdx], 'cycle-wrap-error');
    }

    for (let step = 1; distractors.length < OPTION_COUNT - 1 && step < len; step++) {
      const fallback = seq[(answerIdx + step) % len];
      addCandidate(fallback, isBoundary ? 'cycle-wrap-error' : 'random-slip');
    }

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
    const noun = useDays ? 'day' : 'time of day';

    let questionText;
    let directionLabel;
    if (style === 'tomorrow') {
      questionText = `If today is ${current}, what day is TOMORROW AFTER ${current}?`;
      directionLabel = 'tomorrow';
    } else if (style === 'yesterday') {
      questionText = `If today is ${current}, what day was YESTERDAY BEFORE ${current}?`;
      directionLabel = 'yesterday';
    } else if (style === 'two-after') {
      questionText = `What day comes 2 days AFTER ${current}?`;
      directionLabel = '2 days after';
    } else {
      const word = dir === 1 ? 'AFTER' : 'BEFORE';
      questionText = `What ${noun} comes right ${word} ${current}?`;
      directionLabel = dir === 1 ? 'after' : 'before';
    }

    return {
      questionText,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: { kind: 'time-sequence', current, direction: directionLabel, noun },
    };
  },
};

export default recipe;
