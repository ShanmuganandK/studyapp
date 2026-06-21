# Analytics Plan & Event Schema — Tinku Math

**Goal:** Let real kid behavior drive the app's evolution — not just theory. Measure retention, where kids struggle, whether hints work, and (later) conversion. Cheap (Firebase Analytics, free) and child-safe (non-PII).

**Principle:** Instrument events *as each feature is built*, not as a separate phase — so data flows from the very first play and we never have the "captured nothing" regret.

---

## Tool: Firebase Analytics (Google Analytics for Firebase)

- **Free** at our scale (and far beyond). Already in our Firebase stack — no new vendor, no cost.
- Do NOT add paid tools (Mixpanel/Amplitude) yet — unnecessary at this stage.
- **Later (optional):** BigQuery export for deep queries — free tier, cheap beyond. Only when we have lots of users and want SQL-level analysis.

### Child-safety / privacy rules (non-negotiable — Families Policy / DPDP)
- **No PII in events.** Never log names, emails, child identifiers, free text, or anything personal.
- Log **behavior**, not **people**: skill ids, difficulty, correctness, tags, counts, timings.
- Disable/avoid any ad-personalization or cross-app advertising identifiers for a children's app.
- Use a non-identifying install/session id only (Firebase's default app-instance id is fine; do not attach personal data to it).
- This makes analytics safe AND keeps our compliance posture clean.

---

## What we measure (the questions → the events)

### Q1. "Do kids come back?" (retention — the #1 metric)
| event | when | properties |
|---|---|---|
| `session_start` | a play session begins | `skill_id`, `grade`, `band` (wonder/explorer) |
| `session_complete` | session finished | `skill_id`, `questions_total`, `questions_correct`, `duration_sec` |
| `session_abandoned` | left mid-session | `skill_id`, `question_index`, `duration_sec` |

→ D1/D7/D30 retention come automatically from session events. **D7 is the metric that decides everything (per Plan A).**

### Q2. "Is difficulty right? Where do kids struggle?" (the gold — feeds the engine)
| event | when | properties |
|---|---|---|
| `question_answered` | every answer | `skill_id`, `difficulty` (1–3), `correct` (bool), `misconception_tag` (the tag of the chosen wrong option, or `none` if correct), `attempt_number` (1,2…), `time_to_answer_ms`, `format` (mcq/count-objects/compare) |

→ This is the killer event. Aggregated it reveals: which skills have high failure (too hard?), **which misconceptions kids ACTUALLY make** (validates/corrects the research doc with real data), whether the difficulty ramp is right, how long kids take. Our engine already knows the misconception — so this turns the app into a **live misconception-research instrument**.

### Q3. "Do the hints work?"
| event | when | properties |
|---|---|---|
| `hint_shown` | a hint appears after wrong#1 | `skill_id`, `misconception_tag`, `difficulty` |
| (retry outcome) | captured via next `question_answered` | — |

→ If a hint shows and the child *still* fails the retry, that hint isn't working → rewrite it. Real-world hint validation, better than desk review.

### Q4. "Does the loop feel good?" (engagement)
| event | when | properties |
|---|---|---|
| `skill_started` | child begins a skill | `skill_id` |
| `skill_completed` | finished a skill's session | `skill_id`, `correct_ratio` |
| `play_again` | taps play-again at session end | `skill_id` |

### Q5. "Conversion" (LATER — only when these features exist)
| event | when | properties |
|---|---|---|
| `daily_limit_reached` | free quota hit | `sessions_today` |
| `paywall_viewed` | paywall shown | `trigger` (limit/dashboard/mastery) |
| `upgrade_started` | tapped subscribe | `plan` (monthly/annual) |
| `subscribed` | purchase success | `plan` |
| `parent_dashboard_opened` | parent views dashboard | — |
| `account_linked` | anon→Google link | — |

---

## Event naming conventions
- `snake_case` event names and property keys (Firebase convention).
- Keep property values low-cardinality where possible (ids, enums, bucketed numbers) — easier to analyze, cheaper.
- Bucket timings if needed (e.g. `time_to_answer_ms` is fine raw; Firebase handles it).
- One funnel, consistent names — don't invent variants (`quiz_done` vs `session_complete`). This doc is the source of truth for event names.

---

## A thin analytics wrapper (so it's swappable + testable)
- Put a tiny `src/services/analytics.js` wrapper around Firebase: `logEvent(name, params)`.
- Everything calls the wrapper, never Firebase directly — so we can mock it in tests, disable it in dev, or swap providers later without touching feature code.
- In dev/test: wrapper can `console.log` or no-op. In prod: forwards to Firebase.
- Respect a settings toggle later if needed; never block the UI on logging (fire-and-forget).

---

## Build sequencing (instrument as we build)
- **Engine-to-screen task (now):** add `session_start`, `session_complete`, `session_abandoned`, `question_answered`, `hint_shown`, `play_again`. → Data flows from the first play + kid-test.
- **Mastery/auth/dashboard tasks (later):** add the Q4/Q5 events as those features land.
- **Don't** build a separate "analytics phase" — weave each event in with its feature.

## How we use it (the evolution loop)
1. Ship → kids play → events flow.
2. Weekly: look at D7 retention, per-skill failure rates, most-common misconception tags, hint→retry success.
3. Evolve: rebalance difficulty, rewrite weak hints, fix skills with high drop-off, reorder the path — **based on real data, not theory.**
4. The misconception tags kids actually trigger become real research on Indian Grade 1–2 errors — potentially more accurate than the source doc.

## Note for the kid-test (3 kids in person)
You're *watching* them — richer than any event. Analytics is for *scale* (when you can't watch everyone). So: watch directly for the first handful; let analytics take over at dozens/hundreds.
