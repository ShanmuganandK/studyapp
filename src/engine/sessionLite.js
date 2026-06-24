/**
 * sessionLite — a minimal session builder for the first playable loop (spec-wire-engine-to-screen.md).
 *
 * NOT the full session composer (that's later: mastery, spaced-rep, warm-up/frontier/review).
 * This just picks a `ready` skill and generates a short, difficulty-ramped question set so a
 * child can actually play. Pure (engine layer — no React/Firebase), so it's testable.
 *
 * It honours the status gate the skill-map helpers deliberately leave to this layer: only
 * `status:'ready'` skills are ever served (a `planned` skill has no recipe yet).
 */

import { SKILLS } from '../recipes/skillMap';
import addition from '../recipes/addition';
import counting from '../recipes/counting';
import subtraction from '../recipes/subtraction';
import compareNumbers from '../recipes/compareNumbers';

// Recipe registry keyed by the skill map's `recipe` field. Only the ready recipes are needed
// (planned skills are never selected). Add entries here as the factory builds more.
const RECIPES = { addition, counting, subtraction, compareNumbers };

const DEFAULT_LENGTH = 8;

// Repeat-avoidance (lives in the session layer; recipes stay pure). A question counts as a
// repeat of a recent one when its OPERANDS match (see signatureOf). We avoid repeating within
// the last REPEAT_GAP questions, retrying generation up to MAX_RETRIES, then accept a repeat
// if the pool is too small to avoid one (e.g. counting at difficulty 1 has only 3 distinct
// questions) — capped retries mean we never hang.
export const REPEAT_GAP = 6;
export const MAX_RETRIES = 12;

// Maps a skill's recipe to how its questions are compared for repeats.
const KIND_BY_RECIPE = {
  addition: 'add', // commutative: 1+4 ≡ 4+1
  subtraction: 'sub', // ordered: 5−1 ≠ 1−5
  compareNumbers: 'compare', // commutative on the pair: 15?5 ≡ 5?15
  counting: 'count', // identity is the count itself (glyph/word irrelevant)
};

/**
 * Canonical signature of a generated question, for repeat detection. Two questions with the
 * same signature are "the same question"; same answer via different operands (1+4 vs 2+3) is
 * NOT the same. Derived from the contract output only — recipes are not modified.
 */
export function signatureOf(question, kind) {
  if (kind === 'count') return `count:${question.render.count}`;
  if (kind === 'compare') {
    const { left, right } = question.render;
    const [lo, hi] = left <= right ? [left, right] : [right, left];
    return `cmp:${lo},${hi}`;
  }
  const nums = (question.questionText.match(/\d+/g) ?? []).map(Number);
  if (kind === 'add') {
    const [a, b] = nums.slice(0, 2).sort((x, y) => x - y); // commutative
    return `add:${a},${b}`;
  }
  if (kind === 'sub') {
    const [a, b] = nums.slice(0, 2); // ordered
    return `sub:${a},${b}`;
  }
  return `text:${question.questionText}`;
}

/**
 * Deal `length` items, avoiding signature repeats within the last `gap` items via capped
 * rejection sampling. Pure given `makeCandidate` (which itself draws from a seeded rng), so
 * it's deterministic and testable. Never hangs: after `maxRetries` it accepts a repeat.
 *
 * (We use rejection sampling rather than "shuffle the full set and deal" because recipes
 * generate from an rng and don't accept injected operands — there's no set to enumerate
 * without changing the recipe contract. The retry cap makes small pools graceful.)
 */
export function generateWithRepeatAvoidance({
  length,
  gap = REPEAT_GAP,
  maxRetries = MAX_RETRIES,
  makeCandidate,
  signatureOf: sig,
}) {
  const out = [];
  const recent = [];
  for (let i = 0; i < length; i++) {
    let candidate = makeCandidate(i);
    for (let attempt = 0; attempt < maxRetries && recent.includes(sig(candidate)); attempt++) {
      candidate = makeCandidate(i);
    }
    out.push(candidate);
    recent.push(sig(candidate));
    if (recent.length > gap) recent.shift();
  }
  return out;
}

/** Ready skills for a grade, falling back to all ready skills so the loop is never a dead-end. */
export function readySkills(grade) {
  const all = Object.values(SKILLS).filter((s) => s.status === 'ready');
  const forGrade = all.filter((s) => s.grade === grade);
  return forGrade.length ? forGrade : all;
}

/**
 * Linear difficulty ramp: first third at 1, middle at 2, last third at 3 — clamped to the
 * skill's ceiling. No adaptivity yet (TODO: adaptive difficulty after the kid-test).
 */
export function rampDifficulty(index, length, maxDifficulty) {
  const third = length / 3;
  const rung = index < third ? 1 : index < 2 * third ? 2 : 3;
  return Math.min(rung, maxDifficulty);
}

/**
 * Build a short, playable session.
 * @param {number} grade
 * @param {object} rng - seeded RNG from src/recipes/_rng (makeRng)
 * @param {{length?: number, skillId?: string}} [opts] - skillId forces a specific ready skill
 *        (used by the skill picker + tests); otherwise a random ready skill is chosen.
 * @returns {{ skillId, skillName, grade, questions }} questions are recipe contract outputs,
 *          each annotated with its ramp `difficulty` (session metadata for analytics).
 */
export function buildLiteSession(grade, rng, { length = DEFAULT_LENGTH, skillId } = {}) {
  const pool = readySkills(grade);
  if (pool.length === 0) return { skillId: null, skillName: null, grade, questions: [] };

  const chosen = skillId ? SKILLS[skillId] : pool[rng.int(0, pool.length - 1)];
  if (!chosen || chosen.status !== 'ready') {
    throw new Error(`buildLiteSession: skill '${skillId}' is not a ready skill`);
  }
  const recipe = RECIPES[chosen.recipe];
  if (!recipe) throw new Error(`buildLiteSession: no recipe registered for '${chosen.recipe}'`);

  const kind = KIND_BY_RECIPE[chosen.recipe] ?? 'text';
  const questions = generateWithRepeatAvoidance({
    length,
    makeCandidate: (i) => {
      const difficulty = rampDifficulty(i, length, chosen.maxDifficulty);
      // Advancing the same rng across calls varies each question; deterministic given the seed.
      return { ...recipe.generate(difficulty, rng, chosen.id), difficulty };
    },
    signatureOf: (q) => signatureOf(q, kind),
  });

  return { skillId: chosen.id, skillName: chosen.name, grade: chosen.grade, questions };
}
