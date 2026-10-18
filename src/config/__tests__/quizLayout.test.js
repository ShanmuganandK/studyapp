import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIZ_PROFILES, quizProfileForGrade } from '../quizLayout.js';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'index.css'), 'utf8');

describe('quizProfileForGrade', () => {
  it('gives the young grades the roomy profile (big Tinku, short questions)', () => {
    expect(quizProfileForGrade(1)).toBe('roomy');
    expect(quizProfileForGrade(2)).toBe('roomy');
    expect(quizProfileForGrade('2')).toBe('roomy');
  });
  it('gives Class 3 and up the standard profile', () => {
    expect(quizProfileForGrade(3)).toBe('standard');
    expect(quizProfileForGrade(5)).toBe('standard');
  });
  it('falls back to roomy when the grade is unknown (a fresh install must never get a broken layout)', () => {
    expect(quizProfileForGrade(null)).toBe('roomy');
    expect(quizProfileForGrade(undefined)).toBe('roomy');
  });
  it('only ever returns a profile that exists', () => {
    for (const g of [null, 0, 1, 2, 3, 4, 8]) expect(QUIZ_PROFILES).toContain(quizProfileForGrade(g));
  });
});

describe('every profile has its numbers in CSS', () => {
  for (const name of QUIZ_PROFILES) {
    it(`.quiz-grid[data-profile='${name}'] defines the whole budget`, () => {
      const at = css.indexOf(`.quiz-grid[data-profile='${name}']`);
      expect(at, `no CSS block for profile "${name}"`).toBeGreaterThan(-1);
      const block = css.slice(at, css.indexOf('}', at));
      for (const v of ['--q-mascot', '--q-hint', '--q-tile', '--q-glyph', '--q-num']) {
        expect(block, `${name} is missing ${v}`).toContain(v);
      }
    });
  }
});
