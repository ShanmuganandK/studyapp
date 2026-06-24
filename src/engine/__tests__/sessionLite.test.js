import { describe, it, expect } from 'vitest';
import { makeRng } from '../../recipes/_rng';
import { SKILLS } from '../../recipes/skillMap';
import {
  buildLiteSession,
  rampDifficulty,
  readySkills,
  signatureOf,
  generateWithRepeatAvoidance,
  REPEAT_GAP,
} from '../sessionLite';

const READY_G1 = Object.values(SKILLS).filter((s) => s.status === 'ready' && s.grade === 1);

/** True if no signature repeats within any window of `gap` consecutive items. */
function noRepeatWithinGap(sigs, gap) {
  for (let i = 0; i < sigs.length; i++) {
    for (let j = Math.max(0, i - gap); j < i; j++) {
      if (sigs[j] === sigs[i]) return false;
    }
  }
  return true;
}

describe('rampDifficulty', () => {
  it('ramps 1 → 2 → 3 across the session, clamped to the ceiling', () => {
    const len = 9;
    expect(rampDifficulty(0, len, 3)).toBe(1);
    expect(rampDifficulty(3, len, 3)).toBe(2);
    expect(rampDifficulty(8, len, 3)).toBe(3);
    // clamp: a maxDifficulty-2 skill never exceeds 2
    expect(rampDifficulty(8, len, 2)).toBe(2);
  });
});

describe('buildLiteSession', () => {
  it('only ever serves ready skills', () => {
    for (let seed = 0; seed < 50; seed++) {
      const { skillId } = buildLiteSession(1, makeRng(`s${seed}`));
      expect(SKILLS[skillId].status).toBe('ready');
    }
  });

  it('returns the requested number of questions', () => {
    const { questions } = buildLiteSession(1, makeRng('len'), { length: 8 });
    expect(questions).toHaveLength(8);
  });

  it('respects each skill ceiling and produces contract-shaped, ramped questions', () => {
    for (const skill of READY_G1) {
      const { skillId, questions } = buildLiteSession(1, makeRng(`c:${skill.id}`), {
        length: 9,
        skillId: skill.id,
      });
      expect(skillId).toBe(skill.id);
      questions.forEach((q, i) => {
        // ramp annotation present and within the skill's ceiling
        expect(q.difficulty).toBe(rampDifficulty(i, 9, skill.maxDifficulty));
        expect(q.difficulty).toBeLessThanOrEqual(skill.maxDifficulty);
        // contract shape
        expect(typeof q.questionText).toBe('string');
        expect(q.options).toContain(q.correctAnswer);
        expect(q.misconceptions).toHaveLength(q.options.length);
        expect(typeof q.format).toBe('string');
      });
    }
  });

  it('falls back to all ready skills when a grade has none ready', () => {
    // Grade 2 currently has no ready skills → should still return a (grade-1) ready skill.
    const { skillId } = buildLiteSession(2, makeRng('g2'));
    expect(SKILLS[skillId].status).toBe('ready');
  });

  it('readySkills returns only ready skills for the grade', () => {
    readySkills(1).forEach((s) => expect(s.status).toBe('ready'));
  });

  it('completes the smallest real pool (counting 1-9, diff-1 pool = 3) without hanging', () => {
    const { questions } = buildLiteSession(1, makeRng('tiny-real'), {
      skillId: 'g1.count.1-9',
      length: 8,
    });
    expect(questions).toHaveLength(8); // completes ⇒ no hang on a tiny pool
  });
});

describe('signatureOf — repeat identity', () => {
  it('treats commuted addition operands as the same (1+4 ≡ 4+1)', () => {
    expect(signatureOf({ questionText: '1 + 4 = ?' }, 'add')).toBe(
      signatureOf({ questionText: '4 + 1 = ?' }, 'add'),
    );
  });

  it('treats same-answer, different-operand additions as different (1+4 ≠ 2+3)', () => {
    expect(signatureOf({ questionText: '1 + 4 = ?' }, 'add')).not.toBe(
      signatureOf({ questionText: '2 + 3 = ?' }, 'add'),
    );
  });

  it('treats subtraction as ordered (5−1 ≠ 1−5)', () => {
    expect(signatureOf({ questionText: '5 - 1 = ?' }, 'sub')).not.toBe(
      signatureOf({ questionText: '1 - 5 = ?' }, 'sub'),
    );
  });

  it('treats commuted compare pairs as the same (15?5 ≡ 5?15)', () => {
    expect(signatureOf({ render: { left: 15, right: 5 } }, 'compare')).toBe(
      signatureOf({ render: { left: 5, right: 15 } }, 'compare'),
    );
  });

  it('keys counting by the count', () => {
    expect(signatureOf({ render: { count: 5 } }, 'count')).toBe('count:5');
    expect(signatureOf({ render: { count: 5 } }, 'count')).not.toBe(
      signatureOf({ render: { count: 6 } }, 'count'),
    );
  });
});

describe('generateWithRepeatAvoidance', () => {
  it('avoids repeats within the gap when the pool is large', () => {
    const r = makeRng('large-pool');
    const out = generateWithRepeatAvoidance({
      length: 12,
      makeCandidate: () => ({ v: r.int(0, 19) }), // pool of 20 ≫ gap
      signatureOf: (c) => String(c.v),
    });
    expect(out).toHaveLength(12);
    expect(noRepeatWithinGap(out.map((c) => String(c.v)), REPEAT_GAP)).toBe(true);
  });

  it('does not hang and still completes when the pool is too small to avoid repeats', () => {
    const r = makeRng('tiny-pool');
    const out = generateWithRepeatAvoidance({
      length: 8,
      makeCandidate: () => ({ v: r.int(0, 1) }), // only 2 distinct, gap 6 → repeats unavoidable
      signatureOf: (c) => String(c.v),
    });
    expect(out).toHaveLength(8); // completed ⇒ no infinite retry loop
    expect(new Set(out.map((c) => c.v)).size).toBeLessThanOrEqual(2); // accepted repeats gracefully
  });
});
