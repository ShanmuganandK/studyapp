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

const RUNS_PER_DIFFICULTY = 100;
const OPERATORS = new Set(['>', '<', '=']);

// Canonical misconception tags per skill, per misconceptions-reference.md (the source of
// truth — DECISIONS.md). A recipe may only emit tags from its skill's set; this is the drift
// guard that fails if a recipe invents or mistypes a tag, or strays from the doc.
const COUNTING_TAGS = ['double-count-object', 'skip-count-sequence', 'count-from-zero', 'random-slip'];
const SUBTRACTION_TAGS = ['operator-mixup', 'tens-ignored', 'smaller-from-larger-force', 'off-by-one', 'random-slip'];
const CANONICAL_TAGS = {
  'g1.add.within10': new Set(['operator-mixup', 'off-by-one', 'random-slip']),
  'g1.add.within20': new Set(['crossing-ten-misstep', 'add-tens-to-ones', 'operator-mixup', 'off-by-one', 'random-slip']),
  'g1.count.1-9': new Set(COUNTING_TAGS),
  'g1.count.1-20': new Set(COUNTING_TAGS),
  'g1.sub.within10': new Set(SUBTRACTION_TAGS),
  'g1.sub.within20': new Set(SUBTRACTION_TAGS),
  'g1.num.compare20': new Set(['alligator-confusion', 'ones-digit-bias', 'digit-length-bias']),
  'g2.num.compare999': new Set(['alligator-confusion', 'ones-digit-bias', 'digit-length-bias']),
  'g2.add.2d-nocarry': new Set(['column-alignment-shift', 'add-across-columns', 'operator-mixup', 'place-value-swap', 'random-slip']),
  'g2.add.2d-carry': new Set(['forgot-carry', 'write-full-sum-in-column', 'double-carry', 'carry-subtraction-instead', 'random-slip']),
  'g2.sub.2d-noborrow': new Set(['operator-mixup', 'column-alignment-shift', 'digit-subtraction-isolation', 'ones-subtraction-ignored', 'random-slip']),
  'g2.sub.2d-borrow': new Set(['smaller-from-larger-force', 'borrow-without-reducing-tens', 'regroup-ten-ones-shortchange', 'borrow-from-nowhere', 'random-slip']),
  'g2.mul.intro': new Set(['multiplication-as-addition', 'skip-count-misstep', 'multiplication-by-zero-identity', 'random-slip']),
  'g2.mul.table2': new Set(['skip-count-misstep', 'add-instead-of-multiply', 'multiplication-by-one-identity', 'zero-identity-error', 'random-slip']),
  'g2.mul.table5': new Set(['skip-count-misstep', 'add-instead-of-multiply', 'multiplication-by-one-identity', 'zero-identity-error', 'random-slip']),
  'g2.mul.table10': new Set(['skip-count-misstep', 'add-instead-of-multiply', 'multiplication-by-one-identity', 'zero-identity-error', 'random-slip']),
  'g2.num.3digit': new Set(['expanded-concatenation', 'zero-placeholder-ignored', 'digit-value-blindness', 'reverse-period-reading', 'random-slip']),
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
  if (skillId === 'g2.num.3digit') {
    const [h, t, o] = numbersIn(q.questionText);
    return h * 100 + t * 10 + o;
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

// Per-format option/value expectations.
const FORMAT_SPEC = {
  mcq: { count: 4, answerType: 'number', valueOk: (o) => typeof o === 'number' },
  'count-objects': { count: 4, answerType: 'number', valueOk: (o) => typeof o === 'number' },
  compare: { count: 3, answerType: 'string', valueOk: (o) => OPERATORS.has(o) },
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
  expect(typeof q.correctAnswer).toBe(spec.answerType);
  expect(q.options).toContain(q.correctAnswer);

  // 4. options has the expected count, no duplicates, right value type.
  expect(q.options).toHaveLength(spec.count);
  expect(new Set(q.options).size).toBe(q.options.length);
  q.options.forEach((o) => expect(spec.valueOk(o)).toBe(true));

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
  'g1.add.within10': { caps: { 1: 3, 2: 6, 3: 10 }, value: (q) => q.correctAnswer },
  'g1.add.within20': { caps: { 1: 5, 2: 10, 3: 20 }, value: (q) => q.correctAnswer },
  'g1.count.1-9': { caps: { 1: 3, 2: 6, 3: 9 }, value: (q) => q.correctAnswer },
  'g1.count.1-20': { caps: { 1: 5, 2: 10, 3: 20 }, value: (q) => q.correctAnswer },
  'g1.sub.within10': { caps: { 1: 5, 2: 8, 3: 10 }, value: (q) => numbersIn(q.questionText)[0] },
  'g1.sub.within20': { caps: { 1: 10, 2: 15, 3: 20 }, value: (q) => numbersIn(q.questionText)[0] },
  'g1.num.compare20': { caps: { 1: 20, 2: 20, 3: 20 }, value: (q) => Math.max(q.render.left, q.render.right) },
  'g2.num.compare999': { caps: { 1: 99, 2: 499, 3: 999 }, value: (q) => Math.max(q.render.left, q.render.right) },
  'g2.add.2d-nocarry': { caps: { 1: 39, 2: 69, 3: 99 }, value: (q) => q.correctAnswer },
  'g2.add.2d-carry': { caps: { 1: 49, 2: 79, 3: 99 }, value: (q) => q.correctAnswer },
  'g2.sub.2d-noborrow': { caps: { 1: 39, 2: 69, 3: 99 }, value: (q) => numbersIn(q.questionText)[0] },
  'g2.sub.2d-borrow': { caps: { 1: 49, 2: 79, 3: 99 }, value: (q) => numbersIn(q.questionText)[0] },
  'g2.mul.intro': { caps: { 1: 12, 2: 20 }, value: (q) => q.correctAnswer },
  'g2.mul.table2': { caps: { 1: 5, 2: 8, 3: 10 }, value: (q) => numbersIn(q.questionText)[1] },
  'g2.mul.table5': { caps: { 1: 5, 2: 8, 3: 10 }, value: (q) => numbersIn(q.questionText)[1] },
  'g2.mul.table10': { caps: { 1: 5, 2: 8, 3: 10 }, value: (q) => numbersIn(q.questionText)[1] },
  'g2.num.3digit': { caps: { 1: 199, 2: 599, 3: 999 }, value: (q) => q.correctAnswer },
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
};

function plausibilityContextFor(kind, q) {
  if (kind === 'place') return { answer: q.correctAnswer };
  const [a, b] = numbersIn(q.questionText);
  return { a, b, answer: q.correctAnswer };
}

// No skip for small answers here — the absolute tolerance floor in _plausibility.js means every
// answer, including 0 and 1, always has enough genuinely plausible nearby integers. Verified
// (not assumed): this guard used to skip questions with correctAnswer < 2 before the floor
// shipped, because "<=1 implausible" was mathematically impossible there; removing the skip and
// re-running confirmed it now passes unconditionally, on every generated question.
function validatePlausibility(recipe) {
  for (const skillId of skillIdsOf(recipe)) {
    const kind = PLAUSIBILITY_KIND[skillId];
    if (!kind) continue; // compare / count-objects: no monotonic rule defined, out of scope

    for (let difficulty = 1; difficulty <= recipe.maxDifficulty; difficulty++) {
      for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
        const rng = makeRng(`plausibility:${skillId}:${difficulty}:${run}`);
        const q = recipe.generate(difficulty, rng, skillId);

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
});
