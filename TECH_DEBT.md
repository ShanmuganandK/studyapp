# TECH_DEBT.md — Identified Code, Flag, Boundary, Lint & Test-Gap Register

> **Scope (Single Source of Truth):** Code-level defects, stale feature flags, architectural boundary breaches, frozen-legacy anomalies, active lint warnings, stale in-code/config/test comments, and verified automated test blind spots.
> - Product/curriculum/design future direction lives in [`ROADMAP.md`](ROADMAP.md).
> - Live release status & ops live in [`CURRENT_STATE.md`](CURRENT_STATE.md).
> - **Maintenance rule:** Remove an item from this table when fixed rather than keeping a completed history log (git history holds closed fixes).

_Baseline verified against live `src/` (`2026-11-21`)._

---

| ID | Category | Location (`file:line`) | Verified Issue | Exit Criteria |
|---|---|---|---|---|
| `TD-4` | **Naming & Frozen Legacy Cleanup** | `src/components/ThemeManager.jsx`, `src/components/SkillSelectScreen.jsx`, `scripts/frozen-legacy.mjs` | `ThemeManager.jsx` is actually the top-level view router (`'skills' \| 'quiz' \| 'parent'`); `SkillSelectScreen.jsx` (`?home=cards`) overlaps `SkillPathScreen.jsx`; unreachable frozen legacy code (`src/data/**` including legacy `₹` question sets, `src/components/modules/**`, 8 unreachable screens, unused `src/utils/**`) still lives inside `src/`. | Rename/split `ThemeManager` router role, settle `?home=cards` once closed-test signal arrives, and safely remove/archive dead frozen modules after verifying zero callers. |
