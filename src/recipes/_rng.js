/**
 * Seedable, deterministic RNG for recipes.
 *
 * Recipes must be pure and reproducible (STANDARDS §2/§3): given the same seed they
 * produce the same question every time, so tests can assert behaviour and the engine can
 * replay/avoid-repeat. We use mulberry32 — a tiny, fast, well-distributed 32-bit PRNG —
 * because a children's math app does not need cryptographic randomness and low-end Android
 * needs the cheap path.
 *
 * The old `src/utils/randomizer.js` uses Math.random() (non-deterministic) and belongs to
 * the legacy generator path; recipes deliberately do NOT depend on it.
 */

// FNV-1a hash so a human-readable string seed (e.g. a skillId + attempt index) maps to a
// 32-bit integer the PRNG can consume.
function hashSeed(seed) {
  if (typeof seed === 'number') return seed >>> 0;
  let h = 2166136261 >>> 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build an RNG bound to a seed.
 * @param {number|string} seed
 * @returns {{ next: () => number, int: (min:number, max:number) => number,
 *             pick: <T>(arr: T[]) => T, shuffle: <T>(arr: T[]) => T[] }}
 */
export function makeRng(seed) {
  const next = mulberry32(hashSeed(seed));

  // Inclusive integer in [min, max].
  const int = (min, max) => min + Math.floor(next() * (max - min + 1));

  const pick = (arr) => arr[int(0, arr.length - 1)];

  // Fisher-Yates; returns a new array, does not mutate the input.
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  return { next, int, pick, shuffle };
}
