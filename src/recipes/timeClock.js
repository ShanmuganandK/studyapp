/**
 * Recipe: reading the clock — hours, half-hours, quarters & elapsed time (Grade 2).
 * Serves g2.time.clock. Format `clock`.
 *
 * Upgraded for 8-question session variety & Grade 2 parity:
 *   - Rung 1: full hours (:00) and half-hours (:30) across 1..12 (24 clock faces).
 *   - Rung 2: half-hours (:30), quarter-past (:15), and quarter-to (:45) across 1..12 (36 clock faces).
 *   - Rung 3: elapsed time ("The clock shows H:MM. What time will it be D hours later?" for D in 1..3 -> 72 questions).
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md:
 *   - hand-size-reversal     : swaps hour and minute hands
 *   - hour-hand-proximity    : rounds hour up at :30 or :45 (4:30 -> 5:30)
 *   - minute-numeric-literal : reads clock numeral under minute hand literally (:12, :03, :06, :09)
 *   - half-hour-as-fifty     : reads half past as :50 instead of :30
 *   - off-by-one-hour        : hour ± 1
 */

const OPTION_COUNT = 4;

const pad2 = (n) => String(n).padStart(2, '0');
const fmtTime = (h, m) => `${h}:${pad2(m)}`;
const addHours = (h, d) => ((h - 1 + d + 12) % 12) + 1;
const nextHour = (h) => addHours(h, 1);
const prevHour = (h) => addHours(h, -1);

const MINUTE_NUMERAL = { 0: 12, 15: 3, 30: 6, 45: 9 };

const recipe = {
  skillId: 'g2.time.clock',
  maxDifficulty: 3,

  generate(difficulty, rng) {
    const hours = rng.int(1, 12);
    let minutes;
    let deltaHours = 0;

    if (difficulty === 1) {
      minutes = rng.int(0, 1) === 0 ? 0 : 30;
    } else if (difficulty === 2) {
      minutes = rng.pick([15, 30, 45]);
    } else {
      minutes = rng.int(0, 1) === 0 ? 0 : 30;
      deltaHours = rng.int(1, 3);
    }

    const targetHour = deltaHours > 0 ? addHours(hours, deltaHours) : hours;
    const answer = fmtTime(targetHour, minutes);
    const used = new Set([answer]);
    const distractors = [];

    const addCandidate = (value, tag) => {
      if (!used.has(value) && distractors.length < OPTION_COUNT - 1) {
        used.add(value);
        distractors.push({ value, tag });
      }
    };

    const numUnderMin = MINUTE_NUMERAL[minutes] ?? 12;

    if (deltaHours > 0) {
      // Elapsed time misconceptions: reading current time without adding, subtracting instead of adding, or off by 1 hour
      addCandidate(fmtTime(hours, minutes), 'off-by-one-hour');
      addCandidate(fmtTime(addHours(hours, -deltaHours), minutes), 'off-by-one-hour');
      addCandidate(fmtTime(nextHour(targetHour), minutes), 'off-by-one-hour');
      addCandidate(fmtTime(prevHour(targetHour), minutes), 'off-by-one-hour');
    } else {
      // 1. Hand-size reversal (guard: skip when both hands point to the same numeral)
      if (hours !== numUnderMin) {
        const swappedHour = numUnderMin;
        const swappedMin = (hours % 12) * 5;
        addCandidate(fmtTime(swappedHour, swappedMin), 'hand-size-reversal');
      }

      // 2. Half-hour / quarter-to specific misconceptions
      if (minutes === 30) {
        addCandidate(fmtTime(nextHour(hours), 30), 'hour-hand-proximity');
        addCandidate(fmtTime(hours, 50), 'half-hour-as-fifty');
      } else if (minutes === 45) {
        addCandidate(fmtTime(nextHour(hours), 45), 'hour-hand-proximity');
        addCandidate(fmtTime(hours, 15), 'off-by-one-hour');
      } else if (minutes === 15) {
        addCandidate(fmtTime(hours, 45), 'off-by-one-hour');
      }

      // 3. Minute numeric literal (:12, :03, :06, :09)
      addCandidate(fmtTime(hours, numUnderMin), 'minute-numeric-literal');

      // 4. Off-by-one-hour
      addCandidate(fmtTime(nextHour(hours), minutes), 'off-by-one-hour');
      addCandidate(fmtTime(prevHour(hours), minutes), 'off-by-one-hour');
    }

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);
    const shownStr = fmtTime(hours, minutes);
    const hourWord = deltaHours === 1 ? '1 hour' : `${deltaHours} hours`;

    return {
      questionText: deltaHours > 0
        ? `The clock shows ${shownStr}. What time will it be ${hourWord} later?`
        : `What time does the clock show? (${hours} hour hand, ${numUnderMin} minute hand)`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'clock',
      misconceptions: optionPairs.map((opt) => opt.tag),
      render: { hours, minutes, deltaHours, targetHour },
    };
  },
};

export default recipe;
