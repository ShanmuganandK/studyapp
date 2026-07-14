import { describe, it, expect } from 'vitest';
import { makeAdultChallenge } from '../parentChallenge';

/**
 * The forgot-passcode recovery challenge (deterrent, not security). Pure + runtime-generated;
 * `rand` is injectable so we can assert ranges and determinism without touching Math.random.
 */
describe('makeAdultChallenge', () => {
  it('produces a two-digit × one-digit multiplication with answer = a*b', () => {
    // rand=0 → a=10, b=2
    const c = makeAdultChallenge(() => 0);
    expect(c).toEqual({ a: 10, b: 2, answer: 20, prompt: '10 × 2' });
  });

  it('caps at the top of both ranges (rand→~1)', () => {
    const c = makeAdultChallenge(() => 0.999999);
    expect(c.a).toBe(99); // 10 + floor(0.999999*90) = 99
    expect(c.b).toBe(9);  // 2 + floor(0.999999*8) = 9
    expect(c.answer).toBe(99 * 9);
  });

  it('a is always two-digit (10–99) and b one-digit (2–9), answer consistent, over many draws', () => {
    let seed = 0;
    const rand = () => { seed = (seed + 0.137) % 1; return seed; };
    for (let i = 0; i < 500; i++) {
      const { a, b, answer, prompt } = makeAdultChallenge(rand);
      expect(a).toBeGreaterThanOrEqual(10);
      expect(a).toBeLessThanOrEqual(99);
      expect(b).toBeGreaterThanOrEqual(2);
      expect(b).toBeLessThanOrEqual(9);
      expect(answer).toBe(a * b);
      expect(prompt).toBe(`${a} × ${b}`);
    }
  });

  it('defaults to Math.random when no rand is passed (still in range)', () => {
    const { a, b, answer } = makeAdultChallenge();
    expect(a).toBeGreaterThanOrEqual(10);
    expect(a).toBeLessThanOrEqual(99);
    expect(b).toBeGreaterThanOrEqual(2);
    expect(b).toBeLessThanOrEqual(9);
    expect(answer).toBe(a * b);
  });
});
