import { describe, it, expect } from 'vitest';
import { makeRng } from '../../recipes/_rng';
import { getHint, REACHABLE_TAGS } from '../hints';
import addition from '../../recipes/addition';
import counting from '../../recipes/counting';
import subtraction from '../../recipes/subtraction';
import compareNumbers from '../../recipes/compareNumbers';
import addition2d from '../../recipes/addition2d';
import subtraction2d from '../../recipes/subtraction2d';
import mulIntro from '../../recipes/mulIntro';
import mulTable from '../../recipes/mulTable';
import counting3digit from '../../recipes/counting3digit';
import numbers21to99 from '../../recipes/numbers21to99';
import placeValue from '../../recipes/placeValue';
import placeValue3 from '../../recipes/placeValue3';
import moneyAmounts from '../../recipes/moneyAmounts';
import ordinal from '../../recipes/ordinal';
import timeBasic from '../../recipes/timeBasic';
import patterns from '../../recipes/patterns';
import sorting from '../../recipes/sorting';
import measureLength from '../../recipes/measureLength';
import compare from '../../recipes/compare';
import shapes2d from '../../recipes/shapes2d';
import spatial from '../../recipes/spatial';
import measureWeight from '../../recipes/measureWeight';
import moneyCoins from '../../recipes/moneyCoins';
import measureCapacity from '../../recipes/measureCapacity';
import timeClock from '../../recipes/timeClock';
import pictograph from '../../recipes/pictograph';
import fractionsBasic from '../../recipes/fractionsBasic';

const RECIPES = [
  addition,
  counting,
  subtraction,
  compareNumbers,
  addition2d,
  subtraction2d,
  mulIntro,
  mulTable,
  counting3digit,
  numbers21to99,
  placeValue,
  placeValue3,
  moneyAmounts,
  ordinal,
  timeBasic,
  patterns,
  sorting,
  measureLength,
  compare,
  shapes2d,
  spatial,
  measureWeight,
  moneyCoins,
  measureCapacity,
  timeClock,
  pictograph,
  fractionsBasic,
];

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

  it('keeps every hint concise (<= 10 words) for Grade 1 early readers and voice-over', () => {
    REACHABLE_TAGS.forEach((tag) => {
      const words = getHint(tag).trim().split(/\s+/).length;
      expect(words, `hint for '${tag}' is ${words} words: "${getHint(tag)}"`).toBeLessThanOrEqual(10);
    });
  });
});
