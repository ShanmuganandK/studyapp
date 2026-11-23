# TECH_DEBT.md — Identified Code, Flag, Boundary, Lint & Test-Gap Register

> **Scope (Single Source of Truth):** Code-level defects, stale feature flags, architectural boundary breaches, frozen-legacy anomalies, active lint warnings, stale in-code/config/test comments, and verified automated test blind spots.
> - Product/curriculum/design future direction lives in [`ROADMAP.md`](ROADMAP.md).
> - Live release status & ops live in [`CURRENT_STATE.md`](CURRENT_STATE.md).
> - **Maintenance rule:** Remove an item from this table when fixed rather than keeping a completed history log (git history holds closed fixes).

_Baseline verified against live `src/` (`2026-11-23`). `TD-1`–`TD-9` resolved._

---

| ID | Category | Location (`file:line`) | Verified Issue | Exit Criteria |
|---|---|---|---|---|
| `TD-10` | **Data Model / Coaching Accuracy** | `src/engine/mastery.js:129-131`, `src/engine/parentCoaching.js` (`pickTinkuNoticed`) | Mistake counts per tag are lifetime totals that never decay and carry no date of their own. The "Tinku Noticed" card works around this with proxies (pattern seen `>= 2` times, mastered skills skipped, skill practised in the last 14 days), so an old pattern on a recently practised, unmastered skill can still surface. | Record a per-tag last-seen date (or decay counts after strong sessions) in `applyResult`, add it to the `progressBackup.js` allowlist, and rank the card by tag recency. |
| `TD-11` | **Date Consistency** | `src/hooks/useQuizSession.js:484`, `src/components/SkillPathScreen.jsx:51,54`, `src/components/ParentDashboard.jsx:106` vs `src/services/practiceDays.js:34` | Mastery dates (`lastSeen`, `nextReview`, review-due, the card's recency window) use the UTC date (`toISOString().slice(0, 10)`), while practice days use the phone's local date. In India (UTC+5:30), a session before 05:30 local is dated the previous day. | Use one local-date helper (`localDateString`) for every date the engine stores or compares. |
| `TD-12` | **Stale Config** | `netlify.toml:5-8` | `SECRETS_SCAN_OMIT_KEYS` still lists seven `VITE_FIREBASE_*` keys although Firebase was removed. | Delete the matching variables in Netlify's site settings, then remove the block and confirm a clean deploy. |
| `TD-13` | **Doc Drift** | `src/engine/hints.js:4`, `misconceptions-reference.md` | The 85 shipped kid hints were shortened to `<= 9` words for voice; the hint column in `misconceptions-reference.md` (named the canonical source in `hints.js` and `AGENTS.md`) still holds the older, longer wording. | Decide which file owns child-facing hint wording; update the other to match or point at it. |
| `TD-14` | **Check Flake (observed once)** | `scripts/check-quiz-layout.mjs:271` | The `360×640` parent-dashboard pass reported "Tinku Noticed card did not render" once while a second preview server was running, then passed 3 runs in a row. It advances a fake clock a fixed 600 ms after opening Parent instead of waiting for the card. | Wait for the card selector (or retry once) before measuring; re-run under load to confirm. |
