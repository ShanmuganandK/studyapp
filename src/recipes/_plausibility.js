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
 */

/** True when `value` is implausible for this question under the rule above. */
export function isImplausible(kind, context, value) {
  const { a, b, answer } = context;
  let monotonicViolation = false;

  if (kind === 'add') {
    monotonicViolation = value < Math.max(a, b);
  } else if (kind === 'sub') {
    monotonicViolation = value > a; // a is always the minuend, by convention of the caller
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
 *
 * Preference order: every plausible candidate the recipe already built, then AT MOST ONE
 * implausible one (the earliest/most-specific, if the plausible ones don't fill every slot),
 * then a nearby-value walk from `answer` for any slots still short — itself subject to the
 * same one-implausible cap, so the fallback can't quietly reintroduce a second bad option.
 *
 * Some answers (0, 1, and occasionally other very small values) have NO integer that satisfies
 * the ratio rule at all — every candidate is mathematically implausible. Rather than ever
 * return fewer than `count` distinct, non-negative options (the one invariant every recipe's
 * old private selector already guaranteed), the cap is relaxed only as an absolute last resort
 * once the fallback walk is exhausted. This is a real, reportable edge case — not something to
 * silently hide.
 */
export function selectDistractors({ candidates, kind, context, count }) {
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
    chosen.push(implausible[0]);
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

  // Last resort — should be unreachable for every skill's real ceilings except the documented
  // near-zero-answer edge case. Guarantees the invariant (a full option set) never breaks.
  offset = 1;
  while (chosen.length < count) {
    const value = context.answer + offset;
    offset = offset > 0 ? -offset : -offset + 1;
    if (value < 0 || used.has(value)) continue;
    used.add(value);
    chosen.push({ value, tag: 'random-slip' });
  }

  return chosen;
}
