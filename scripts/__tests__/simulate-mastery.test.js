import { describe, it, expect } from 'vitest';
import {
  ARCHETYPES,
  MAX_SESSIONS,
  BASE_SEED,
  effectiveAccuracy,
  simulateArchetype,
  runAll,
  monteCarlo,
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
  it('archetype 1 masters quickly (structural minimum is 5 sessions)', () => {
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
    for (const a of ARCHETYPES) {
      const r = simulateArchetype(a, { seed: BASE_SEED });
      expect(r.floorViolations).toBe(0);
      expect(r.finalState.difficulty).toBeGreaterThanOrEqual(1);
      expect(r.finalState.misconceptions).toBe(0);
    }
  });
});

describe('the live engine is the 2026-08-31 baseline (DECISIONS 2026-09-02 revert guard)', () => {
  it('MASTERY has no level streak — level promotes on a single strong session', () => {
    expect(MASTERY.LEVEL_UP_STREAK).toBeUndefined();
    expect(MASTERY.DIFFICULTY_UP_STREAK).toBe(2);
  });

  it('single-run sessions-to-mastery are pinned to the original report committed at 4de5b71', () => {
    // If the rejected LEVEL_UP_STREAK (or anything else) ever changes level/difficulty movement,
    // these move and this fails. 5/6/8/36 are the archetype 1-4 results recorded 2026-08-31.
    const got = runAll({ seed: BASE_SEED }).map((r) => r.sessionsToMastery);
    expect(got).toEqual([5, 6, 8, 36, null, null, null, null, null, null]);
  });

  it('structural minimum sessions to mastery is 5 (two strong at rung 1, two at rung 2, one at rung 3)', () => {
    expect(minSessionsToMastery(MASTERY)).toBe(5);
  });

  it('archetype 4 (0.68 at hard) still masters in nearly every 60-session run — the open cliff, on record', () => {
    // DECISIONS 2026-09-02 leaves the archetype-4-vs-5 cliff open deliberately; this pins its current
    // shape so a change to it is a visible, reviewed one.
    const [a4, a5] = masteryByHorizon({ ids: [4, 5], horizons: [60], runs: 200 });
    expect(a4.byHorizon[0]).toBeGreaterThan(90);
    expect(a5.byHorizon[0]).toBeLessThan(50);
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
    genBegin('live'), 'OLD-L', genEnd('live'),
    '## Findings', 'kept-1',
    '# REJECTED ARM (frozen)', 'frozen-tables', 'kept-2',
    '',
  ].join('\n');

  it('replaces only the named generated block and keeps everything hand-written and frozen', () => {
    const out = spliceGenerated(doc, 'NEW-L', 'live');
    expect(out).toContain('NEW-L');
    expect(out).not.toContain('OLD-L');
    expect(out).toContain('kept-1');
    expect(out).toContain('frozen-tables');
    expect(out).toContain('kept-2');
    expect(out.startsWith('intro\n')).toBe(true);
  });

  it('spliceAll updates every block and is idempotent', () => {
    const blocks = { live: 'NEW-L' };
    const once = spliceAll(doc, blocks);
    expect(once).toContain('NEW-L');
    expect(once).not.toMatch(/OLD-/);
    expect(spliceAll(once, blocks)).toBe(once);
    expect(BLOCKS).toEqual(['live']);
  });

  it('refuses a report with missing markers rather than clobbering it', () => {
    expect(() => spliceGenerated('no markers here', 'NEW', 'live')).toThrow(/markers/);
    expect(() => spliceAll('no markers here', { live: 'x' })).toThrow(/live/);
  });

  it('the report says up top that the LEVEL_UP_STREAK arm is rejected and where the decision is', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const path = await import('node:path');
    const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../claude-chat/mastery-simulation-report.md');
    const top = readFileSync(file, 'utf8').split('\n').slice(0, 12).join('\n');
    expect(top).toContain('DECISIONS 2026-09-02');
    expect(top).toMatch(/REJECTED/);
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
