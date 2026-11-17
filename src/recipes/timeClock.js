/**
 * Recipe: reading the clock — hour and half-hour (Grade 2).
 * Serves g2.time.clock. Format `clock`.
 *
 * Rung 1: full hours only (1:00 to 12:00).
 * Rung 2: half-hours (1:30 to 12:30).
 * Rung 3: mixed hours and half-hours, or 1 hour later.
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Time — reading the clock"):
 *   - hand-size-reversal     : swaps hour and minute hands (guard: skip 12:00 and 6:30)
 *   - hour-hand-proximity    : rounds hour up at :30 (4:30 -> 5:30)
 *   - minute-numeric-literal : reads clock numeral under minute hand literally (:12 or :06)
 *   - half-hour-as-fifty     : reads half past as :50 instead of :30
 *   - off-by-one-hour        : hour ± 1
 */

const OPTION_COUNT = 4;

const pad2 = (n) => String(n).padStart(2, '0');
const fmtTime = (h, m) => `${h}:${pad2(m)}`;
const nextHour = (h) => (h % 12) + 1;
const prevHour = (h) => ((h + 10) % 12) + 1;

const recipe = {
  skillId: 'g2.time.clock',
  maxDifficulty: 3,

  generate(difficulty, rng) {
    const hours = rng.int(1, 12);
    let minutes;
    if (difficulty === 1) {
      minutes = 0;
    } else if (difficulty === 2) {
      minutes = 30;
    } else {
      minutes = rng.int(0, 1) === 0 ? 0 : 30;
    }

    const answer = fmtTime(hours, minutes);
    const used = new Set([answer]);
    const distractors = [];

    const addCandidate = (value, tag) => {
      if (!used.has(value) && distractors.length < OPTION_COUNT - 1) {
        used.add(value);
        distractors.push({ value, tag });
      }
    };

    // 1. Hand-size reversal (guard: skip 12:00 and 6:30 where hands point to the same numeral)
    if (!(hours === 12 && minutes === 0) && !(hours === 6 && minutes === 30)) {
      const swappedHour = minutes === 0 ? 12 : 6;
      const swappedMin = (hours % 12) * 5;
      addCandidate(fmtTime(swappedHour, swappedMin), 'hand-size-reversal');
    }

    // 2. Half-hour specific misconceptions
    if (minutes === 30) {
      addCandidate(fmtTime(nextHour(hours), 30), 'hour-hand-proximity');
      addCandidate(fmtTime(hours, 50), 'half-hour-as-fifty');
    }

    // 3. Minute numeric literal (12 for :00, 06 for :30)
    addCandidate(fmtTime(hours, minutes === 0 ? 12 : 6), 'minute-numeric-literal');

    // 4. Off-by-one-hour
    addCandidate(fmtTime(nextHour(hours), minutes), 'off-by-one-hour');
    addCandidate(fmtTime(prevHour(hours), minutes), 'off-by-one-hour');

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);

    return {
      questionText: `What time does the clock show? (${hours} hour hand, ${minutes === 0 ? '12' : '6'} minute hand)`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'clock',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: { hours, minutes },
    };
  },
};

export default recipe;
