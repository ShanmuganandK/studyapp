/**
 * Recipe: numbers up to 999 (Grade 2). Serves g2.num.3digit. Format `mcq` — NOT
 * `count-objects` (drawing dozens of objects is unsuitable at this range, and the count-objects
 * render payload doesn't apply to a place-value question anyway).
 *
 * Question text spells out the place-value decomposition ("H hundreds, T tens and O ones make
 * ?") rather than a word-form numeral, so `correctAnswer` is re-derivable independently from
 * the digits in the text (RECIPE_TEMPLATE's own guidance) — the validator never has to trust
 * this recipe's own arithmetic.
 *
 * Distractors encode place-value misconceptions. Tags + rules are canonical per
 * misconceptions-reference.md ("Numbers up to 999") — the source of truth:
 *   - expanded-concatenation : wrote the hundreds digit as if it needed 3 zeros, not 2
 *                              (h*1000 + t*10 + o — condition: "has zero column", scoped to the
 *                              doc's own example, a zero TENS digit)
 *   - zero-placeholder-ignored : dropped the zero tens digit entirely, concatenating hundreds
 *                                straight onto ones (h*10 + o — same zero-tens condition)
 *   - digit-value-blindness  : returned a digit's face value instead of its place value (h,
 *                              always — this recipe's question always asks for "the value")
 *   - reverse-period-reading : reversed the three digits (o*100 + t*10 + h — guard: skip when
 *                              h === o, a palindrome like 353, per the doc's own guard)
 *
 * A zero tens digit is deliberately drawn more often than chance (ZERO_TENS_CHANCE) so the two
 * zero-column tags are genuinely reachable, not defined-but-dead content — this also matches
 * the CBSE curriculum's own emphasis on numbers like 309 as the tricky case.
 *
 * Distractor SELECTION (not the tag rules above, which are unchanged) goes through the shared
 * `selectDistractors` (`_plausibility.js`): at most one of the four options may be eliminable
 * without arithmetic. This recipe was the worst offender found in the kid-test plausibility
 * audit — whenever `t === 0`, three of the four candidates (`expanded-concatenation`,
 * `zero-placeholder-ignored`, `digit-value-blindness`) are ALWAYS wildly off (digit-length /
 * magnitude), leaving `reverse-period-reading` — which just reorders the same three digits, so
 * it's usually in-range — as the only genuinely plausible one. It was getting displaced because
 * it was listed last; the shared selector picks it regardless of list position now.
 */

import { selectDistractors } from './_plausibility';

const OPTION_COUNT = 4;
const ZERO_TENS_CHANCE = 40; // percent chance the tens digit is deliberately 0

// Curriculum ceiling per rung: largest possible value.
const VALUE_CAP = { 1: 199, 2: 599, 3: 999 };

/** Digits [h, t, o] for a value <= cap, h >= 1 (always a genuine 3-digit number). */
function buildDigits(rng, cap) {
  const maxH = Math.max(1, Math.floor(cap / 100));
  const h = rng.int(1, maxH);
  const maxRemainder = Math.min(99, cap - h * 100);
  const forceZeroTens = maxRemainder >= 9 && rng.int(0, 99) < ZERO_TENS_CHANCE;
  const remainder = forceZeroTens ? rng.int(0, 9) : rng.int(0, maxRemainder);
  return [h, Math.floor(remainder / 10), remainder % 10];
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const recipe = {
  skillId: 'g2.num.3digit',
  maxDifficulty: 3,

  generate(difficulty, rng) {
    const cap = VALUE_CAP[difficulty];
    const [h, t, o] = buildDigits(rng, cap);
    const answer = h * 100 + t * 10 + o;

    // Candidate wrong answers — tag rules unchanged, most-specific first. Selection (which of
    // these actually become options) is the shared plausibility-aware selector, not this order.
    const candidates = [];
    if (t === 0) {
      candidates.push({ value: h * 1000 + o, tag: 'expanded-concatenation' });
      candidates.push({ value: h * 10 + o, tag: 'zero-placeholder-ignored' });
    }
    candidates.push({ value: h, tag: 'digit-value-blindness' });
    if (h !== o) {
      candidates.push({ value: o * 100 + t * 10 + h, tag: 'reverse-period-reading' });
    }

    const distractors = selectDistractors({
      candidates,
      kind: 'place',
      context: { answer },
      count: OPTION_COUNT - 1,
    });

    // Shuffle the {value, tag} pairs together so misconceptions stay index-aligned with options.
    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);

    return {
      questionText: `${plural(h, 'hundred')}, ${plural(t, 'ten')} and ${plural(o, 'one')} make ?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
    };
  },
};

export default recipe;
