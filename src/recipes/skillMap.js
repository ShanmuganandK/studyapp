/**
 * Skill map — the curriculum backbone for Grades 1–2 (see skill-map-spec.md).
 *
 * Pure data + small helpers, no UI/Firebase. Every skill is an atomic unit with a difficulty
 * ceiling, prerequisites, and the recipe that powers it. The session composer reads this map
 * + a child's mastery to decide what to teach; the recipe factory reads it to know which
 * recipes to build.
 *
 * `status`:
 *   - 'ready'   = a validated recipe file exists for this skill's range.
 *   - 'planned' = recipe still to be built (the map stays complete but honest).
 * Ready today (recipe files exist): addition (g1.add.within20), counting (g1.count.1-9,
 * g1.count.1-20), subtraction (g1.sub.within10, g1.sub.within20), and compareNumbers
 * (g1.num.compare20). Everything else is planned until the recipe factory fills it in.
 *
 * Recipe reuse — several skills share one parameterised recipe (the factory builds ONE recipe
 * that handles the range, not a file per skill):
 *   counting       → g1.count.1-9, g1.count.1-20, g1.num.21-99
 *   addition       → g1.add.within10, g1.add.within20
 *   subtraction    → g1.sub.within10, g1.sub.within20
 *   compareNumbers → g1.num.compare20, g2.num.compare999
 *   addition2d     → g2.add.2d-nocarry, g2.add.2d-carry
 *   subtraction2d  → g2.sub.2d-noborrow, g2.sub.2d-borrow
 *   mulTable       → g2.mul.table2, g2.mul.table5, g2.mul.table10
 *   measureLength  → g1.measure.length, g2.measure.length-std
 */

/** Mastery level (0–5) at or above which a skill counts as "mastered" for unlocking. */
export const MASTERY_THRESHOLD = 3;

const skill = (id, name, grade, strand, order, maxDifficulty, prereqs, recipe, status) => ({
  id,
  name,
  grade,
  strand,
  order,
  maxDifficulty,
  prereqs,
  recipe,
  status,
});

const ALL_SKILLS = [
  // ── Grade 1 ───────────────────────────────────────────────────────────────────────────
  skill('g1.prenum.compare', 'Big/small, more/less, tall/short', 1, 'prenumber', 10, 2, [], 'compare', 'planned'),
  skill('g1.prenum.sort', 'Sorting & classification', 1, 'prenumber', 11, 2, [], 'sorting', 'planned'),
  skill('g1.prenum.patterns', 'Simple patterns (AB, AAB)', 1, 'prenumber', 12, 2, [], 'patterns', 'planned'),
  skill('g1.shapes.2d', '2D shapes (circle, square, triangle, rectangle)', 1, 'shapes', 20, 2, [], 'shapes2d', 'planned'),
  skill('g1.shapes.space', 'Spatial: inside/outside, near/far, top/bottom', 1, 'shapes', 21, 2, [], 'spatial', 'planned'),
  skill('g1.count.1-9', 'Counting & numbers 1–9', 1, 'numbers', 30, 3, [], 'counting', 'ready'),
  skill('g1.count.1-20', 'Counting & numbers up to 20', 1, 'numbers', 31, 3, ['g1.count.1-9'], 'counting', 'ready'),
  skill('g1.num.compare20', 'Compare numbers up to 20 (>, <, =)', 1, 'numbers', 32, 3, ['g1.count.1-20'], 'compareNumbers', 'ready'),
  skill('g1.num.ordinal', 'Ordinal numbers (1st–10th)', 1, 'numbers', 33, 2, ['g1.count.1-9'], 'ordinal', 'planned'),
  skill('g1.add.within10', 'Addition within 10', 1, 'addition', 40, 3, ['g1.count.1-9'], 'addition', 'planned'),
  skill('g1.add.within20', 'Addition within 20', 1, 'addition', 41, 3, ['g1.add.within10'], 'addition', 'ready'),
  skill('g1.sub.within10', 'Subtraction within 10', 1, 'subtraction', 50, 3, ['g1.count.1-9'], 'subtraction', 'ready'),
  skill('g1.sub.within20', 'Subtraction within 20', 1, 'subtraction', 51, 3, ['g1.sub.within10'], 'subtraction', 'ready'),
  skill('g1.num.21-99', 'Numbers 21–99 (read, write, count)', 1, 'numbers', 60, 3, ['g1.count.1-20'], 'counting', 'planned'),
  skill('g1.place.tens-ones', 'Tens & ones (place value intro)', 1, 'placevalue', 61, 3, ['g1.num.21-99'], 'placeValue', 'planned'),
  skill('g1.measure.length', 'Length: longer/shorter, non-standard units', 1, 'measurement', 70, 2, ['g1.prenum.compare'], 'measureLength', 'planned'),
  skill('g1.measure.weight', 'Heavy/light', 1, 'measurement', 71, 2, ['g1.prenum.compare'], 'measureWeight', 'planned'),
  skill('g1.time.daynight', 'Day/night, days of week, sequence', 1, 'time', 80, 2, [], 'timeBasic', 'planned'),
  skill('g1.money.coins', 'Indian coins recognition (₹1, ₹2, ₹5, ₹10)', 1, 'money', 81, 2, ['g1.count.1-20'], 'moneyCoins', 'planned'),

  // ── Grade 2 ───────────────────────────────────────────────────────────────────────────
  skill('g2.num.3digit', 'Numbers up to 999 (read, write, place value)', 2, 'numbers', 100, 3, ['g1.place.tens-ones'], 'counting3digit', 'planned'),
  skill('g2.place.hundreds', 'Hundreds, tens, ones', 2, 'placevalue', 101, 3, ['g2.num.3digit'], 'placeValue3', 'planned'),
  skill('g2.num.compare999', 'Compare/order numbers to 999', 2, 'numbers', 102, 3, ['g2.num.3digit'], 'compareNumbers', 'planned'),
  skill('g2.add.2d-nocarry', '2-digit addition, no carry', 2, 'addition', 110, 3, ['g1.add.within20', 'g1.place.tens-ones'], 'addition2d', 'planned'),
  skill('g2.add.2d-carry', '2-digit addition with carry', 2, 'addition', 111, 3, ['g2.add.2d-nocarry'], 'addition2d', 'planned'),
  skill('g2.sub.2d-noborrow', '2-digit subtraction, no borrow', 2, 'subtraction', 120, 3, ['g1.sub.within20', 'g1.place.tens-ones'], 'subtraction2d', 'planned'),
  skill('g2.sub.2d-borrow', '2-digit subtraction with borrow', 2, 'subtraction', 121, 3, ['g2.sub.2d-noborrow'], 'subtraction2d', 'planned'),
  skill('g2.mul.intro', 'Multiplication as repeated addition', 2, 'multiplication', 130, 2, ['g1.add.within20'], 'mulIntro', 'planned'),
  skill('g2.mul.table2', 'Table of 2', 2, 'multiplication', 131, 3, ['g2.mul.intro'], 'mulTable', 'planned'),
  skill('g2.mul.table5', 'Table of 5', 2, 'multiplication', 132, 3, ['g2.mul.intro'], 'mulTable', 'planned'),
  skill('g2.mul.table10', 'Table of 10', 2, 'multiplication', 133, 3, ['g2.mul.intro'], 'mulTable', 'planned'),
  skill('g2.measure.length-std', 'Length in standard units (cm, m)', 2, 'measurement', 140, 3, ['g1.measure.length'], 'measureLength', 'planned'),
  skill('g2.measure.capacity', 'Capacity (litres)', 2, 'measurement', 141, 2, ['g1.prenum.compare'], 'measureCapacity', 'planned'),
  skill('g2.time.clock', 'Reading clock (hour, half-hour)', 2, 'time', 150, 3, ['g1.time.daynight'], 'timeClock', 'planned'),
  skill('g2.money.amounts', 'Money: making amounts, simple change', 2, 'money', 160, 3, ['g1.money.coins', 'g2.add.2d-carry'], 'moneyAmounts', 'planned'),
  skill('g2.data.pictograph', 'Data handling: simple pictographs', 2, 'data', 170, 2, ['g1.count.1-20'], 'pictograph', 'planned'),
];

/** SKILLS keyed by skillId. */
export const SKILLS = Object.fromEntries(ALL_SKILLS.map((s) => [s.id, s]));

const byGradeThenOrder = (a, b) => a.grade - b.grade || a.order - b.order;

/** Whether a single skill counts as mastered (level ≥ threshold). */
const isMastered = (id, masteryMap) => (masteryMap?.[id] ?? 0) >= MASTERY_THRESHOLD;

/** Look up a skill by id, or throw if it doesn't exist. */
export function getSkill(id) {
  const found = SKILLS[id];
  if (!found) throw new Error(`Unknown skillId: ${id}`);
  return found;
}

/** True if every prerequisite of `id` is mastered (vacuously true when there are none). */
export function prereqsMet(id, masteryMap) {
  return getSkill(id).prereqs.every((p) => isMastered(p, masteryMap));
}

/**
 * Skills whose prereqs are met and which are not yet mastered, sorted by grade then order.
 * NOTE: this is curriculum unlocking only — it does NOT filter by `status`. Callers that
 * actually serve content (session composer / UI) must additionally require `status:'ready'`,
 * since a `planned` skill has no recipe yet (skill-map-spec.md).
 */
export function unlockedSkills(masteryMap) {
  return Object.values(SKILLS)
    .filter((s) => !isMastered(s.id, masteryMap) && prereqsMet(s.id, masteryMap))
    .sort(byGradeThenOrder);
}

/**
 * The lowest-order unlocked, not-yet-mastered skill for a grade (the curriculum frontier),
 * or null if none. Same status caveat as `unlockedSkills`.
 */
export function frontierSkill(masteryMap, grade) {
  return unlockedSkills(masteryMap).find((s) => s.grade === grade) ?? null;
}

/** Skills that list `id` as a prerequisite (for "what's next" UI), sorted by order. */
export function nextSkills(id) {
  return Object.values(SKILLS)
    .filter((s) => s.prereqs.includes(id))
    .sort(byGradeThenOrder);
}
