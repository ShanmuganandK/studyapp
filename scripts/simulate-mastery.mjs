#!/usr/bin/env node
/**
 * Mastery simulation — drives the shipped `applyResult` with synthetic sessions from ten learner
 * archetypes, fast-and-accurate through slow-and-struggling (DECISIONS 2026-08-31).
 *
 * WHY: with no day-gate (DECISIONS 2026-08-31), consolidation rests entirely on
 * `LEVEL_UP_STREAK`, `DIFFICULTY_UP_STREAK` and `LEVEL_UP_REQUIRES_HARD`. This checks how those
 * behave across the whole learner spectrum before the numbers are trusted at either end of it.
 *
 * The report holds two generated blocks: BASELINE (`LEVEL_UP_STREAK` 1 — the engine's behaviour
 * before DECISIONS 2026-09-01, when `level` hopped on a single strong session) and AFTER (the
 * shipped `MASTERY` config), plus a before/after comparison. `LEVEL_UP_STREAK: 1` is exactly the
 * old rule — one strong session completes the streak — so no old engine copy is needed.
 *
 * WHAT IT IS NOT: a feature. No UI, no recipes, no question content. It reads the engine
 * (`src/engine/mastery.js`, `src/config/masteryConfig.js`) and changes neither. It models
 * per-question accuracy only — see the LIMITS section it writes into the report.
 *
 * Determinism: every random draw comes from the recipe engine's seeded mulberry32
 * (`src/recipes/_rng.js`), one stream per (seed, archetype). Never Math.random — the report must
 * be byte-identical on rerun.
 *
 * Usage:
 *   node scripts/simulate-mastery.mjs            # rewrite the generated block of the report
 *   node scripts/simulate-mastery.mjs --stdout   # print the report, write nothing
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

import { emptySkillState, applyResult, isMastered, nextWorkingDifficulty } from '../src/engine/mastery.js';
import { MASTERY } from '../src/config/masteryConfig.js';
import { makeRng } from '../src/recipes/_rng.js';

// ─── Parameters ──────────────────────────────────────────────────────────────

export const SKILL_ID = 'sim.skill';
export const MAX_DIFFICULTY = 3;
export const QUESTIONS_PER_SESSION = 8; // DECISIONS 2026-08-27: session length fixed at 8
export const MAX_SESSIONS = 60;
export const BASE_SEED = 1;
export const MONTE_CARLO_RUNS = 500;
const START_DATE = '2026-01-01';

/**
 * baseAccuracy: P(correct) at difficulty 1.
 * dropPerDifficulty: accuracy lost per rung above 1.
 * Ids 1, 3, 5, 7, 10 are the anchors from the brief; 2, 4, 6, 8, 9 are interpolated between
 * them (monotonic in both columns).
 */
export const ARCHETYPES = [
  { id: 1, label: 'aces everything', baseAccuracy: 0.97, dropPerDifficulty: 0.0 },
  { id: 2, label: 'near-perfect', baseAccuracy: 0.94, dropPerDifficulty: 0.02 },
  { id: 3, label: 'strong', baseAccuracy: 0.9, dropPerDifficulty: 0.05 },
  { id: 4, label: 'solid', baseAccuracy: 0.85, dropPerDifficulty: 0.085 },
  { id: 5, label: 'at the STRONG_RATIO edge', baseAccuracy: 0.8, dropPerDifficulty: 0.12 },
  { id: 6, label: 'shaky on harder rungs', baseAccuracy: 0.73, dropPerDifficulty: 0.15 },
  { id: 7, label: 'struggles on hard rungs', baseAccuracy: 0.65, dropPerDifficulty: 0.18 },
  { id: 8, label: 'weak', baseAccuracy: 0.58, dropPerDifficulty: 0.21 },
  { id: 9, label: 'very weak', baseAccuracy: 0.52, dropPerDifficulty: 0.23 },
  { id: 10, label: 'genuinely struggling', baseAccuracy: 0.45, dropPerDifficulty: 0.25 },
];

/** Effective per-question accuracy at difficulty d. */
export function effectiveAccuracy(archetype, d) {
  const raw = archetype.baseAccuracy - archetype.dropPerDifficulty * (d - 1);
  return Math.min(0.99, Math.max(0.05, raw));
}

// ─── Simulation ──────────────────────────────────────────────────────────────

function fakeDate(sessionNumber) {
  const d = new Date(`${START_DATE}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + sessionNumber - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Play one archetype until mastered or `maxSessions`. Pure given (archetype, seed).
 * Returns plain JSON-serialisable data (the determinism test compares it byte-for-byte).
 */
export function simulateArchetype(
  archetype,
  { seed = BASE_SEED, maxSessions = MAX_SESSIONS, config = MASTERY } = {},
) {
  const rng = makeRng(`mastery-sim:${seed}:${archetype.id}`);
  let state = emptySkillState(SKILL_ID, MAX_DIFFICULTY);

  let sessionsToMastery = null;
  let sessionsPlayed = 0;
  let difficultyRegressions = 0;
  let levelDemotions = 0;
  let peakDifficulty = state.difficulty;
  let peakLevel = state.level;
  let floorViolations = 0;     // sessions that pushed a started skill (level ≥ 1) back to 0, or difficulty < 1
  let longestNonStrongRun = 0; // consecutive non-strong sessions at the same difficulty
  let longestStayAtRung = 0;   // consecutive sessions played at the same difficulty
  let nonStrongRun = 0;
  let stay = 0;
  let prevDifficultyPlayed = null;

  for (let n = 1; n <= maxSessions; n++) {
    const difficultyPlayed = nextWorkingDifficulty(state);
    const p = effectiveAccuracy(archetype, difficultyPlayed);

    // Per-question weighted coin flip — noise, not a fixed ratio.
    let questionsCorrect = 0;
    for (let q = 0; q < QUESTIONS_PER_SESSION; q++) {
      if (rng.next() < p) questionsCorrect++;
    }

    const next = applyResult(
      state,
      {
        skillId: SKILL_ID,
        difficultyPlayed,
        questionsTotal: QUESTIONS_PER_SESSION,
        questionsCorrect,
        misconceptionTags: [],
        date: fakeDate(n), // +1 day/session; no day-gate exists, but `date` must stay well-formed
      },
      config,
    );
    sessionsPlayed = n;

    // Same threshold the engine uses; recomputed only to label the session for the metrics.
    const strong = questionsCorrect / QUESTIONS_PER_SESSION >= config.STRONG_RATIO;

    stay = difficultyPlayed === prevDifficultyPlayed ? stay + 1 : 1;
    longestStayAtRung = Math.max(longestStayAtRung, stay);
    if (strong) {
      nonStrongRun = 0;
    } else {
      nonStrongRun = difficultyPlayed === prevDifficultyPlayed ? nonStrongRun + 1 : 1;
      longestNonStrongRun = Math.max(longestNonStrongRun, nonStrongRun);
    }
    prevDifficultyPlayed = difficultyPlayed;

    if (next.difficulty < state.difficulty) difficultyRegressions++;
    if (next.level < state.level) levelDemotions++;
    if ((state.level >= 1 && next.level < 1) || next.difficulty < 1) floorViolations++;
    peakDifficulty = Math.max(peakDifficulty, next.difficulty);
    peakLevel = Math.max(peakLevel, next.level);

    state = next;
    if (isMastered(state, config)) {
      sessionsToMastery = n;
      break;
    }
  }

  return {
    id: archetype.id,
    sessionsToMastery,
    sessionsPlayed,
    difficultyRegressions,
    levelDemotions,
    floorViolations,
    longestNonStrongRun,
    longestStayAtRung,
    peakDifficulty,
    peakLevel,
    finalState: {
      level: state.level,
      difficulty: state.difficulty,
      attempts: state.attempts,
      correct: state.correct,
      misconceptions: Object.keys(state.misconceptions).length,
    },
  };
}

export function runAll({ seed = BASE_SEED, maxSessions = MAX_SESSIONS, config = MASTERY } = {}) {
  return ARCHETYPES.map((a) => simulateArchetype(a, { seed, maxSessions, config }));
}

/**
 * Fewest sessions any child can take to reach mastery under `config`: a perfect (8/8) child.
 * Exact, not simulated with noise. Structural floor of the config — the fast end's cost.
 */
export function minSessionsToMastery(config = MASTERY, maxSessions = MAX_SESSIONS) {
  let state = emptySkillState(SKILL_ID, MAX_DIFFICULTY);
  for (let n = 1; n <= maxSessions; n++) {
    state = applyResult(
      state,
      {
        skillId: SKILL_ID,
        difficultyPlayed: nextWorkingDifficulty(state),
        questionsTotal: QUESTIONS_PER_SESSION,
        questionsCorrect: QUESTIONS_PER_SESSION,
        misconceptionTags: [],
        date: fakeDate(n),
      },
      config,
    );
    if (isMastered(state, config)) return n;
  }
  return null;
}

/**
 * Many seeds per archetype. The single-seed table shows ONE trajectory; this shows how much
 * that trajectory depends on luck. Deterministic: seeds are `${seed}:mc:${k}`.
 */
export function monteCarlo({
  seed = BASE_SEED,
  runs = MONTE_CARLO_RUNS,
  maxSessions = MAX_SESSIONS,
  config = MASTERY,
} = {}) {
  return ARCHETYPES.map((a) => {
    const sessions = [];
    let regressions = 0;
    let unlocked = 0;
    let demotions = 0;
    for (let k = 0; k < runs; k++) {
      const r = simulateArchetype(a, { seed: `${seed}:mc:${k}`, maxSessions, config });
      // Not-reached runs count as cap+1 so they sort past every real result.
      sessions.push(r.sessionsToMastery ?? maxSessions + 1);
      regressions += r.difficultyRegressions;
      demotions += r.levelDemotions;
      if (r.peakLevel >= config.UNLOCK_LEVEL) unlocked++;
    }
    sessions.sort((x, y) => x - y);
    const at = (q) => sessions[Math.min(sessions.length - 1, Math.floor(q * sessions.length))];
    return {
      id: a.id,
      runs,
      masteredPct: (100 * sessions.filter((s) => s <= maxSessions).length) / runs,
      median: at(0.5),
      p90: at(0.9),
      meanRegressions: regressions / runs,
      meanLevelDemotions: demotions / runs,
      unlockedPct: (100 * unlocked) / runs,
    };
  });
}

/**
 * Share of runs that reach mastery within each horizon, for the given archetype ids. One run per
 * seed at the longest horizon; shorter horizons read off `sessionsToMastery` (same rng stream
 * prefix, so the cap-60 column matches the cap-60 Monte Carlo exactly).
 */
export function masteryByHorizon({
  ids,
  horizons,
  runs = MONTE_CARLO_RUNS,
  seed = BASE_SEED,
  config = MASTERY,
}) {
  const longest = Math.max(...horizons);
  return ids.map((id) => {
    const a = ARCHETYPES.find((x) => x.id === id);
    const finished = [];
    for (let k = 0; k < runs; k++) {
      finished.push(simulateArchetype(a, { seed: `${seed}:mc:${k}`, maxSessions: longest, config }).sessionsToMastery);
    }
    return {
      id,
      byHorizon: horizons.map((h) => (100 * finished.filter((n) => n !== null && n <= h).length) / runs),
    };
  });
}

// ─── Analytic session odds (no simulation — exact binomial) ──────────────────

function binomialPmf(n, k, p) {
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return c * p ** k * (1 - p) ** (n - k);
}

/** Exact P(session is strong / weak) for one archetype at difficulty d, under `config`. */
export function sessionOdds(archetype, d, config = MASTERY) {
  const p = effectiveAccuracy(archetype, d);
  let strong = 0;
  let weak = 0;
  for (let k = 0; k <= QUESTIONS_PER_SESSION; k++) {
    const ratio = k / QUESTIONS_PER_SESSION;
    const pm = binomialPmf(QUESTIONS_PER_SESSION, k, p);
    if (ratio >= config.STRONG_RATIO) strong += pm;
    else if (ratio < config.WEAK_RATIO) weak += pm;
  }
  return { p, strong, weak, middle: 1 - strong - weak };
}

// ─── Report ──────────────────────────────────────────────────────────────────

/** Config the engine behaved as before DECISIONS 2026-09-01 (level hopped on ONE strong session). */
export const BASELINE_CONFIG = { ...MASTERY, LEVEL_UP_STREAK: 1 };

export const BLOCKS = ['baseline', 'after'];
export const genBegin = (name) => `<!-- BEGIN GENERATED: ${name} (scripts/simulate-mastery.mjs) — do not hand-edit -->`;
export const genEnd = (name) => `<!-- END GENERATED: ${name} -->`;

const pct = (x) => `${(100 * x).toFixed(1)}%`;
const reached = (n, cap) => (n === null ? `not reached in ${cap}` : String(n));

function archetypeTable() {
  const out = [
    '### Archetypes',
    '',
    '`effective accuracy at difficulty d = clamp(baseAccuracy − drop × (d − 1), 0.05, 0.99)`',
    '',
    '| # | Label | baseAccuracy | drop / rung | acc @ d1 | acc @ d2 | acc @ d3 |',
    '|---|---|---|---|---|---|---|',
  ];
  for (const a of ARCHETYPES) {
    out.push(
      `| ${a.id} | ${a.label} | ${a.baseAccuracy.toFixed(2)} | ${a.dropPerDifficulty.toFixed(3)} | ` +
        [1, 2, 3].map((d) => effectiveAccuracy(a, d).toFixed(2)).join(' | ') +
        ' |',
    );
  }
  out.push('');
  return out;
}

function oddsTable(config) {
  const out = [
    '### Exact session odds (binomial, no simulation)',
    '',
    'P(strong) / P(weak) for one 8-question session at each rung. A rung advances only after ' +
      `${config.DIFFICULTY_UP_STREAK} consecutive strong sessions, so P(strong)^${config.DIFFICULTY_UP_STREAK} ` +
      'is the chance of clearing a rung in a given pair of sessions. The same odds govern ' +
      '`level` hops under `LEVEL_UP_STREAK`.',
    '',
    '| # | d1 strong / weak | d2 strong / weak | d3 strong / weak |',
    '|---|---|---|---|',
  ];
  for (const a of ARCHETYPES) {
    const cells = [1, 2, 3].map((d) => {
      const o = sessionOdds(a, d, config);
      return `${pct(o.strong)} / ${pct(o.weak)}`;
    });
    out.push(`| ${a.id} | ${cells.join(' | ')} |`);
  }
  out.push('');
  return out;
}

function comparisonTable({ config, compareTo, seed, maxSessions, mcRuns, mc }) {
  const before = monteCarlo({ seed, runs: mcRuns, maxSessions, config: compareTo });
  const beforeSingle = runAll({ seed, maxSessions, config: compareTo });
  const afterSingle = runAll({ seed, maxSessions, config });
  const show = (n) => (n > maxSessions ? `not reached in ${maxSessions}` : String(n));
  const arrow = (b, a) => `${b} → ${a}`;
  const out = [
    '### Before / after',
    '',
    `Before = \`LEVEL_UP_STREAK\` ${compareTo.LEVEL_UP_STREAK} (the engine's rule until DECISIONS ` +
      `2026-09-01: \`level\` hops on one strong session). After = \`LEVEL_UP_STREAK\` ${config.LEVEL_UP_STREAK}. ` +
      `Everything else identical. ${mcRuns} seeds per archetype; the seeds are the same for both arms.`,
    '',
    `Fewest sessions any child can take to reach mastery (a perfect 8/8 child): ` +
      `**${minSessionsToMastery(compareTo, maxSessions)} → ${minSessionsToMastery(config, maxSessions)}**.`,
    '',
    `| # | Mastered within ${maxSessions} | Median sessions to mastery | p90 sessions to mastery | Mean difficulty regressions | Mean level demotions | Reached \`UNLOCK_LEVEL\` (${config.UNLOCK_LEVEL}) | Single run: sessions to mastery |`,
    '|---|---|---|---|---|---|---|---|',
  ];
  for (let i = 0; i < ARCHETYPES.length; i++) {
    const b = before[i];
    const a = mc[i];
    out.push(
      `| ${a.id} | ${arrow(`${b.masteredPct.toFixed(1)}%`, `${a.masteredPct.toFixed(1)}%`)} | ` +
        `${arrow(show(b.median), show(a.median))} | ${arrow(show(b.p90), show(a.p90))} | ` +
        `${arrow(b.meanRegressions.toFixed(2), a.meanRegressions.toFixed(2))} | ` +
        `${arrow(b.meanLevelDemotions.toFixed(2), a.meanLevelDemotions.toFixed(2))} | ` +
        `${arrow(`${b.unlockedPct.toFixed(1)}%`, `${a.unlockedPct.toFixed(1)}%`)} | ` +
        `${arrow(reached(beforeSingle[i].sessionsToMastery, maxSessions), reached(afterSingle[i].sessionsToMastery, maxSessions))} |`,
    );
  }
  out.push('');
  return out;
}

const HORIZONS = [60, 120, 240, 480];
const HORIZON_IDS = [3, 4, 5, 6];

function horizonTable({ config, compareTo, seed, mcRuns }) {
  const before = masteryByHorizon({ ids: HORIZON_IDS, horizons: HORIZONS, runs: mcRuns, seed, config: compareTo });
  const after = masteryByHorizon({ ids: HORIZON_IDS, horizons: HORIZONS, runs: mcRuns, seed, config });
  const out = [
    '### Longer horizon — is it a slowdown or a wall?',
    '',
    'Share of runs that have reached mastery by N sessions (before → after), same seeds. The 60-session ' +
      'cap above can make a slowdown look like a wall; this separates them for the archetypes that moved most.',
    '',
    `| # | ${HORIZONS.map((h) => `by ${h}`).join(' | ')} |`,
    `|---|${HORIZONS.map(() => '---').join('|')}|`,
  ];
  for (let i = 0; i < HORIZON_IDS.length; i++) {
    out.push(
      `| ${HORIZON_IDS[i]} | ` +
        HORIZONS.map((_, j) => `${before[i].byHorizon[j].toFixed(1)}% → ${after[i].byHorizon[j].toFixed(1)}%`).join(' | ') +
        ' |',
    );
  }
  out.push('');
  return out;
}

export function renderGenerated({
  seed = BASE_SEED,
  maxSessions = MAX_SESSIONS,
  config = MASTERY,
  mcRuns = MONTE_CARLO_RUNS,
  title = 'Simulation',
  includeArchetypes = true,
  includeOdds = true,
  compareTo = null, // a config to compare `config` against (rendered as a before/after table)
} = {}) {
  const results = runAll({ seed, maxSessions, config });
  const mc = monteCarlo({ seed, runs: mcRuns, maxSessions, config });
  const out = [`## ${title}`, ''];

  out.push('### Configuration under test', '');
  out.push(
    `\`STRONG_RATIO\` ${config.STRONG_RATIO}, \`WEAK_RATIO\` ${config.WEAK_RATIO}, ` +
      `\`LEVEL_UP_STREAK\` ${config.LEVEL_UP_STREAK}, ` +
      `\`DIFFICULTY_UP_STREAK\` ${config.DIFFICULTY_UP_STREAK}, ` +
      `\`LEVEL_UP_REQUIRES_HARD\` ${config.LEVEL_UP_REQUIRES_HARD}, ` +
      `\`MASTERED_LEVEL\` ${config.MASTERED_LEVEL}. ` +
      `Skill \`maxDifficulty\` ${MAX_DIFFICULTY}; ${QUESTIONS_PER_SESSION} questions per session; ` +
      `cap ${maxSessions} sessions; seed ${seed}.`,
    '',
    `With ${QUESTIONS_PER_SESSION} questions, "strong" means ≥ ` +
      `${Math.ceil(config.STRONG_RATIO * QUESTIONS_PER_SESSION - 1e-9)}/${QUESTIONS_PER_SESSION} correct ` +
      `and "weak" means ≤ ${Math.ceil(config.WEAK_RATIO * QUESTIONS_PER_SESSION) - 1}/${QUESTIONS_PER_SESSION}.`,
    '',
  );

  if (includeArchetypes) out.push(...archetypeTable());

  out.push('### Results — single seeded run per archetype', '');
  out.push(
    '| # | Sessions to mastery | Difficulty regressions | Level demotions | Longest non-strong run (same rung) | Longest stay at one rung | Peak difficulty | Final level | Final difficulty | Attempts | Correct | Misconceptions |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|',
  );
  for (const r of results) {
    out.push(
      `| ${r.id} | ${reached(r.sessionsToMastery, maxSessions)} | ${r.difficultyRegressions} | ` +
        `${r.levelDemotions} | ${r.longestNonStrongRun} | ${r.longestStayAtRung} | ${r.peakDifficulty} | ` +
        `${r.finalState.level} | ${r.finalState.difficulty} | ${r.finalState.attempts} | ` +
        `${r.finalState.correct} | ${r.finalState.misconceptions} |`,
    );
  }
  out.push(
    '',
    '"Difficulty regressions" counts sessions where `difficulty` decreased. "Longest non-strong run" ' +
      'counts consecutive non-strong sessions played at the same difficulty (a strong session, or a ' +
      'change of rung, resets it). "Longest stay" is the most consecutive sessions played at one rung.',
    '',
  );

  out.push(`### Results — ${mcRuns} seeds per archetype`, '');
  out.push(
    'One trajectory is one sample of a noisy process. This repeats each archetype over ' +
      `${mcRuns} deterministic seeds (\`${seed}:mc:0\` … \`${seed}:mc:${mcRuns - 1}\`). ` +
      'Median and p90 count a not-reached run as beyond the cap.',
    '',
    `| # | Reached mastery within ${maxSessions} | Reached \`UNLOCK_LEVEL\` (${config.UNLOCK_LEVEL}) at any point | Median sessions to mastery | p90 sessions to mastery | Mean difficulty regressions |`,
    '|---|---|---|---|---|---|',
  );
  const show = (n) => (n > maxSessions ? `not reached in ${maxSessions}` : String(n));
  for (const m of mc) {
    out.push(
      `| ${m.id} | ${m.masteredPct.toFixed(1)}% | ${m.unlockedPct.toFixed(1)}% | ${show(m.median)} | ${show(m.p90)} | ${m.meanRegressions.toFixed(2)} |`,
    );
  }
  out.push('');

  if (includeOdds) out.push(...oddsTable(config));
  if (compareTo) {
    out.push(...comparisonTable({ config, compareTo, seed, maxSessions, mcRuns, mc }));
    out.push(...horizonTable({ config, compareTo, seed, mcRuns }));
  }

  return out.join('\n');
}

/** Both generated blocks, keyed by marker name. */
export function renderBlocks({ mcRuns = MONTE_CARLO_RUNS, seed = BASE_SEED, maxSessions = MAX_SESSIONS } = {}) {
  const common = { mcRuns, seed, maxSessions };
  return {
    baseline: renderGenerated({
      ...common,
      config: BASELINE_CONFIG,
      title: 'Baseline — `LEVEL_UP_STREAK` 1 (engine behaviour up to 2026-08-31)',
    }),
    after: renderGenerated({
      ...common,
      config: MASTERY,
      title: 'After — shipped config, `LEVEL_UP_STREAK` active (DECISIONS 2026-09-01)',
      includeArchetypes: false,
      includeOdds: false,
      compareTo: BASELINE_CONFIG,
    }),
  };
}

const SKELETON = `# Mastery simulation report

Artifact behind DECISIONS 2026-08-31 (no day-gate on mastery) and 2026-09-01 (\`level\` consolidation).
Produced by \`scripts/simulate-mastery.mjs\`; regenerate with \`node scripts/simulate-mastery.mjs\`.

${genBegin('baseline')}
${genEnd('baseline')}

## Findings — baseline

(not yet written)

${genBegin('after')}
${genEnd('after')}

## Findings — after \`LEVEL_UP_STREAK\`

(not yet written)

## Limits

(not yet written)
`;

/** Replace ONE named generated block of an existing report, leaving everything else alone. */
export function spliceGenerated(existing, generated, name) {
  const begin = genBegin(name);
  const end = genEnd(name);
  const a = existing.indexOf(begin);
  const b = existing.indexOf(end);
  if (a === -1 || b === -1 || b < a) {
    throw new Error(`report is missing its "${name}" generated-block markers`);
  }
  return `${existing.slice(0, a)}${begin}\n\n${generated}\n${existing.slice(b)}`;
}

/** Splice every block into `existing`. */
export function spliceAll(existing, blocks) {
  let doc = existing;
  for (const name of BLOCKS) doc = spliceGenerated(doc, blocks[name], name);
  return doc;
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const reportPath = path.join(repoRoot, 'claude-chat', 'mastery-simulation-report.md');
  const blocks = renderBlocks();

  if (process.argv.includes('--stdout')) {
    process.stdout.write(`${BLOCKS.map((n) => blocks[n]).join('\n')}\n`);
  } else {
    const existing = existsSync(reportPath) ? readFileSync(reportPath, 'utf8') : SKELETON;
    writeFileSync(reportPath, spliceAll(existing, blocks));
    process.stdout.write(`wrote ${path.relative(repoRoot, reportPath)}\n`);
  }
}
