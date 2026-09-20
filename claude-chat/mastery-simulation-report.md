# Mastery simulation report

Artifact behind DECISIONS 2026-08-31 (no day-gate on mastery). Produced by
`scripts/simulate-mastery.mjs`; regenerate with `node scripts/simulate-mastery.mjs`.

<!-- BEGIN GENERATED (scripts/simulate-mastery.mjs) — do not hand-edit -->

## Configuration under test

`STRONG_RATIO` 0.8, `WEAK_RATIO` 0.5, `DIFFICULTY_UP_STREAK` 2, `LEVEL_UP_REQUIRES_HARD` true, `MASTERED_LEVEL` 5. Skill `maxDifficulty` 3; 8 questions per session; cap 60 sessions; seed 1.

With 8 questions, "strong" means ≥ 7/8 correct and "weak" means ≤ 3/8.

## Archetypes

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

## Results — single seeded run per archetype

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

## Results — 500 seeds per archetype

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

## Exact session odds (binomial, no simulation)

P(strong) / P(weak) for one 8-question session at each rung. A rung advances only after 2 consecutive strong sessions, so P(strong)^2 is the chance of clearing a rung in a given pair of sessions.

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

<!-- END GENERATED -->

## Findings

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

## Limits

This tests the engine's logic against **synthetic per-question accuracy**. It does **not** model a
real child's learning curve, fatigue, or attempt-specific behaviour — for example the
freeze-on-large-numbers pattern found in the founder's paper test of strategy rungs. Each
archetype's accuracy is fixed per rung for the whole run, so no simulated child ever improves with
practice; a "not reached in 60" result therefore describes a child who never learns, which real
children do. The archetype parameters are chosen to span a spectrum, not measured from children.
It also does not model the remediation ladder, the composer, spaced-repetition review after
mastery, or misconceptions (tags are empty). It complements kid-testing; it does not replace it.
