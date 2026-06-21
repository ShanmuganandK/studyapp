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
import additionRecipe from '../addition';
import countingRecipe from '../counting';
import subtractionRecipe from '../subtraction';
import compareRecipe from '../compareNumbers';

const RUNS_PER_DIFFICULTY = 100;
const OPERATORS = new Set(['>', '<', '=']);

// Canonical misconception tags per skill, per misconceptions-reference.md (the source of
// truth — DECISIONS.md). A recipe may only emit tags from its skill's set; this is the drift
// guard that fails if a recipe invents or mistypes a tag, or strays from the doc.
const COUNTING_TAGS = ['double-count-object', 'skip-count-sequence', 'count-from-zero', 'random-slip'];
const SUBTRACTION_TAGS = ['operator-mixup', 'tens-ignored', 'smaller-from-larger-force', 'off-by-one', 'random-slip'];
const CANONICAL_TAGS = {
  'g1.add.within20': new Set(['crossing-ten-misstep', 'add-tens-to-ones', 'operator-mixup', 'off-by-one', 'random-slip']),
  'g1.count.1-9': new Set(COUNTING_TAGS),
  'g1.count.1-20': new Set(COUNTING_TAGS),
  'g1.sub.within10': new Set(SUBTRACTION_TAGS),
  'g1.sub.within20': new Set(SUBTRACTION_TAGS),
  'g1.num.compare20': new Set(['alligator-confusion', 'ones-digit-bias', 'digit-length-bias']),
};

const numbersIn = (text) => text.match(/\d+/g).map(Number);

/**
 * Independently re-derive the correct answer from the generated question so we test the MATH,
 * not the recipe's own arithmetic.
 */
function expectedAnswerFor(skillId, q) {
  if (skillId.startsWith('g1.add')) {
    const [a, b] = numbersIn(q.questionText);
    return a + b;
  }
  if (skillId.startsWith('g1.sub')) {
    const [a, b] = numbersIn(q.questionText);
    return a - b;
  }
  if (skillId.startsWith('g1.count')) {
    return q.render.count; // the set drawn for the child has exactly `correctAnswer` objects
  }
  if (skillId === 'g1.num.compare20') {
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
  'g1.add.within20': { caps: { 1: 5, 2: 10, 3: 20 }, value: (q) => q.correctAnswer },
  'g1.count.1-9': { caps: { 1: 3, 2: 6, 3: 9 }, value: (q) => q.correctAnswer },
  'g1.count.1-20': { caps: { 1: 5, 2: 10, 3: 20 }, value: (q) => q.correctAnswer },
  'g1.sub.within10': { caps: { 1: 5, 2: 8, 3: 10 }, value: (q) => numbersIn(q.questionText)[0] },
  'g1.sub.within20': { caps: { 1: 10, 2: 15, 3: 20 }, value: (q) => numbersIn(q.questionText)[0] },
  'g1.num.compare20': { caps: { 1: 20, 2: 20, 3: 20 }, value: (q) => Math.max(q.render.left, q.render.right) },
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

describe.each([
  ['addition (g1.add.within20)', additionRecipe],
  ['counting (g1.count.1-9, 1-20)', countingRecipe],
  ['subtraction (g1.sub.within10, within20)', subtractionRecipe],
  ['compareNumbers (g1.num.compare20)', compareRecipe],
])('recipe contract: %s', (_name, recipe) => {
  it('conforms to the recipe contract across all difficulties and skills', () => {
    validateRecipe(recipe);
  });

  it('respects the difficulty ceiling', () => {
    validateCeiling(recipe);
  });
});
