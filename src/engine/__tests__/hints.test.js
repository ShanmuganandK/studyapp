import { describe, it, expect } from 'vitest';
import { makeRng } from '../../recipes/_rng';
import { getHint, REACHABLE_TAGS } from '../hints';
import addition from '../../recipes/addition';
import counting from '../../recipes/counting';
import subtraction from '../../recipes/subtraction';
import compareNumbers from '../../recipes/compareNumbers';

const RECIPES = [addition, counting, subtraction, compareNumbers];

/** Collect every misconception tag the ready recipes can actually emit. */
function emittedTags() {
  const tags = new Set();
  for (const recipe of RECIPES) {
    for (const skillId of recipe.skillIds ?? [recipe.skillId]) {
      for (let d = 1; d <= recipe.maxDifficulty; d++) {
        for (let run = 0; run < 200; run++) {
          const q = recipe.generate(d, makeRng(`${skillId}:${d}:${run}`), skillId);
          q.misconceptions.forEach((t) => t && tags.add(t));
        }
      }
    }
  }
  return tags;
}

describe('hints', () => {
  it('every reachable tag has a non-empty hint string', () => {
    REACHABLE_TAGS.forEach((tag) => {
      const hint = getHint(tag);
      expect(typeof hint).toBe('string');
      expect(hint.length).toBeGreaterThan(0);
    });
  });

  it('every tag the ready recipes emit is covered (no fallback needed)', () => {
    const tags = emittedTags();
    expect(tags.size).toBeGreaterThan(0);
    tags.forEach((tag) => {
      expect(REACHABLE_TAGS, `tag '${tag}' has no hint`).toContain(tag);
    });
  });
});
