import { describe, it, expect } from 'vitest';
import {
  ARCHETYPES,
  MAX_SESSIONS,
  BASE_SEED,
  effectiveAccuracy,
  simulateArchetype,
  runAll,
  monteCarlo,
  renderGenerated,
  spliceGenerated,
  GEN_BEGIN,
  GEN_END,
} from '../simulate-mastery.mjs';

const byId = (id) => ARCHETYPES.find((a) => a.id === id);

describe('archetype definitions', () => {
  it('has ten archetypes with monotonic parameters, near-perfect first and struggling last', () => {
    expect(ARCHETYPES).toHaveLength(10);
    expect(ARCHETYPES.map((a) => a.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (let i = 1; i < ARCHETYPES.length; i++) {
      expect(ARCHETYPES[i].baseAccuracy).toBeLessThan(ARCHETYPES[i - 1].baseAccuracy);
      expect(ARCHETYPES[i].dropPerDifficulty).toBeGreaterThanOrEqual(ARCHETYPES[i - 1].dropPerDifficulty);
    }
    expect(byId(1).baseAccuracy).toBeGreaterThanOrEqual(0.95);
    expect(byId(10).baseAccuracy).toBeLessThanOrEqual(0.5);
  });

  it('effective accuracy follows base − drop·(d−1), clamped to [0.05, 0.99]', () => {
    expect(effectiveAccuracy({ baseAccuracy: 0.8, dropPerDifficulty: 0.12 }, 3)).toBeCloseTo(0.56, 10);
    expect(effectiveAccuracy({ baseAccuracy: 0.45, dropPerDifficulty: 0.25 }, 3)).toBe(0.05);
    expect(effectiveAccuracy({ baseAccuracy: 1.2, dropPerDifficulty: 0 }, 1)).toBe(0.99);
  });
});

describe('simulation sanity', () => {
  it('archetype 1 masters quickly (structural minimum is 5 sessions)', () => {
    const r = simulateArchetype(byId(1), { seed: BASE_SEED });
    expect(r.sessionsToMastery).not.toBeNull();
    expect(r.sessionsToMastery).toBeGreaterThanOrEqual(5);
    expect(r.sessionsToMastery).toBeLessThan(15);
    expect(r.finalState.level).toBe(5);
  });

  it('archetype 10 either masters within the cap or is explicitly flagged not-reached', () => {
    const r = simulateArchetype(byId(10), { seed: BASE_SEED });
    expect(r.sessionsPlayed).toBeLessThanOrEqual(MAX_SESSIONS);
    if (r.sessionsToMastery === null) {
      // Must have actually run the full cap (not exited early), and the report must say so.
      expect(r.sessionsPlayed).toBe(MAX_SESSIONS);
      expect(renderGenerated({ mcRuns: 5 })).toContain(`not reached in ${MAX_SESSIONS}`);
    } else {
      expect(r.sessionsToMastery).toBeLessThanOrEqual(MAX_SESSIONS);
      expect(r.finalState.level).toBe(5);
    }
  });

  it('honours the session cap', () => {
    const r = simulateArchetype(byId(10), { seed: BASE_SEED, maxSessions: 7 });
    expect(r.sessionsPlayed).toBeLessThanOrEqual(7);
    expect(r.finalState.attempts).toBe(r.sessionsPlayed * 8);
  });

  it('never drops below the level/difficulty floor', () => {
    for (const a of ARCHETYPES) {
      const r = simulateArchetype(a, { seed: BASE_SEED });
      expect(r.finalState.level).toBeGreaterThanOrEqual(1);
      expect(r.finalState.difficulty).toBeGreaterThanOrEqual(1);
      expect(r.finalState.misconceptions).toBe(0);
    }
  });
});

describe('determinism', () => {
  it('same seed → byte-identical archetype results', () => {
    expect(JSON.stringify(runAll({ seed: BASE_SEED }))).toBe(JSON.stringify(runAll({ seed: BASE_SEED })));
  });

  it('same seed → byte-identical Monte Carlo and report block', () => {
    expect(JSON.stringify(monteCarlo({ runs: 20 }))).toBe(JSON.stringify(monteCarlo({ runs: 20 })));
    expect(renderGenerated({ mcRuns: 20 })).toBe(renderGenerated({ mcRuns: 20 }));
  });

  it('a different seed changes at least one trajectory (the seed is actually used)', () => {
    expect(JSON.stringify(runAll({ seed: 1 }))).not.toBe(JSON.stringify(runAll({ seed: 2 })));
  });
});

describe('report splicing', () => {
  it('replaces only the generated block and keeps hand-written sections', () => {
    const doc = `intro\n${GEN_BEGIN}\nOLD\n${GEN_END}\n## Findings\nkept\n`;
    const out = spliceGenerated(doc, 'NEW');
    expect(out).toContain('NEW');
    expect(out).not.toContain('OLD');
    expect(out).toContain('## Findings\nkept\n');
    expect(out.startsWith('intro\n')).toBe(true);
  });

  it('refuses a report with no markers rather than clobbering it', () => {
    expect(() => spliceGenerated('no markers here', 'NEW')).toThrow(/markers/);
  });
});
