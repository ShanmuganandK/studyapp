/**
 * Distractor plausibility — a SELECTION helper, not a tag-rule helper. It never computes a
 * distractor's value (that stays in each recipe, per misconceptions-reference.md); it only
 * decides, among the candidates a recipe already built, which ones are worth spending an
 * option slot on.
 *
 * Background: a kid-test audit found that in several recipes, two of the three distractors
 * were routinely eliminable with no arithmetic at all, using one fact a child already has
 * (e.g. "a sum can't be smaller than either addend"), collapsing a 4-way MCQ into an
 * effective coin flip. The tag RULES were correct per the doc; the bug was letting more than
 * one implausible option compete with the correct answer in the same question.
 *
 * A distractor is implausible if EITHER:
 *   1. Monotonic violation — contradicts a fact about the operation that needs no arithmetic:
 *        add: value < max(a, b)              (a sum can't be smaller than either addend)
 *        sub: value > a (the minuend)          (a difference can't exceed what you started with)
 *        mul (both factors >= 2): value < max(a, b)
 *        place / count: no monotonic rule — magnitude ratio only.
 *   2. Magnitude ratio — value < answer / 2 or value > answer * 2.
 *
 * `operator-mixup` (and its analogues) are implausible on effectively every question by
 * construction — that is intentional content, not a bug (it catches the child who applies the
 * wrong operation, who isn't eliminating options by magnitude). So the rule is NOT "strip
 * implausible tags" — it's "at most ONE implausible distractor per question." Everything
 * beside it must be plausible.
 *
 * ABSOLUTE TOLERANCE FLOOR (added after the first fix shipped): the ratio rule was calibrated
 * for well-separated magnitudes (13 vs 58) and misfires at small answers — `3 - 3 = 0` flags
 * 1, 2 and 3 as all implausible, but no child eliminates "1" as a wrong answer to 3-3; it's a
 * genuinely tempting distractor. A value within `PLAUSIBLE_ABSOLUTE_TOLERANCE` of the answer is
 * plausible regardless of what the monotonic or ratio rule says — the floor OVERRIDES both,
 * deliberately. That override matters even at large operands: for `66 + 1 = 67`,
 * `operator-mixup` produces 65 (|66-1|) — the monotonic rule alone would call it implausible
 * (65 < max(66,1)=66), but 65 is two away from the correct answer and is exactly the option
 * that catches a child who read "+" as "-". Meanwhile `34 + 24 = 58` with operator-mixup
 * producing 10 is 48 away — well outside the floor — and stays correctly implausible.
 */
export const PLAUSIBLE_ABSOLUTE_TOLERANCE = 3;

/** True when `value` is implausible for this question under the rule above. */
export function isImplausible(kind, context, value) {
  const { a, b, answer } = context;

  if (Math.abs(value - answer) <= PLAUSIBLE_ABSOLUTE_TOLERANCE) return false;

  let monotonicViolation = false;

  if (kind === 'add') {
    monotonicViolation = value < Math.max(a, b);
  } else if (kind === 'sub') {
    // a is always the minuend, by convention of the caller — enforced, not just documented,
    // since a silently-swapped caller would otherwise misclassify every distractor with no
    // test failure (found across 7 call sites with no shared type to catch it structurally).
    if (a < b) {
      throw new Error(`isImplausible('sub', ...): context.a (${a}) must be the minuend (>= b, ${b})`);
    }
    monotonicViolation = value > a;
  } else if (kind === 'mul') {
    if (a >= 2 && b >= 2) monotonicViolation = value < Math.max(a, b);
  }
  // 'place' / 'count': no monotonic rule defined — ratio only.

  const ratioViolation = value < answer / 2 || value > answer * 2;
  return monotonicViolation || ratioViolation;
}

// Bounds the nearby-value fallback walk so it can never hang. Answers this small (a handful of
// integers wide) are the only case that can exhaust this many attempts before finding enough
// in-range values.
const MAX_FALLBACK_ATTEMPTS = 50;

/**
 * Selects `count` distractors from `candidates` ({value, tag} pairs, in the recipe's own
 * most-specific-first order — unchanged, this never touches how a value is COMPUTED).
 * `rng` is the recipe's own seeded RNG, threaded through only to break ties among implausible
 * candidates (see below) — generation stays fully deterministic per seed.
 *
 * Preference order: every plausible candidate the recipe already built, then AT MOST ONE
 * implausible one — picked AT RANDOM among however many are tied for the slot, not always the
 * first in array order (if only one implausible candidate exists, it's used directly; no rng
 * draw happens) — then a nearby-value walk from `answer` for any slots still short — itself
 * subject to the same one-implausible cap, so the fallback can't quietly reintroduce a second
 * bad option.
 *
 * Before the absolute tolerance floor, answers of 0 or 1 had NO integer satisfying the ratio
 * rule at all, so filling `count` slots could require exceeding the one-implausible cap as a
 * last resort. The floor removes that case entirely: `answer ± 1`, `± 2` and `± 3` are always
 * plausible now, regardless of the answer's magnitude, so the walk below always succeeds well
 * within `MAX_FALLBACK_ATTEMPTS`. Verified empirically (76,000 generated questions across every
 * skill/difficulty in the app, zero shortfalls) before removing the old uncapped last-resort
 * loop that used to guarantee this the hard way.
 */
export function selectDistractors({ candidates, kind, context, count, rng }) {
  const used = new Set([context.answer]);
  const plausible = [];
  const implausible = [];

  for (const c of candidates) {
    if (c.value < 0 || used.has(c.value)) continue;
    used.add(c.value);
    (isImplausible(kind, context, c.value) ? implausible : plausible).push(c);
  }

  const chosen = plausible.slice(0, count);
  if (chosen.length < count && implausible.length > 0) {
    // Random tiebreak among tied implausible candidates — NOT always index 0. With a fixed
    // index, whichever tag happened to be listed first in the recipe's candidate array would
    // win the one implausible slot on EVERY question forever, permanently starving every other
    // implausible-but-canonical tag (found live: operator-mixup on g2.add.2d-nocarry,
    // zero-placeholder-ignored on g2.num.3digit — both always-implausible, both always losing
    // to an earlier-listed candidate). Only draws when there's an actual choice to make, so a
    // single-candidate case doesn't consume an rng value for nothing.
    chosen.push(implausible.length > 1 ? rng.pick(implausible) : implausible[0]);
  }

  const hasImplausibleAlready = () => chosen.some((c) => isImplausible(kind, context, c.value));

  let offset = 1;
  let attempts = 0;
  while (chosen.length < count && attempts < MAX_FALLBACK_ATTEMPTS) {
    attempts++;
    const value = context.answer + offset;
    offset = offset > 0 ? -offset : -offset + 1; // walk +1,-1,+2,-2,...
    if (value < 0 || used.has(value)) continue;
    if (isImplausible(kind, context, value) && hasImplausibleAlready()) continue;
    used.add(value);
    chosen.push({ value, tag: 'random-slip' });
  }

  return chosen;
}
