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
| `TD-7` | **UI & Integration Test Gaps** | `src/components/__tests__/QuestionView.test.jsx`, `src/components/__tests__/ParentGate.noauth.integration.test.jsx`, plus 13 untested/lightly tested active modules | (1) `QuestionView.test.jsx` misses `3/11` top-level formats (`count-objects`, `compare`, `spatial-mcq`), `14/16` `mcq` `render.kind` sub-trays, and tests `ordinal-strip` at `N=4` vs `LINE_CAP` `N<=7`. (2) `ParentGate.noauth.integration.test.jsx` stages 2–4 cascade on shared `beforeAll` state. (3) `9` active modules (`App.jsx`, `SkillSelectScreen.jsx`, `RecipeQuizScreen.jsx`, `Confetti.jsx`, `MasteryPips.jsx`, `QuizPips.jsx`, `PrivacyNotice.jsx`, `useProgressBackup.js`, `logger.js`) have `0` direct test imports; `HintBubble.jsx` is only transitively rendered; `ThemeManager.jsx` routing, `useOnline.js`, and `platform.js` are only partially tested/mocked. | Add missing format/sub-tray tests in `QuestionView.test.jsx`, isolate `ParentGate` test stages, and add direct unit/integration tests for high-value untested modules (`useProgressBackup.js`, `RecipeQuizScreen.jsx`, `ThemeManager.jsx` routing, `platform.js`). |
