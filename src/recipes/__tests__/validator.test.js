/**
 * Shared recipe validator (STANDARDS §3).
 *
 * Runs every recipe's `generate()` 100× at each difficulty (1..maxDifficulty) for each skill
 * it serves, with a seeded RNG, and asserts the contract holds. A recipe that fails this does
 * not merge — the one gate every recipe (references AND replicas) must pass.
 *
 * A recipe serves one or more skills: single-skill recipes export `skillId`; multi-skill
 * recipes export `skillIds` and read the third `generate(difficulty, rng, skillId)` arg to
 * pick the range. The validator normalises both and drives generation per skill.
 *
 * The validator branches on `format`: numeric option formats (`mcq`, `count-objects`) carry
 * four numeric options; `compare` carries three operator-string options. New formats add
 * their own branch without breaking existing recipes.
 */

import { describe, it, expect } from 'vitest';
import { makeRng } from '../_rng';
import { isImplausible } from '../_plausibility';
import additionRecipe from '../addition';
import countingRecipe from '../counting';
import subtractionRecipe from '../subtraction';
import compareRecipe from '../compareNumbers';
import addition2dRecipe from '../addition2d';
import subtraction2dRecipe from '../subtraction2d';
import mulIntroRecipe from '../mulIntro';
import mulTableRecipe from '../mulTable';
import counting3digitRecipe from '../counting3digit';
import numbers21to99Recipe from '../numbers21to99';
import placeValueRecipe from '../placeValue';
import placeValue3Recipe from '../placeValue3';
import moneyAmountsRecipe from '../moneyAmounts';
import ordinalRecipe from '../ordinal';
import timeBasicRecipe from '../timeBasic';
import patternsRecipe from '../patterns';
import sortingRecipe from '../sorting';
import measureLengthRecipe from '../measureLength';
import comparePrenumRecipe from '../compare';
import shapes2dRecipe from '../shapes2d';
import spatialRecipe from '../spatial';
import measureWeightRecipe from '../measureWeight';
import moneyCoinsRecipe from '../moneyCoins';
import measureCapacityRecipe from '../measureCapacity';
import timeClockRecipe from '../timeClock';
import pictographRecipe from '../pictograph';
import fractionsBasicRecipe from '../fractionsBasic';

const RUNS_PER_DIFFICULTY = 100;
const OPERATORS = new Set(['>', '<', '=']);
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_PARTS = ['Morning', 'Noon', 'Afternoon', 'Evening', 'Night'];
const SORT_CATEGORIES = [
  new Set(['🍎', '🍌', '🍇', '🍉']),
  new Set(['🐶', '🐱', '🐰', '🐼']),
  new Set(['🚌', '🚲', '🚂', '✈️']),
  new Set(['✏️', '📚', '🖍️', '📏']),
];

// Canonical misconception tags per skill, per misconceptions-reference.md (the source of
// truth — DECISIONS.md). A recipe may only emit tags from its skill's set; this is the drift
// guard that fails if a recipe invents or mistypes a tag, or strays from the doc.
const COUNTING_TAGS = ['double-count-object', 'skip-count-sequence', 'count-from-zero', 'random-slip'];
const SUBTRACTION_TAGS = ['operator-mixup', 'tens-ignored', 'smaller-from-larger-force', 'off-by-one', 'random-slip'];
const CANONICAL_TAGS = {
  'g1.prenum.compare': new Set(['opposite-attribute-confusion', 'quantity-size-illusion', 'off-by-one', 'random-slip']),
  'g1.prenum.sort': new Set(['odd-one-out-inversion', 'surface-feature-distraction', 'random-slip']),
  'g1.prenum.patterns': new Set(['last-item-echo', 'ab-assumed-on-aab', 'first-item-restart', 'random-slip']),
  'g1.shapes.2d': new Set(['rotation-blindness', 'square-rectangle-confusion', 'side-corner-count-slip', 'curved-straight-mixup', 'random-slip']),
  'g1.shapes.space': new Set(['opposite-spatial-term', 'vertical-horizontal-confusion', 'reference-anchor-swap', 'random-slip']),
  'g1.add.within10': new Set(['operator-mixup', 'off-by-one', 'random-slip']),
  'g1.add.within20': new Set(['crossing-ten-misstep', 'add-tens-to-ones', 'operator-mixup', 'off-by-one', 'random-slip']),
  'g1.count.1-9': new Set(COUNTING_TAGS),
  'g1.count.1-20': new Set(COUNTING_TAGS),
  'g1.sub.within10': new Set(SUBTRACTION_TAGS),
  'g1.sub.within20': new Set(SUBTRACTION_TAGS),
  'g1.num.compare20': new Set(['alligator-confusion', 'ones-digit-bias', 'digit-length-bias']),
  'g1.num.ordinal': new Set(['cardinal-confusion', 'right-to-left-start', 'off-by-one', 'random-slip']),
  'g1.num.21-99': new Set(['decade-transition-stall', 'decade-ten-overshoot', 'before-instead-of-after', 'place-value-swap', 'off-by-one', 'random-slip']),
  'g1.place.tens-ones': new Set(['separate-digit-reading', 'digit-reversal', 'expanded-addition', 'tens-only-counted', 'random-slip']),
  'g1.measure.length': new Set(['count-marks-not-units', 'skip-count-sequence', 'operator-mixup', 'random-slip']),
  'g1.measure.weight': new Set(['up-pan-is-heavier', 'size-weight-illusion', 'opposite-attribute-confusion', 'off-by-one', 'random-slip']),
  'g1.time.daynight': new Set(['before-after-reversal', 'sequence-off-by-one', 'cycle-wrap-error', 'random-slip']),
  'g1.money.coins': new Set(['size-value-bias', 'coin-count-as-value', 'sum-as-concatenation', 'off-by-one', 'random-slip']),
  'g2.num.compare999': new Set(['alligator-confusion', 'ones-digit-bias', 'digit-length-bias']),
  'g2.add.2d-nocarry': new Set(['column-alignment-shift', 'add-across-columns', 'operator-mixup', 'place-value-swap', 'ones-addition-ignored', 'random-slip']),
  'g2.add.2d-carry': new Set(['forgot-carry', 'write-full-sum-in-column', 'double-carry', 'carry-subtraction-instead', 'random-slip']),
  'g2.sub.2d-noborrow': new Set(['operator-mixup', 'column-alignment-shift', 'digit-subtraction-isolation', 'ones-subtraction-ignored', 'random-slip']),
  'g2.sub.2d-borrow': new Set(['smaller-from-larger-force', 'borrow-without-reducing-tens', 'regroup-ten-ones-shortchange', 'borrow-from-nowhere', 'random-slip']),
  'g2.mul.intro': new Set(['multiplication-as-addition', 'skip-count-misstep', 'multiplication-by-zero-identity', 'random-slip']),
  'g2.mul.table2': new Set(['skip-count-misstep', 'add-instead-of-multiply', 'multiplication-by-one-identity', 'zero-identity-error', 'random-slip']),
  'g2.mul.table5': new Set(['skip-count-misstep', 'add-instead-of-multiply', 'multiplication-by-one-identity', 'zero-identity-error', 'random-slip']),
  'g2.mul.table10': new Set(['skip-count-misstep', 'add-instead-of-multiply', 'multiplication-by-one-identity', 'zero-identity-error', 'random-slip']),
  'g2.num.3digit': new Set(['expanded-concatenation', 'zero-placeholder-ignored', 'digit-value-blindness', 'reverse-period-reading', 'random-slip']),
  'g2.place.hundreds': new Set(['zero-placeholder-ignored', 'digit-value-blindness', 'reverse-period-reading', 'place-column-shift', 'random-slip']),
  'g2.measure.length-std': new Set(['ruler-one-start-error', 'end-mark-only-read', 'operator-mixup', 'off-by-one', 'random-slip']),
  'g2.measure.capacity': new Set(['container-count-confusion', 'tall-thin-illusion', 'operator-mixup', 'off-by-one', 'random-slip']),
  'g2.time.clock': new Set(['hand-size-reversal', 'hour-hand-proximity', 'minute-numeric-literal', 'half-hour-as-fifty', 'off-by-one-hour', 'random-slip']),
  'g2.money.amounts': new Set(['smaller-from-larger-force-money', 'ten-across-zero-borrow', 'operator-mixup', 'off-by-one', 'random-slip']),
  'g2.data.pictograph': new Set(['adjacent-row-read', 'total-instead-of-difference', 'scale-factor-ignored', 'off-by-one', 'random-slip']),
  'g2.frac.halves-quarters': new Set(['denominator-magnitude-bias', 'shaded-to-unshaded-ratio', 'unshaded-complement-picked', 'double-instead-of-half', 'random-slip']),
};

const numbersIn = (text) => text.match(/\d+/g).map(Number);

/**
 * Independently re-derive the correct answer from the generated question so we test the MATH,
 * not the recipe's own arithmetic.
 */
function expectedAnswerFor(skillId, q) {
  if (skillId.includes('.add.')) {
    const [a, b] = numbersIn(q.questionText);
    return a + b;
  }
  if (skillId.includes('.sub.')) {
    const [a, b] = numbersIn(q.questionText);
    return a - b;
  }
  if (skillId.includes('.mul.')) {
    const [a, b] = numbersIn(q.questionText);
    return a * b;
  }
  if (skillId === 'g1.num.ordinal') {
    const [leftPart, rightPart] = q.questionText.split(' in: ');
    const target = leftPart.replace('From the left, ', '').replace(' is at position ?', '');
    const items = rightPart.split(' ');
    return items.indexOf(target) + 1;
  }
  if (skillId === 'g1.time.daynight') {
    const isAfter = q.questionText.includes('AFTER ');
    const token = q.questionText.split(isAfter ? 'AFTER ' : 'BEFORE ')[1].replace('?', '');
    const seq = DAYS.includes(token) ? DAYS : DAY_PARTS;
    const idx = seq.indexOf(token);
    const dir = q.questionText.includes('2 days AFTER') ? 2 : isAfter ? 1 : -1;
    return seq[(idx + dir + seq.length) % seq.length];
  }
  if (skillId === 'g1.prenum.patterns') {
    const seq = q.questionText.replace('What comes next?  ', '').replace(' ?', '').split(' ');
    const isPeriod2 = seq.length >= 4 && seq[0] === seq[2] && seq[1] === seq[3];
    const period = isPeriod2 ? 2 : 3;
    return seq[seq.length % period];
  }
  if (skillId === 'g1.prenum.sort') {
    if (q.questionText.startsWith('Which one does NOT belong?')) {
      const items = q.questionText.replace('Which one does NOT belong?  ', '').split(' ');
      const mainCat = SORT_CATEGORIES.find((cat) => items.filter((x) => cat.has(x)).length === 3);
      return items.find((x) => !mainCat.has(x));
    }
    const group = q.questionText.replace('Which one belongs with ', '').replace('?', '').split(' ');
    const mainCat = SORT_CATEGORIES.find((cat) => group.every((x) => cat.has(x)));
    return q.options.find((opt) => mainCat.has(opt));
  }
  if (skillId === 'g1.measure.length') {
    if (q.format === 'unit-length') return q.render.count;
    const [a, b] = numbersIn(q.questionText);
    return a - b;
  }
  if (skillId === 'g2.measure.length-std') {
    const [a, b] = numbersIn(q.questionText);
    return q.questionText.includes('+') ? a + b : b - a;
  }
  if (skillId === 'g1.num.21-99') {
    const nums = numbersIn(q.questionText);
    return nums[nums.length - 1] + 1;
  }
  if (skillId === 'g1.place.tens-ones') {
    const [t, o] = numbersIn(q.questionText);
    return t * 10 + o;
  }
  if (skillId === 'g2.num.3digit') {
    const [h, t, o] = numbersIn(q.questionText);
    return h * 100 + t * 10 + o;
  }
  if (skillId === 'g2.place.hundreds') {
    return numbersIn(q.questionText).reduce((sum, n) => sum + n, 0);
  }
  if (skillId === 'g2.money.amounts') {
    const [a, b] = numbersIn(q.questionText);
    return q.questionText.includes('+') ? a + b : a - b;
  }
  if (skillId === 'g1.prenum.compare') {
    const [a, b] = numbersIn(q.questionText);
    return q.questionText.includes('MORE') ? Math.max(a, b) : Math.min(a, b);
  }
  if (skillId === 'g1.shapes.2d') {
    const s = q.render.shape;
    if (typeof q.correctAnswer === 'string') {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    return { circle: 0, triangle: 3, square: 4, rectangle: 4, pentagon: 5 }[s];
  }
  if (skillId === 'g1.shapes.space') {
    return q.render.relation;
  }
  if (skillId === 'g1.measure.weight') {
    if (q.render.unitCount) return q.render.unitCount;
    const heavyItem = q.render.heavier === 'left' ? q.render.leftItem : q.render.rightItem;
    const lightItem = q.render.heavier === 'left' ? q.render.rightItem : q.render.leftItem;
    return q.render.askLighter ? lightItem : heavyItem;
  }
  if (skillId === 'g1.money.coins') {
    return q.render.coins.reduce((sum, c) => sum + c, 0);
  }
  if (skillId === 'g2.measure.capacity') {
    const nums = numbersIn(q.questionText);
    if (q.questionText.startsWith('1 ')) {
      return nums[1] * nums[2];
    }
    return nums[0] - nums[1];
  }
  if (skillId === 'g2.time.clock') {
    const { hours, minutes, deltaHours = 0 } = q.render;
    const h = deltaHours > 0 ? ((hours - 1 + deltaHours + 12) % 12) + 1 : hours;
    return `${h}:${String(minutes).padStart(2, '0')}`;
  }
  if (skillId === 'g2.data.pictograph') {
    const { rows, scale } = q.render;
    if (q.questionText.includes('MORE')) {
      const matched = rows.filter((r) => q.questionText.includes(r.label));
      return Math.abs(matched[0].count - matched[1].count) * scale;
    }
    if (q.questionText.includes('ALTOGETHER')) {
      const matched = rows.filter((r) => q.questionText.includes(r.label));
      return (matched[0].count + matched[1].count) * scale;
    }
    const target = rows.find((r) => q.questionText.includes(r.label));
    return target.count * scale;
  }
  if (skillId === 'g2.frac.halves-quarters') {
    if (q.format === 'fraction-mcq') {
      const top = q.render.askUnshaded
        ? q.render.totalParts - q.render.shadedParts
        : q.render.shadedParts;
      return `${top}/${q.render.totalParts}`;
    }
    if (q.render.kind === 'fraction-whole') {
      return q.render.wholes * q.render.partsPerWhole;
    }
    return (q.render.total / (q.render.den ?? 2)) * (q.render.num ?? 1);
  }
  if (skillId.startsWith('g1.count')) {
    return q.render.count; // the set drawn for the child has exactly `correctAnswer` objects
  }
  if (skillId.startsWith('g1.num.compare') || skillId.startsWith('g2.num.compare')) {
    const { left, right } = q.render;
    return left > right ? '>' : left < right ? '<' : '=';
  }
  throw new Error(`No answer-checker for skill ${skillId}`);
}

const VALID_OPT = (o, q) =>
  typeof o === typeof q.correctAnswer && (typeof o === 'number' || o.length > 0);

// Per-format option/value expectations.
const FORMAT_SPEC = {
  mcq: { count: 4, answerTypes: ['number', 'string'], valueOk: VALID_OPT },
  'count-objects': { count: 4, answerTypes: ['number'], valueOk: (o) => typeof o === 'number' },
  'unit-length': { count: 4, answerTypes: ['number'], valueOk: (o) => typeof o === 'number' },
  'shape-mcq': { count: 4, answerTypes: ['number', 'string'], valueOk: VALID_OPT },
  'spatial-mcq': { count: 4, answerTypes: ['string'], valueOk: VALID_OPT },
  'balance-mcq': { count: 4, answerTypes: ['number', 'string'], valueOk: VALID_OPT },
  'coins-mcq': { count: 4, answerTypes: ['number'], valueOk: (o) => typeof o === 'number' },
  clock: { count: 4, answerTypes: ['string'], valueOk: VALID_OPT },
  pictograph: { count: 4, answerTypes: ['number'], valueOk: (o) => typeof o === 'number' },
  'fraction-mcq': { count: 4, answerTypes: ['string'], valueOk: VALID_OPT },
  compare: { count: 3, answerTypes: ['string'], valueOk: (o) => OPERATORS.has(o) },
};

function validateContractShape(q) {
  // 1. Core shape present and typed.
  expect(typeof q.questionText).toBe('string');
  expect(q.questionText.length).toBeGreaterThan(0);
  expect(typeof q.format).toBe('string');
  expect(Array.isArray(q.options)).toBe(true);
  expect(Array.isArray(q.misconceptions)).toBe(true);

  const spec = FORMAT_SPEC[q.format];
  expect(spec, `unknown format '${q.format}'`).toBeDefined();

  // 2. correctAnswer typed for the format and present in options.
  expect(spec.answerTypes).toContain(typeof q.correctAnswer);
  expect(q.options).toContain(q.correctAnswer);

  // 4. options has the expected count, no duplicates, right value type.
  expect(q.options).toHaveLength(spec.count);
  expect(new Set(q.options).size).toBe(q.options.length);
  q.options.forEach((o) => expect(spec.valueOk(o, q)).toBe(true));

  // 6. misconceptions align index-wise with options: same length, correct slot null, wrong
  //    slots non-empty kebab-case tags.
  expect(q.misconceptions).toHaveLength(q.options.length);
  q.options.forEach((opt, i) => {
    const tag = q.misconceptions[i];
    if (opt === q.correctAnswer) {
      expect(tag).toBeNull();
    } else {
      expect(typeof tag).toBe('string');
      expect(tag).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });
}

/** skillIds a recipe serves (normalises single- and multi-skill recipes). */
const skillIdsOf = (recipe) => recipe.skillIds ?? [recipe.skillId];

function validateRecipe(recipe) {
  expect(typeof recipe.maxDifficulty).toBe('number');
  expect(typeof recipe.generate).toBe('function');
  const ids = skillIdsOf(recipe);
  expect(ids.length).toBeGreaterThan(0);

  for (const skillId of ids) {
    const allowed = CANONICAL_TAGS[skillId];
    expect(allowed, `no canonical tag set for ${skillId}`).toBeDefined();

    for (let difficulty = 1; difficulty <= recipe.maxDifficulty; difficulty++) {
      for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
        const rng = makeRng(`${skillId}:${difficulty}:${run}`);
        const q = recipe.generate(difficulty, rng, skillId);

        validateContractShape(q);

        // 7. Canonical-tag guard: every non-null tag is in the skill's documented set.
        q.misconceptions
          .filter((tag) => tag !== null)
          .forEach((tag) => expect(allowed, `${skillId} emitted off-doc tag '${tag}'`).toContain(tag));

        // 3. correctAnswer is correct for the generated params.
        expect(q.correctAnswer).toBe(expectedAnswerFor(skillId, q));

        // count-objects render payload draws exactly the answer-many objects.
        if (q.format === 'count-objects') {
          expect(typeof q.render.glyph).toBe('string');
          expect(q.render.count).toBe(q.correctAnswer);
        }
      }
    }
  }
}

// 5. Difficulty respects the ceiling. `value(q)` extracts the magnitude that must stay capped
//    (the answer for add/count, the minuend for subtraction, the larger operand for compare).
const CEILINGS = {
  'g1.add.within10': { caps: { 1: 5, 2: 8, 3: 10 }, value: (q) => q.correctAnswer },
  'g1.add.within20': { caps: { 1: 5, 2: 10, 3: 20 }, value: (q) => q.correctAnswer },
  'g1.count.1-9': { caps: { 1: 5, 2: 7, 3: 9 }, value: (q) => q.correctAnswer },
  'g1.count.1-20': { caps: { 1: 5, 2: 10, 3: 20 }, value: (q) => q.correctAnswer },
  'g1.sub.within10': { caps: { 1: 5, 2: 8, 3: 10 }, value: (q) => numbersIn(q.questionText)[0] },
  'g1.sub.within20': { caps: { 1: 10, 2: 15, 3: 20 }, value: (q) => numbersIn(q.questionText)[0] },
  'g1.num.compare20': { caps: { 1: 20, 2: 20, 3: 20 }, value: (q) => Math.max(q.render.left, q.render.right) },
  'g2.num.compare999': { caps: { 1: 99, 2: 499, 3: 999 }, value: (q) => Math.max(q.render.left, q.render.right) },
  // Rungs are a strategy, not a magnitude cap (DECISIONS 2026-08-27) — one flat ceiling for all three.
  'g2.add.2d-nocarry': { caps: { 1: 99, 2: 99, 3: 99 }, value: (q) => q.correctAnswer },
  'g2.add.2d-carry': { caps: { 1: 49, 2: 79, 3: 99 }, value: (q) => q.correctAnswer },
  'g2.sub.2d-noborrow': { caps: { 1: 39, 2: 69, 3: 99 }, value: (q) => numbersIn(q.questionText)[0] },
  'g2.sub.2d-borrow': { caps: { 1: 49, 2: 79, 3: 99 }, value: (q) => numbersIn(q.questionText)[0] },
  'g2.mul.intro': { caps: { 1: 12, 2: 20 }, value: (q) => q.correctAnswer },
  'g2.mul.table2': { caps: { 1: 6, 2: 8, 3: 10 }, value: (q) => q.render?.multiplier ?? numbersIn(q.questionText)[1] },
  'g2.mul.table5': { caps: { 1: 6, 2: 8, 3: 10 }, value: (q) => q.render?.multiplier ?? numbersIn(q.questionText)[1] },
  'g2.mul.table10': { caps: { 1: 6, 2: 8, 3: 10 }, value: (q) => q.render?.multiplier ?? numbersIn(q.questionText)[1] },
  'g2.num.3digit': { caps: { 1: 199, 2: 599, 3: 999 }, value: (q) => q.correctAnswer },
  'g1.num.21-99': { caps: { 1: 50, 2: 80, 3: 99 }, value: (q) => q.correctAnswer },
  'g1.place.tens-ones': { caps: { 1: 39, 2: 69, 3: 99 }, value: (q) => q.correctAnswer },
  'g2.place.hundreds': { caps: { 1: 299, 2: 599, 3: 999 }, value: (q) => q.correctAnswer },
  'g2.money.amounts': { caps: { 1: 50, 2: 50, 3: 100 }, value: (q) => q.correctAnswer },
  'g1.num.ordinal': { caps: { 1: 5, 2: 10 }, value: (q) => q.correctAnswer },
  'g1.time.daynight': { caps: { 1: 4, 2: 4 }, value: (q) => q.options.length },
  'g1.prenum.patterns': { caps: { 1: 4, 2: 4 }, value: (q) => q.options.length },
  'g1.prenum.sort': { caps: { 1: 4, 2: 4 }, value: (q) => q.options.length },
  'g1.measure.length': {
    caps: { 1: 8, 2: 9, 3: 9 },
    value: (q) => (q.format === 'unit-length' ? q.render.count : numbersIn(q.questionText)[0]),
  },
  'g2.measure.length-std': { caps: { 1: 25, 2: 30, 3: 99 }, value: (q) => q.correctAnswer },
  'g1.prenum.compare': { caps: { 1: 8, 2: 8 }, value: (q) => Math.max(...numbersIn(q.questionText)) },
  'g1.shapes.2d': { caps: { 1: 4, 2: 4 }, value: (q) => q.options.length },
  'g1.shapes.space': { caps: { 1: 4, 2: 4 }, value: (q) => q.options.length },
  'g1.measure.weight': {
    caps: { 1: 4, 2: 9 },
    value: (q) => (typeof q.correctAnswer === 'number' ? q.correctAnswer : q.options.length),
  },
  'g1.money.coins': { caps: { 1: 12, 2: 30 }, value: (q) => q.correctAnswer },
  'g2.measure.capacity': { caps: { 1: 30, 2: 60 }, value: (q) => q.correctAnswer },
  'g2.time.clock': { caps: { 1: 12, 2: 12, 3: 12 }, value: (q) => q.render.hours },
  'g2.data.pictograph': { caps: { 1: 12, 2: 30 }, value: (q) => q.correctAnswer },
  'g2.frac.halves-quarters': {
    caps: { 1: 12, 2: 24 },
    value: (q) => (typeof q.correctAnswer === 'number' ? q.correctAnswer : q.render.totalParts),
  },
};

function validateCeiling(recipe) {
  for (const skillId of skillIdsOf(recipe)) {
    const { caps, value } = CEILINGS[skillId];
    for (let difficulty = 1; difficulty <= recipe.maxDifficulty; difficulty++) {
      for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
        const rng = makeRng(`ceiling:${skillId}:${difficulty}:${run}`);
        const q = recipe.generate(difficulty, rng, skillId);
        expect(value(q)).toBeLessThanOrEqual(caps[difficulty]);
      }
    }
  }
}

// Distractor-plausibility guard (kid-test audit fix). `kind` per skill, matching _plausibility.js's
// operation semantics; skills with no entry (compare, count-objects) have no numeric monotonic
// rule defined and are out of scope for this guard — see ARCHITECTURE.md/TRACKER.md.
const PLAUSIBILITY_KIND = {
  'g1.add.within10': 'add',
  'g1.add.within20': 'add',
  'g2.add.2d-nocarry': 'add',
  'g2.add.2d-carry': 'add',
  'g1.sub.within10': 'sub',
  'g1.sub.within20': 'sub',
  'g2.sub.2d-noborrow': 'sub',
  'g2.sub.2d-borrow': 'sub',
  'g2.mul.intro': 'mul',
  'g2.mul.table2': 'mul',
  'g2.mul.table5': 'mul',
  'g2.mul.table10': 'mul',
  'g2.num.3digit': 'place',
  'g1.num.21-99': 'place',
  'g1.place.tens-ones': 'place',
  'g2.place.hundreds': 'place',
  'g2.money.amounts': 'money',
  'g1.num.ordinal': 'place',
  'g1.measure.length': 'length-g1',
  'g2.measure.length-std': 'length-std',
};

function plausibilityContextFor(kind, q) {
  if (kind === 'place') return { answer: q.correctAnswer };
  const nums = numbersIn(q.questionText);
  if (q.questionText.startsWith('Starts at ')) {
    const [start, end] = nums;
    return { a: end, b: start, answer: q.correctAnswer };
  }
  const [a, b] = nums;
  return { a, b, answer: q.correctAnswer };
}

function resolvedKindFor(kind, q) {
  if (kind === 'money') {
    return q.questionText.includes('+') ? 'add' : 'sub';
  }
  if (kind === 'length-g1') {
    return q.format === 'unit-length' ? 'place' : 'sub';
  }
  if (kind === 'length-std') {
    if (q.questionText.includes('+')) return 'add';
    if (q.questionText.startsWith('Starts at 0 cm')) return 'place';
    return 'sub';
  }
  return kind;
}

// No skip for small answers here — the absolute tolerance floor in _plausibility.js means every
// answer, including 0 and 1, always has enough genuinely plausible nearby integers. Verified
// (not assumed): this guard used to skip questions with correctAnswer < 2 before the floor
// shipped, because "<=1 implausible" was mathematically impossible there; removing the skip and
// re-running confirmed it now passes unconditionally, on every generated question.
function validatePlausibility(recipe) {
  for (const skillId of skillIdsOf(recipe)) {
    const baseKind = PLAUSIBILITY_KIND[skillId];
    if (!baseKind) continue; // compare / count-objects: no monotonic rule defined, out of scope

    for (let difficulty = 1; difficulty <= recipe.maxDifficulty; difficulty++) {
      for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
        const rng = makeRng(`plausibility:${skillId}:${difficulty}:${run}`);
        const q = recipe.generate(difficulty, rng, skillId);

        const kind = resolvedKindFor(baseKind, q);
        const context = plausibilityContextFor(kind, q);
        const implausibleCount = q.options.filter(
          (opt) => opt !== q.correctAnswer && isImplausible(kind, context, opt),
        ).length;
        expect(
          implausibleCount,
          `${skillId} d${difficulty} has ${implausibleCount} implausible distractors (max 1): ${q.questionText} -> ${q.correctAnswer}, options=[${q.options}]`,
        ).toBeLessThanOrEqual(1);
      }
    }
  }
}

// Determinism: the same seed must produce the exact same question, every time — including
// after threading `rng` into selectDistractors for the implausible-candidate tiebreak (Change 2
// of the plausibility amendment). A random tiebreak that drew from Math.random() or any
// unseeded source would break this silently; this asserts it can't.
function validateDeterminism(recipe) {
  for (const skillId of skillIdsOf(recipe)) {
    for (let difficulty = 1; difficulty <= recipe.maxDifficulty; difficulty++) {
      const seed = `determinism:${skillId}:${difficulty}`;
      const q1 = recipe.generate(difficulty, makeRng(seed), skillId);
      const q2 = recipe.generate(difficulty, makeRng(seed), skillId);
      expect(q2).toEqual(q1);
    }
  }
}

// Guard against shallow 2–4 question loops (e.g., the old fractionsBasic Rung 1 only had 2
// questions for an 8-question session). Every skill and difficulty rung must generate at least
// 8 distinct question prompts over 80 draws so an 8-question session can always present variety.
function validateSessionVariety(recipe) {
  for (const skillId of skillIdsOf(recipe)) {
    for (let difficulty = 1; difficulty <= recipe.maxDifficulty; difficulty++) {
      const seen = new Set();
      for (let run = 0; run < 80; run++) {
        const q = recipe.generate(difficulty, makeRng(`variety:${skillId}:${difficulty}:${run}`), skillId);
        const key = q.format === 'count-objects'
          ? `${q.questionText}:${q.render.count}`
          : q.questionText;
        seen.add(key);
      }
      expect(
        seen.size,
        `${skillId} difficulty ${difficulty} only generated ${seen.size} distinct questions (need >= 8 for an 8-question session)`,
      ).toBeGreaterThanOrEqual(8);
    }
  }
}

describe.each([
  ['addition (g1.add.within10, within20)', additionRecipe],
  ['counting (g1.count.1-9, 1-20)', countingRecipe],
  ['subtraction (g1.sub.within10, within20)', subtractionRecipe],
  ['compareNumbers (g1.num.compare20, g2.num.compare999)', compareRecipe],
  ['addition2d (g2.add.2d-nocarry, g2.add.2d-carry)', addition2dRecipe],
  ['subtraction2d (g2.sub.2d-noborrow, g2.sub.2d-borrow)', subtraction2dRecipe],
  ['mulIntro (g2.mul.intro)', mulIntroRecipe],
  ['mulTable (g2.mul.table2, table5, table10)', mulTableRecipe],
  ['counting3digit (g2.num.3digit)', counting3digitRecipe],
  ['numbers21to99 (g1.num.21-99)', numbers21to99Recipe],
  ['placeValue (g1.place.tens-ones)', placeValueRecipe],
  ['placeValue3 (g2.place.hundreds)', placeValue3Recipe],
  ['moneyAmounts (g2.money.amounts)', moneyAmountsRecipe],
  ['ordinal (g1.num.ordinal)', ordinalRecipe],
  ['timeBasic (g1.time.daynight)', timeBasicRecipe],
  ['patterns (g1.prenum.patterns)', patternsRecipe],
  ['sorting (g1.prenum.sort)', sortingRecipe],
  ['measureLength (g1.measure.length, g2.measure.length-std)', measureLengthRecipe],
  ['compare (g1.prenum.compare)', comparePrenumRecipe],
  ['shapes2d (g1.shapes.2d)', shapes2dRecipe],
  ['spatial (g1.shapes.space)', spatialRecipe],
  ['measureWeight (g1.measure.weight)', measureWeightRecipe],
  ['moneyCoins (g1.money.coins)', moneyCoinsRecipe],
  ['measureCapacity (g2.measure.capacity)', measureCapacityRecipe],
  ['timeClock (g2.time.clock)', timeClockRecipe],
  ['pictograph (g2.data.pictograph)', pictographRecipe],
  ['fractionsBasic (g2.frac.halves-quarters)', fractionsBasicRecipe],
])('recipe contract: %s', (_name, recipe) => {
  it('conforms to the recipe contract across all difficulties and skills', () => {
    validateRecipe(recipe);
  });

  it('respects the difficulty ceiling', () => {
    validateCeiling(recipe);
  });

  it('has at most one implausible distractor per question', () => {
    validatePlausibility(recipe);
  });

  it('is deterministic — same seed produces the same question', () => {
    validateDeterminism(recipe);
  });

  it('generates at least 8 distinct questions per difficulty rung for an 8-question session', () => {
    validateSessionVariety(recipe);
  });
});
