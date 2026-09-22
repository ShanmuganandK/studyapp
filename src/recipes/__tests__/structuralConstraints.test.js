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
import { isImplausible } from '../_plausibility';
import subtraction2d from '../subtraction2d';

const RUNS_PER_DIFFICULTY = 200;

const ones = (n) => n % 10;
const tens = (n) => Math.floor(n / 10);
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

describe('addition2d ones-addition-ignored (misconceptions-reference.md, no-carry, rung 3 only)', () => {
  const TAG = 'ones-addition-ignored';
  const NOCARRY = 'g2.add.2d-nocarry';
  const RUNS = 400;

  /** Generate RUNS questions for a rung, with their operands and the tagged option (if any). */
  function sample(difficulty, skillId = NOCARRY) {
    const out = [];
    for (let run = 0; run < RUNS; run++) {
      const q = addition2d.generate(difficulty, makeRng(`ones-ignored:${skillId}:${difficulty}:${run}`), skillId);
      const [a, b] = numbersIn(q.questionText);
      const idx = q.misconceptions.indexOf(TAG);
      out.push({ q, a, b, tagged: idx === -1 ? null : q.options[idx] });
    }
    return out;
  }

  it('its value is exactly (tens(a)+tens(b))*10 + ones(a), and never the correct answer', () => {
    let seen = 0;
    for (const { q, a, b, tagged } of sample(3)) {
      if (tagged === null) continue;
      seen++;
      expect(tagged, q.questionText).toBe((tens(a) + tens(b)) * 10 + ones(a));
      expect(tagged, q.questionText).not.toBe(q.correctAnswer);
    }
    expect(seen, 'the tag never appeared — this test would be vacuous').toBeGreaterThan(100);
  });

  it('collision guard: never emitted when ones(b) is 0 (it would equal the correct answer)', () => {
    let guarded = 0;
    for (const { q, b, tagged } of sample(3)) {
      if (ones(b) !== 0) continue;
      guarded++;
      expect(tagged, `${q.questionText} emitted the tag with ones(b) = 0`).toBeNull();
    }
    // Rung 3's second operand ranges 10-89ish, so ones(b) = 0 is a real, non-vacuous slice.
    expect(guarded, 'no ones(b) = 0 question was exercised — guard test is vacuous').toBeGreaterThan(10);
  });

  it('is NEVER implausible under _plausibility.js — it competes for plausible slots, not the one implausible slot', () => {
    // Value = sum - ones(b): within 9 of the answer, >= a >= max(a, b), and above answer / 2 —
    // so no check is needed in the recipe. Asserted so the claim in addition2d.js's comment is a
    // guard, not a comment.
    for (const { q, a, b, tagged } of sample(3)) {
      if (tagged === null) continue;
      expect(
        isImplausible('add', { a, b, answer: q.correctAnswer }, tagged),
        `${q.questionText}: ${tagged} is implausible`,
      ).toBe(false);
    }
  });

  it('not starved: present in EVERY rung-3 question where tens(b) !== 0 and ones(b) !== 0', () => {
    // Rung 3 has at most two plausible candidates (place-value-swap and this one), so the
    // three-slot plausible cut can never drop it. If a future candidate makes a third plausible
    // one possible ahead of it, this fails rather than the tag quietly disappearing.
    let available = 0;
    for (const { q, b, tagged } of sample(3)) {
      if (tens(b) === 0 || ones(b) === 0) continue;
      available++;
      expect(tagged, `${q.questionText} lost ${TAG} to another candidate`).not.toBeNull();
    }
    expect(available).toBeGreaterThan(100);
  });

  it('rung 1 (2-digit + 1-digit) never emits it — tens(b) is always 0', () => {
    for (const { q, tagged } of sample(1)) expect(tagged, q.questionText).toBeNull();
  });

  it('rung 2 (2-digit + a multiple of ten) never emits it — ones(b) is always 0', () => {
    for (const { q, tagged } of sample(2)) expect(tagged, q.questionText).toBeNull();
  });

  it('g2.add.2d-carry never emits it (no-carry only, per the doc)', () => {
    for (const difficulty of [1, 2, 3]) {
      for (const { q, tagged } of sample(difficulty, 'g2.add.2d-carry')) {
        expect(tagged, q.questionText).toBeNull();
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
