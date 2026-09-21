import { describe, it, expect } from 'vitest';
import {
  ARCHETYPES,
  MAX_SESSIONS,
  BASE_SEED,
  effectiveAccuracy,
  simulateArchetype,
  runAll,
  monteCarlo,
  BASELINE_CONFIG,
  BLOCKS,
  minSessionsToMastery,
  masteryByHorizon,
  renderGenerated,
  renderBlocks,
  spliceGenerated,
  spliceAll,
  genBegin,
  genEnd,
} from '../simulate-mastery.mjs';
import { MASTERY } from '../../src/config/masteryConfig.js';

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
  it('archetype 1 masters quickly (structural minimum is 10 sessions with LEVEL_UP_STREAK 2)', () => {
    const r = simulateArchetype(byId(1), { seed: BASE_SEED });
    expect(r.sessionsToMastery).not.toBeNull();
    expect(r.sessionsToMastery).toBeGreaterThanOrEqual(minSessionsToMastery(MASTERY));
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

  it('never breaks the floor: a started skill never returns to level 0, difficulty never below 1', () => {
    for (const config of [MASTERY, BASELINE_CONFIG]) {
      for (const a of ARCHETYPES) {
        const r = simulateArchetype(a, { seed: BASE_SEED, config });
        expect(r.floorViolations).toBe(0);
        expect(r.finalState.difficulty).toBeGreaterThanOrEqual(1);
        expect(r.finalState.misconceptions).toBe(0);
      }
    }
  });
});

describe('baseline vs after (LEVEL_UP_STREAK, DECISIONS 2026-09-01)', () => {
  it('BASELINE_CONFIG is the shipped config with LEVEL_UP_STREAK 1 and nothing else changed', () => {
    expect(BASELINE_CONFIG).toEqual({ ...MASTERY, LEVEL_UP_STREAK: 1 });
    expect(MASTERY.LEVEL_UP_STREAK).toBeGreaterThan(1);
  });

  it('the baseline arm reproduces the ORIGINAL engine — single-run sessions-to-mastery pinned to the report committed at 4de5b71', () => {
    const got = runAll({ seed: BASE_SEED, config: BASELINE_CONFIG }).map((r) => r.sessionsToMastery);
    expect(got).toEqual([5, 6, 8, 36, null, null, null, null, null, null]);
  });

  it('structural minimum sessions to mastery: 5 at baseline, 10 with LEVEL_UP_STREAK 2', () => {
    expect(minSessionsToMastery(BASELINE_CONFIG)).toBe(5);
    expect(minSessionsToMastery(MASTERY)).toBe(10);
  });

  it('the streak slows the middle: archetype 4 masters less often by 60 sessions than at baseline', () => {
    const [b] = masteryByHorizon({ ids: [4], horizons: [60], runs: 60, config: BASELINE_CONFIG });
    const [a] = masteryByHorizon({ ids: [4], horizons: [60], runs: 60, config: MASTERY });
    expect(a.byHorizon[0]).toBeLessThan(b.byHorizon[0]);
  });

  it('horizon shares are monotonic non-decreasing in the horizon', () => {
    const [r] = masteryByHorizon({ ids: [4], horizons: [30, 60, 120], runs: 40 });
    expect(r.byHorizon[0]).toBeLessThanOrEqual(r.byHorizon[1]);
    expect(r.byHorizon[1]).toBeLessThanOrEqual(r.byHorizon[2]);
  });
});

describe('determinism', () => {
  it('same seed → byte-identical archetype results', () => {
    expect(JSON.stringify(runAll({ seed: BASE_SEED }))).toBe(JSON.stringify(runAll({ seed: BASE_SEED })));
  });

  it('same seed → byte-identical Monte Carlo and report block', () => {
    expect(JSON.stringify(monteCarlo({ runs: 20 }))).toBe(JSON.stringify(monteCarlo({ runs: 20 })));
    expect(renderGenerated({ mcRuns: 20 })).toBe(renderGenerated({ mcRuns: 20 }));
    expect(JSON.stringify(renderBlocks({ mcRuns: 20 }))).toBe(JSON.stringify(renderBlocks({ mcRuns: 20 })));
  });

  it('a different seed changes at least one trajectory (the seed is actually used)', () => {
    expect(JSON.stringify(runAll({ seed: 1 }))).not.toBe(JSON.stringify(runAll({ seed: 2 })));
  });
});

describe('report splicing', () => {
  const doc = [
    'intro',
    genBegin('baseline'), 'OLD-B', genEnd('baseline'),
    '## Findings — baseline', 'kept-1',
    genBegin('after'), 'OLD-A', genEnd('after'),
    '## Findings — after', 'kept-2',
    '',
  ].join('\n');

  it('replaces only the named generated block and keeps everything hand-written', () => {
    const out = spliceGenerated(doc, 'NEW-B', 'baseline');
    expect(out).toContain('NEW-B');
    expect(out).not.toContain('OLD-B');
    expect(out).toContain('OLD-A'); // the other block is untouched
    expect(out).toContain('kept-1');
    expect(out).toContain('kept-2');
    expect(out.startsWith('intro\n')).toBe(true);
  });

  it('spliceAll updates every block and is idempotent', () => {
    const blocks = { baseline: 'NEW-B', after: 'NEW-A' };
    const once = spliceAll(doc, blocks);
    expect(once).toContain('NEW-B');
    expect(once).toContain('NEW-A');
    expect(once).not.toMatch(/OLD-/);
    expect(spliceAll(once, blocks)).toBe(once);
    expect(BLOCKS).toEqual(['baseline', 'after']);
  });

  it('refuses a report with missing markers rather than clobbering it', () => {
    expect(() => spliceGenerated('no markers here', 'NEW', 'baseline')).toThrow(/markers/);
    expect(() => spliceAll(`${genBegin('baseline')}\nx\n${genEnd('baseline')}\n`, { baseline: 'a', after: 'b' })).toThrow(/after/);
  });

  it('the committed report is in sync with the generator (regenerating changes nothing)', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const path = await import('node:path');
    const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../claude-chat/mastery-simulation-report.md');
    const committed = readFileSync(file, 'utf8');
    expect(spliceAll(committed, renderBlocks())).toBe(committed);
  });
});
