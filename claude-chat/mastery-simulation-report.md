# Mastery simulation report

Artifact behind DECISIONS 2026-08-31 (no day-gate on mastery) and 2026-09-01 (`level` consolidation,
`LEVEL_UP_STREAK`). Produced by `scripts/simulate-mastery.mjs`; regenerate with
`node scripts/simulate-mastery.mjs`.

**Layout.** *Baseline* = the engine as it behaved until 2026-08-31 (`level` hops on ONE strong session,
i.e. `LEVEL_UP_STREAK` 1 — the baseline tables reproduce the originally committed report row for row).
*After* = the shipped config with `LEVEL_UP_STREAK` 2, plus a before/after comparison. Findings for each
are written by hand under their own heading; the baseline findings are preserved as first written.

<!-- BEGIN GENERATED: baseline (scripts/simulate-mastery.mjs) — do not hand-edit -->

## Baseline — `LEVEL_UP_STREAK` 1 (engine behaviour up to 2026-08-31)

### Configuration under test

`STRONG_RATIO` 0.8, `WEAK_RATIO` 0.5, `LEVEL_UP_STREAK` 1, `DIFFICULTY_UP_STREAK` 2, `LEVEL_UP_REQUIRES_HARD` true, `MASTERED_LEVEL` 5. Skill `maxDifficulty` 3; 8 questions per session; cap 60 sessions; seed 1.

With 8 questions, "strong" means ≥ 7/8 correct and "weak" means ≤ 3/8.

### Archetypes

`effective accuracy at difficulty d = clamp(baseAccuracy − drop × (d − 1), 0.05, 0.99)`

| # | Label | baseAccuracy | drop / rung | acc @ d1 | acc @ d2 | acc @ d3 |
|---|---|---|---|---|---|---|
| 1 | aces everything | 0.97 | 0.000 | 0.97 | 0.97 | 0.97 |
| 2 | near-perfect | 0.94 | 0.020 | 0.94 | 0.92 | 0.90 |
| 3 | strong | 0.90 | 0.050 | 0.90 | 0.85 | 0.80 |
| 4 | solid | 0.85 | 0.085 | 0.85 | 0.77 | 0.68 |
| 5 | at the STRONG_RATIO edge | 0.80 | 0.120 | 0.80 | 0.68 | 0.56 |
| 6 | shaky on harder rungs | 0.73 | 0.150 | 0.73 | 0.58 | 0.43 |
| 7 | struggles on hard rungs | 0.65 | 0.180 | 0.65 | 0.47 | 0.29 |
| 8 | weak | 0.58 | 0.210 | 0.58 | 0.37 | 0.16 |
| 9 | very weak | 0.52 | 0.230 | 0.52 | 0.29 | 0.06 |
| 10 | genuinely struggling | 0.45 | 0.250 | 0.45 | 0.20 | 0.05 |

### Results — single seeded run per archetype

| # | Sessions to mastery | Difficulty regressions | Level demotions | Longest non-strong run (same rung) | Longest stay at one rung | Peak difficulty | Final level | Final difficulty | Attempts | Correct | Misconceptions |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 5 | 0 | 0 | 0 | 2 | 3 | 5 | 3 | 40 | 39 | 0 |
| 2 | 6 | 0 | 0 | 1 | 2 | 3 | 5 | 3 | 48 | 43 | 0 |
| 3 | 8 | 0 | 0 | 3 | 4 | 3 | 5 | 3 | 64 | 55 | 0 |
| 4 | 36 | 1 | 1 | 8 | 16 | 3 | 5 | 3 | 288 | 215 | 0 |
| 5 | not reached in 60 | 3 | 4 | 5 | 18 | 2 | 3 | 1 | 480 | 347 | 0 |
| 6 | not reached in 60 | 3 | 7 | 8 | 16 | 2 | 4 | 1 | 480 | 324 | 0 |
| 7 | not reached in 60 | 2 | 5 | 15 | 43 | 2 | 4 | 2 | 480 | 312 | 0 |
| 8 | not reached in 60 | 1 | 3 | 30 | 50 | 2 | 2 | 1 | 480 | 275 | 0 |
| 9 | not reached in 60 | 0 | 0 | 43 | 60 | 1 | 1 | 1 | 480 | 240 | 0 |
| 10 | not reached in 60 | 0 | 1 | 33 | 60 | 1 | 1 | 1 | 480 | 220 | 0 |

"Difficulty regressions" counts sessions where `difficulty` decreased. "Longest non-strong run" counts consecutive non-strong sessions played at the same difficulty (a strong session, or a change of rung, resets it). "Longest stay" is the most consecutive sessions played at one rung.

### Results — 500 seeds per archetype

One trajectory is one sample of a noisy process. This repeats each archetype over 500 deterministic seeds (`1:mc:0` … `1:mc:499`). Median and p90 count a not-reached run as beyond the cap.

| # | Reached mastery within 60 | Reached `UNLOCK_LEVEL` (3) at any point | Median sessions to mastery | p90 sessions to mastery | Mean difficulty regressions |
|---|---|---|---|---|---|
| 1 | 100.0% | 100.0% | 5 | 5 | 0.00 |
| 2 | 100.0% | 100.0% | 5 | 8 | 0.00 |
| 3 | 100.0% | 100.0% | 8 | 13 | 0.04 |
| 4 | 98.2% | 100.0% | 17 | 37 | 0.60 |
| 5 | 23.6% | 100.0% | not reached in 60 | not reached in 60 | 3.27 |
| 6 | 0.2% | 100.0% | not reached in 60 | not reached in 60 | 3.34 |
| 7 | 0.0% | 98.2% | not reached in 60 | not reached in 60 | 1.23 |
| 8 | 0.0% | 63.8% | not reached in 60 | not reached in 60 | 0.43 |
| 9 | 0.0% | 17.6% | not reached in 60 | not reached in 60 | 0.10 |
| 10 | 0.0% | 0.8% | not reached in 60 | not reached in 60 | 0.02 |

### Exact session odds (binomial, no simulation)

P(strong) / P(weak) for one 8-question session at each rung. A rung advances only after 2 consecutive strong sessions, so P(strong)^2 is the chance of clearing a rung in a given pair of sessions. The same odds govern `level` hops under `LEVEL_UP_STREAK`.

| # | d1 strong / weak | d2 strong / weak | d3 strong / weak |
|---|---|---|---|
| 1 | 97.8% / 0.0% | 97.8% / 0.0% | 97.8% / 0.0% |
| 2 | 92.1% / 0.0% | 87.0% / 0.0% | 81.3% / 0.0% |
| 3 | 81.3% / 0.0% | 65.7% / 0.3% | 50.3% / 1.0% |
| 4 | 65.7% / 0.3% | 40.6% / 2.1% | 21.8% / 7.5% |
| 5 | 50.3% / 1.0% | 21.8% / 7.5% | 7.0% / 24.2% |
| 6 | 31.9% / 3.8% | 8.7% / 20.6% | 1.4% / 52.4% |
| 7 | 16.9% / 10.6% | 2.4% / 43.1% | 0.1% / 82.4% |
| 8 | 8.7% / 20.6% | 0.5% / 66.3% | 0.0% / 97.3% |
| 9 | 4.5% / 32.0% | 0.1% / 82.4% | 0.0% / 99.9% |
| 10 | 1.8% / 47.7% | 0.0% / 94.4% | 0.0% / 100.0% |

<!-- END GENERATED: baseline -->

## Findings — baseline (`LEVEL_UP_STREAK` 1, engine up to 2026-08-31)

*Written 2026-08-31 against the baseline tables above; describes the engine BEFORE `LEVEL_UP_STREAK`. Kept as the evidence behind DECISIONS 2026-09-01.*

Stated as observed. No change to `masteryConfig.js` is proposed here — that is the human's call.
Figures are from the tables above ("single run" = the seeded run; "500 seeds" = the Monte Carlo table;
"odds" = the exact binomial table).

1. **Only archetypes 1–4 reliably reach mastery.** Single run: 1 → 5 sessions, 2 → 6, 3 → 8, 4 → 36;
   archetypes 5–10 are all "not reached in 60". Over 500 seeds: 1–3 reach mastery 100%, 4 reaches it
   98.2% (median 17, p90 37), 5 reaches it 23.6%, 6 reaches it 0.2%, 7–10 reach it 0.0%. Archetype 5's
   accuracy at the hard rung is 0.56 and archetype 4's is 0.68, so the line between "masters" and
   "does not" sits between those two, well below the nominal 80%.

2. **Mastery is one lucky session at the hard rung, not a sustained rate.** Level 4 → 5 needs a single
   strong session played at `maxDifficulty`; `DIFFICULTY_UP_STREAK` governs `difficulty`, not `level`,
   so there is no consecutive-session requirement at the hard rung. Archetype 4 (0.68 at hard,
   P(strong) 21.8% per session) masters in 98.2% of runs; archetype 5 (0.56 at hard, P(strong) 7.0%)
   masters in 23.6% of runs. Both are below "~80% at hard", and both are counted mastered.
   The reverse also holds: one weak session (≤ 3/8) at level ≥ 2 drops `level` by one, so these
   children oscillate between levels 3 and 4 until a 7/8 lands on the hard rung.

3. **`STRONG_RATIO` 0.8 behaves as 7/8 (87.5%) at 8 questions.** 6/8 (75%) is "middle". A child whose
   true accuracy is exactly 0.80 has only a 50.3% chance of a strong session (archetype 5 at d1;
   archetype 3 at d3). The middle band (4/8–6/8) is wide, and any middle session resets the streak
   without demoting anything, so it costs progress but is not visible as a regression.

4. **Archetype 5 (the edge case) is asymmetric around the boundary.** At d2 (accuracy 0.68) P(strong)
   is 21.8% and P(weak) is 7.5%. Clearing the rung needs two strong sessions in a row (≈ 4.8% per
   pair); a single weak session demotes (7.5% per session). Difficulty therefore drifts down as
   readily as up: mean 3.27 difficulty regressions per 60-session run, single run 3 regressions,
   4 level demotions, peak difficulty 2, and an 18-session stay at one rung. Every archetype-5 run
   reaches `UNLOCK_LEVEL` (100%), yet 76.4% never master.

5. **The floor holds; archetype 10 never leaves the bottom.** `level` never went below 1 and
   `difficulty` never below 1 in any run, so the floor does not let a child fall out of the skill.
   But P(strong) at d1 is 1.8%, so archetype 10 reaches `UNLOCK_LEVEL` in only 0.8% of runs
   (single run: final level 1, difficulty 1, 480 attempts, 220 correct, a 33-session non-strong run,
   60 sessions at rung 1). Prereq-skill unlocking (`UNLOCK_LEVEL` 3) is reached in 17.6% of
   archetype-9 runs and 63.8% of archetype-8 runs. For archetypes 8–10 the skill stays in the
   practice pool and its dependents mostly stay locked. The engine does not error or stall — it
   simply has nothing further to offer these children on this skill.

6. **`level` can reach the unlock threshold without leaving the easiest rung.** `level` keeps its
   one-strong-session schedule (DECISIONS 2026-08-27), so three strong sessions at d1 give
   `UNLOCK_LEVEL` regardless of `difficulty`. Archetypes 6 and 7 finished the single run at level 4
   with peak difficulty 2.

7. **The fast end is limited only by `DIFFICULTY_UP_STREAK`.** The minimum possible is 5 sessions
   (two strong at rung 1, two at rung 2, one at rung 3 = 40 questions); archetype 1 hit it with zero
   regressions, and archetype 2's median is also 5. Sessions are not throttled by date, so this can
   happen inside one day. Nothing in the engine slows that child further — by design (DECISIONS
   2026-08-31).

8. **"Ever stuck" signal.** Longest non-strong run at one rung (single run): 1 → 0, 2 → 1, 3 → 3,
   4 → 8, 5 → 5, 6 → 8, 7 → 15, 8 → 30, 9 → 43, 10 → 33 sessions. Archetypes 1–3 always get
   two strong in a row soon enough to advance; from archetype 7 down, noise (or, for 8–10,
   the underlying accuracy) keeps the streak from forming for tens of sessions.

<!-- BEGIN GENERATED: after (scripts/simulate-mastery.mjs) — do not hand-edit -->

## After — shipped config, `LEVEL_UP_STREAK` active (DECISIONS 2026-09-01)

### Configuration under test

`STRONG_RATIO` 0.8, `WEAK_RATIO` 0.5, `LEVEL_UP_STREAK` 2, `DIFFICULTY_UP_STREAK` 2, `LEVEL_UP_REQUIRES_HARD` true, `MASTERED_LEVEL` 5. Skill `maxDifficulty` 3; 8 questions per session; cap 60 sessions; seed 1.

With 8 questions, "strong" means ≥ 7/8 correct and "weak" means ≤ 3/8.

### Results — single seeded run per archetype

| # | Sessions to mastery | Difficulty regressions | Level demotions | Longest non-strong run (same rung) | Longest stay at one rung | Peak difficulty | Final level | Final difficulty | Attempts | Correct | Misconceptions |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 10 | 0 | 0 | 0 | 6 | 3 | 5 | 3 | 80 | 77 | 0 |
| 2 | 11 | 0 | 0 | 1 | 7 | 3 | 5 | 3 | 88 | 81 | 0 |
| 3 | 22 | 0 | 0 | 6 | 18 | 3 | 5 | 3 | 176 | 141 | 0 |
| 4 | not reached in 60 | 3 | 3 | 8 | 16 | 3 | 2 | 2 | 480 | 348 | 0 |
| 5 | not reached in 60 | 3 | 2 | 5 | 18 | 2 | 1 | 1 | 480 | 347 | 0 |
| 6 | not reached in 60 | 3 | 2 | 8 | 16 | 2 | 1 | 1 | 480 | 324 | 0 |
| 7 | not reached in 60 | 2 | 1 | 15 | 43 | 2 | 2 | 2 | 480 | 312 | 0 |
| 8 | not reached in 60 | 1 | 0 | 30 | 50 | 2 | 1 | 1 | 480 | 275 | 0 |
| 9 | not reached in 60 | 0 | 0 | 43 | 60 | 1 | 0 | 1 | 480 | 240 | 0 |
| 10 | not reached in 60 | 0 | 0 | 33 | 60 | 1 | 0 | 1 | 480 | 220 | 0 |

"Difficulty regressions" counts sessions where `difficulty` decreased. "Longest non-strong run" counts consecutive non-strong sessions played at the same difficulty (a strong session, or a change of rung, resets it). "Longest stay" is the most consecutive sessions played at one rung.

### Results — 500 seeds per archetype

One trajectory is one sample of a noisy process. This repeats each archetype over 500 deterministic seeds (`1:mc:0` … `1:mc:499`). Median and p90 count a not-reached run as beyond the cap.

| # | Reached mastery within 60 | Reached `UNLOCK_LEVEL` (3) at any point | Median sessions to mastery | p90 sessions to mastery | Mean difficulty regressions |
|---|---|---|---|---|---|
| 1 | 100.0% | 100.0% | 10 | 12 | 0.00 |
| 2 | 100.0% | 100.0% | 12 | 16 | 0.00 |
| 3 | 100.0% | 100.0% | 24 | 37 | 0.18 |
| 4 | 14.2% | 81.6% | not reached in 60 | not reached in 60 | 2.57 |
| 5 | 0.0% | 62.6% | not reached in 60 | not reached in 60 | 3.91 |
| 6 | 0.0% | 6.2% | not reached in 60 | not reached in 60 | 3.35 |
| 7 | 0.0% | 0.0% | not reached in 60 | not reached in 60 | 1.23 |
| 8 | 0.0% | 0.0% | not reached in 60 | not reached in 60 | 0.43 |
| 9 | 0.0% | 0.0% | not reached in 60 | not reached in 60 | 0.10 |
| 10 | 0.0% | 0.0% | not reached in 60 | not reached in 60 | 0.02 |

### Before / after

Before = `LEVEL_UP_STREAK` 1 (the engine's rule until DECISIONS 2026-09-01: `level` hops on one strong session). After = `LEVEL_UP_STREAK` 2. Everything else identical. 500 seeds per archetype; the seeds are the same for both arms.

Fewest sessions any child can take to reach mastery (a perfect 8/8 child): **5 → 10**.

| # | Mastered within 60 | Median sessions to mastery | p90 sessions to mastery | Mean difficulty regressions | Mean level demotions | Reached `UNLOCK_LEVEL` (3) | Single run: sessions to mastery |
|---|---|---|---|---|---|---|---|
| 1 | 100.0% → 100.0% | 5 → 10 | 5 → 12 | 0.00 → 0.00 | 0.00 → 0.00 | 100.0% → 100.0% | 5 → 10 |
| 2 | 100.0% → 100.0% | 5 → 12 | 8 → 16 | 0.00 → 0.00 | 0.00 → 0.00 | 100.0% → 100.0% | 6 → 11 |
| 3 | 100.0% → 100.0% | 8 → 24 | 13 → 37 | 0.04 → 0.18 | 0.04 → 0.17 | 100.0% → 100.0% | 8 → 22 |
| 4 | 98.2% → 14.2% | 17 → not reached in 60 | 37 → not reached in 60 | 0.60 → 2.57 | 0.60 → 2.23 | 100.0% → 81.6% | 36 → not reached in 60 |
| 5 | 23.6% → 0.0% | not reached in 60 → not reached in 60 | not reached in 60 → not reached in 60 | 3.27 → 3.91 | 3.44 → 2.94 | 100.0% → 62.6% | not reached in 60 → not reached in 60 |
| 6 | 0.2% → 0.0% | not reached in 60 → not reached in 60 | not reached in 60 → not reached in 60 | 3.34 → 3.35 | 4.59 → 2.36 | 100.0% → 6.2% | not reached in 60 → not reached in 60 |
| 7 | 0.0% → 0.0% | not reached in 60 → not reached in 60 | not reached in 60 → not reached in 60 | 1.23 → 1.23 | 5.20 → 0.50 | 98.2% → 0.0% | not reached in 60 → not reached in 60 |
| 8 | 0.0% → 0.0% | not reached in 60 → not reached in 60 | not reached in 60 → not reached in 60 | 0.43 → 0.43 | 3.69 → 0.07 | 63.8% → 0.0% | not reached in 60 → not reached in 60 |
| 9 | 0.0% → 0.0% | not reached in 60 → not reached in 60 | not reached in 60 → not reached in 60 | 0.10 → 0.10 | 1.67 → 0.01 | 17.6% → 0.0% | not reached in 60 → not reached in 60 |
| 10 | 0.0% → 0.0% | not reached in 60 → not reached in 60 | not reached in 60 → not reached in 60 | 0.02 → 0.02 | 0.37 → 0.00 | 0.8% → 0.0% | not reached in 60 → not reached in 60 |

### Longer horizon — is it a slowdown or a wall?

Share of runs that have reached mastery by N sessions (before → after), same seeds. The 60-session cap above can make a slowdown look like a wall; this separates them for the archetypes that moved most.

| # | by 60 | by 120 | by 240 | by 480 |
|---|---|---|---|---|
| 3 | 100.0% → 100.0% | 100.0% → 100.0% | 100.0% → 100.0% | 100.0% → 100.0% |
| 4 | 98.2% → 14.2% | 100.0% → 52.4% | 100.0% → 93.6% | 100.0% → 100.0% |
| 5 | 23.6% → 0.0% | 48.4% → 0.0% | 75.2% → 0.0% | 95.2% → 1.0% |
| 6 | 0.2% → 0.0% | 0.2% → 0.0% | 1.6% → 0.0% | 3.2% → 0.0% |

<!-- END GENERATED: after -->

## Findings — after `LEVEL_UP_STREAK`

Written 2026-09-01. Stated as observed; no constant was changed and no change is proposed here. Numbers
are from the *After* block above (before → after, 500 seeds, same seeds in both arms, 60-session cap
unless a longer horizon is named).

1. **Archetype 5's outcome did not improve — on every mastery measure it got worse.** Mastery within 60
   sessions: 23.6% → **0.0%**. Within 480: 95.2% → **1.0%** (horizon table). Reached `UNLOCK_LEVEL`:
   100% → 62.6%. Mean difficulty regressions per run: 3.27 → 3.91 (more churn, not less). Mean level
   demotions: 3.44 → 2.94 (a modest fall, and partly because fewer level-ups occur to be demoted from).
   This is not a marginal change and it is in the wrong direction for the case the DECISIONS entry
   named. By the entry's own revisit trigger ("fails to meaningfully help archetype-5-shaped
   children"), this is the evidence the trigger describes.

2. **Archetype 4 (68% at hard) went from near-certain to slow.** Mastery within 60: 98.2% → 14.2%;
   within 120: 100% → 52.4%; within 240: 100% → 93.6%; within 480: 100% → 100%. It is a slowdown, not a
   wall — the median moves from 17 sessions to roughly 120 — but the child still ends up mastered.
   The hold-at-cap rule means that once the streak is banked, one strong session at hard fires the hop;
   that last step is still a single session.

3. **The cost lands on strong learners too.** Structural minimum (a perfect 8/8 child) to mastery:
   5 → **10** sessions (80 questions). Archetype 1: median 5 → 10, p90 5 → 12. Archetype 2: median
   5 → 12, p90 8 → 16. Archetype 3 (0.80 at hard): median 8 → **24**, p90 13 → **37**. Whether that
   "visibly drags" is a kid-test observation this simulation cannot make; it is the other half of the
   revisit trigger and the numbers are here for it.

4. **`UNLOCK_LEVEL` (3) becomes hard to reach below archetype 4.** Reached within 60 sessions:
   archetype 4: 100% → 81.6%; 5: 100% → 62.6%; 6: 100% → 6.2%; 7: 98.2% → 0.0%; 8: 63.8% → 0.0%;
   9: 17.6% → 0.0%; 10: 0.8% → 0.0%. `UNLOCK_LEVEL` is the skill map's prerequisite gate, so this changes
   which skills open for these children, not just how fast one skill is mastered.

5. **The bottom of the ladder is now "level 0" for archetypes 9 and 10.** Level 0→1 previously took one
   strong session; it now takes two in a row, and archetypes 9 and 10 (P(strong) at d1 of 4.5% and 1.8%)
   finish the single seeded run at level 0 after 60 sessions and 480 attempts (previously level 1). The
   engine's floor (never below level 1 once started) is intact, but these children never *start*.
   In the app, level 0 is read as "not started" (see the code note in the doc-sync report).

6. **Sessions to mastery for the archetypes that still master are consistent with the streak maths, and
   nothing regressed at the fast end structurally:** archetype 1 has 0 regressions and 0 level
   demotions before and after; the single run is 10 sessions against the structural minimum of 10.

7. **Longer horizon (table above).** Archetype 3: unchanged at every horizon. Archetype 4: converges to
   100% by 480. Archetype 5: 95.2% → 1.0% by 480 — under this config it does not converge. Archetype 6:
   3.2% → 0.0% by 480.

## Limits

This tests the engine's logic against **synthetic per-question accuracy**. It does **not** model a
real child's learning curve, fatigue, or attempt-specific behaviour — for example the
freeze-on-large-numbers pattern found in the founder's paper test of strategy rungs. Each
archetype's accuracy is fixed per rung for the whole run, so no simulated child ever improves with
practice; a "not reached in 60" result therefore describes a child who never learns, which real
children do. The archetype parameters are chosen to span a spectrum, not measured from children.
It also does not model the remediation ladder, the composer, the skill map's use of `UNLOCK_LEVEL`,
what the parent dashboard shows for level 0, spaced-repetition review after mastery, or
misconceptions (tags are empty). Findings 4 and 5 above report the engine's `level` outcomes; what
those outcomes do to unlocking and to the "not started" label is read from the code, not simulated. It complements kid-testing; it does not replace it.
