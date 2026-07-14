/**
 * Adult-skill recovery challenge for the parent gate — one two-digit × one-digit multiplication,
 * generated at RUNTIME (never stored). This is a Families-Policy DETERRENT to keep a child out,
 * not a security control, so plain Math.random is fine here (this is NOT a child-facing recipe —
 * the seeded-RNG rule doesn't apply). `rand` is injectable so tests are deterministic.
 *
 * @param {() => number} rand - returns [0,1); defaults to Math.random
 * @returns {{ a: number, b: number, answer: number, prompt: string }}
 */
export function makeAdultChallenge(rand = Math.random) {
  const a = 10 + Math.floor(rand() * 90); // 10–99 (two-digit)
  const b = 2 + Math.floor(rand() * 8);   // 2–9 (one-digit)
  return { a, b, answer: a * b, prompt: `${a} × ${b}` };
}
