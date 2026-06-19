/**
 * Shared recipe validator (STANDARDS §3).
 *
 * Runs any recipe `generate()` 100× at each difficulty (1..maxDifficulty) with a seeded RNG
 * and asserts the contract holds. A recipe that fails this does not merge — this is the one
 * gate every recipe (Claude's references AND Antigravity's ~36 replicas) must pass.
 *
 * The validator branches on `format`: the core contract (keys 1–6 below) applies to every
 * option-based format shipping today (`mcq`, `count-objects`); format-specific extras are
 * checked per format. New formats (e.g. `text-input`) can add their own branch without
 * breaking existing recipes.
 */

import { describe, it, expect } from 'vitest';
import { makeRng } from '../_rng';
import additionRecipe from '../addition';
import countingRecipe from '../counting';

const RUNS_PER_DIFFICULTY = 100;
const EXPECTED_OPTION_COUNT = 4;

// Formats that present a fixed set of options + index-aligned misconceptions.
const OPTION_BASED_FORMATS = new Set(['mcq', 'count-objects']);

/**
 * Independently re-derive the correct answer from the generated question so we test the
 * MATH, not the recipe's own arithmetic.
 */
function expectedAnswerFor(skillId, q) {
  if (skillId === 'g1.add.within20') {
    const [a, b] = q.questionText.match(/\d+/g).map(Number);
    return a + b;
  }
  if (skillId === 'g1.count.1-20') {
    // The set drawn for the child has exactly `correctAnswer` objects.
    return q.render.count;
  }
  throw new Error(`No answer-checker for skill ${skillId}`);
}

function validateContractShape(q) {
  // 1. Core shape: exactly the required keys present and correctly typed.
  expect(typeof q.questionText).toBe('string');
  expect(q.questionText.length).toBeGreaterThan(0);
  expect(typeof q.correctAnswer).toBe('number');
  expect(Array.isArray(q.options)).toBe(true);
  expect(typeof q.format).toBe('string');
  expect(Array.isArray(q.misconceptions)).toBe(true);

  if (OPTION_BASED_FORMATS.has(q.format)) {
    // 2. correctAnswer is present in options.
    expect(q.options).toContain(q.correctAnswer);

    // 4. options has the expected count and no duplicates.
    expect(q.options).toHaveLength(EXPECTED_OPTION_COUNT);
    expect(new Set(q.options).size).toBe(q.options.length);
    q.options.forEach((o) => expect(typeof o).toBe('number'));

    // 6. misconceptions align index-wise with options: same length, correct slot null,
    //    wrong slots are non-empty kebab-case tags.
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
}

/** The reusable validator any recipe test can call. */
function validateRecipe(recipe) {
  // Structural sanity on the recipe object itself.
  expect(typeof recipe.skillId).toBe('string');
  expect(typeof recipe.maxDifficulty).toBe('number');
  expect(typeof recipe.generate).toBe('function');

  for (let difficulty = 1; difficulty <= recipe.maxDifficulty; difficulty++) {
    for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
      // Distinct, reproducible seed per (difficulty, run).
      const rng = makeRng(`${recipe.skillId}:${difficulty}:${run}`);
      const q = recipe.generate(difficulty, rng);

      validateContractShape(q);

      // 3. correctAnswer is mathematically correct for the generated params.
      expect(q.correctAnswer).toBe(expectedAnswerFor(recipe.skillId, q));

      // count-objects render payload: draws exactly the answer-many objects.
      if (q.format === 'count-objects') {
        expect(typeof q.render.glyph).toBe('string');
        expect(q.render.count).toBe(q.correctAnswer);
      }
    }
  }
}

// 5. Difficulty respects the ceiling: answers never exceed the per-rung curriculum cap.
const CEILINGS = {
  'g1.add.within20': { 1: 5, 2: 10, 3: 20 },
  'g1.count.1-20': { 1: 5, 2: 10, 3: 20 },
};

function validateCeiling(recipe) {
  const caps = CEILINGS[recipe.skillId];
  for (let difficulty = 1; difficulty <= recipe.maxDifficulty; difficulty++) {
    for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
      const rng = makeRng(`ceiling:${recipe.skillId}:${difficulty}:${run}`);
      const q = recipe.generate(difficulty, rng);
      expect(q.correctAnswer).toBeLessThanOrEqual(caps[difficulty]);
    }
  }
}

describe.each([
  ['addition (g1.add.within20)', additionRecipe],
  ['counting (g1.count.1-20)', countingRecipe],
])('recipe contract: %s', (_name, recipe) => {
  it('conforms to the recipe contract across all difficulties', () => {
    validateRecipe(recipe);
  });

  it('respects the difficulty ceiling', () => {
    validateCeiling(recipe);
  });
});
