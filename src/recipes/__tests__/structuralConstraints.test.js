/**
 * Structural guarantees for addition2d.js / subtraction2d.js (TRACKER Now #11, §7).
 *
 * "No-carry/no-borrow is structurally carry-/borrow-free" is a claim, not a preference — it's
 * what gives forgot-carry (and the borrow tags) a real condition to fire on, and what makes the
 * no-carry/carry pair actually two different skills. This asserts it as a TEST, not a comment:
 * no generated g2.add.2d-nocarry question may require a carry; no g2.sub.2d-noborrow question
 * may require a borrow; and the carry/borrow variants must ALWAYS require one.
 */

import { describe, it, expect } from 'vitest';
import { makeRng } from '../_rng';
import addition2d from '../addition2d';
import subtraction2d from '../subtraction2d';

const RUNS_PER_DIFFICULTY = 200;

const ones = (n) => n % 10;
const numbersIn = (text) => text.match(/\d+/g).map(Number);

describe('addition2d structural carry guarantee', () => {
  it('g2.add.2d-nocarry never requires a carry', () => {
    for (let difficulty = 1; difficulty <= addition2d.maxDifficulty; difficulty++) {
      for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
        const rng = makeRng(`nocarry-check:${difficulty}:${run}`);
        const q = addition2d.generate(difficulty, rng, 'g2.add.2d-nocarry');
        const [a, b] = numbersIn(q.questionText);
        expect(ones(a) + ones(b), `${q.questionText} requires a carry`).toBeLessThan(10);
      }
    }
  });

  it('g2.add.2d-carry always requires a carry', () => {
    for (let difficulty = 1; difficulty <= addition2d.maxDifficulty; difficulty++) {
      for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
        const rng = makeRng(`carry-check:${difficulty}:${run}`);
        const q = addition2d.generate(difficulty, rng, 'g2.add.2d-carry');
        const [a, b] = numbersIn(q.questionText);
        expect(ones(a) + ones(b), `${q.questionText} does not require a carry`).toBeGreaterThanOrEqual(10);
      }
    }
  });
});

describe('addition2d strategy rung shapes (DECISIONS 2026-08-27)', () => {
  it('rung 1 is always 2-digit + 1-digit', () => {
    for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
      const rng = makeRng(`rung1-shape:${run}`);
      const q = addition2d.generate(1, rng, 'g2.add.2d-nocarry');
      const [a, b] = numbersIn(q.questionText);
      expect(a, `${q.questionText} first operand is not 2-digit`).toBeGreaterThanOrEqual(10);
      expect(b, `${q.questionText} second operand is not 1-digit`).toBeGreaterThanOrEqual(1);
      expect(b, `${q.questionText} second operand is not 1-digit`).toBeLessThanOrEqual(9);
    }
  });

  it('rung 2 second operand is always a multiple of ten', () => {
    for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
      const rng = makeRng(`rung2-shape:${run}`);
      const q = addition2d.generate(2, rng, 'g2.add.2d-nocarry');
      const [a, b] = numbersIn(q.questionText);
      expect(a, `${q.questionText} first operand is not 2-digit`).toBeGreaterThanOrEqual(10);
      expect(b % 10, `${q.questionText} second operand is not a multiple of ten`).toBe(0);
    }
  });

  it('rung 3 is always 2-digit + 2-digit', () => {
    for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
      const rng = makeRng(`rung3-shape:${run}`);
      const q = addition2d.generate(3, rng, 'g2.add.2d-nocarry');
      const [a, b] = numbersIn(q.questionText);
      expect(a, `${q.questionText} first operand is not 2-digit`).toBeGreaterThanOrEqual(10);
      expect(b, `${q.questionText} second operand is not 2-digit`).toBeGreaterThanOrEqual(10);
    }
  });

  it('every rung stays inside the curriculum ceiling and never carries', () => {
    for (let difficulty = 1; difficulty <= addition2d.maxDifficulty; difficulty++) {
      for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
        const rng = makeRng(`rung-ceiling:${difficulty}:${run}`);
        const q = addition2d.generate(difficulty, rng, 'g2.add.2d-nocarry');
        expect(q.correctAnswer, `${q.questionText} exceeds the curriculum ceiling`).toBeLessThanOrEqual(99);
      }
    }
  });
});

describe('subtraction2d structural borrow guarantee', () => {
  it('g2.sub.2d-noborrow never requires a borrow', () => {
    for (let difficulty = 1; difficulty <= subtraction2d.maxDifficulty; difficulty++) {
      for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
        const rng = makeRng(`noborrow-check:${difficulty}:${run}`);
        const q = subtraction2d.generate(difficulty, rng, 'g2.sub.2d-noborrow');
        const [a, b] = numbersIn(q.questionText);
        expect(ones(a), `${q.questionText} requires a borrow`).toBeGreaterThanOrEqual(ones(b));
      }
    }
  });

  it('g2.sub.2d-borrow always requires a borrow', () => {
    for (let difficulty = 1; difficulty <= subtraction2d.maxDifficulty; difficulty++) {
      for (let run = 0; run < RUNS_PER_DIFFICULTY; run++) {
        const rng = makeRng(`borrow-check:${difficulty}:${run}`);
        const q = subtraction2d.generate(difficulty, rng, 'g2.sub.2d-borrow');
        const [a, b] = numbersIn(q.questionText);
        expect(ones(a), `${q.questionText} does not require a borrow`).toBeLessThan(ones(b));
      }
    }
  });
});
