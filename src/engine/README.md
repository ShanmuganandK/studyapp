# src/engine/ — new-core learning logic

Pure, framework-free logic that drives the learning loop. Part of the new core grown
alongside the frozen legacy app (DECISIONS.md "Migration strategy"). Currently a placeholder
folder — modules land here as the migration proceeds.

**Purpose (planned modules):**
- **Mastery tracker** — promotion/demotion thresholds (~80% at hard across multiple days),
  replacing the legacy "3-in-a-row keyed to question slots" `src/utils/masteryEngine.js`.
- **Spaced repetition** — review scheduling (intervals ~1/2/4/7/21 days).
- **Session composer** — the warm-up / frontier / review mix, daily-limit aware.
- **Remediation ladder** — wrong#1 hint → wrong#2 visual+easier → wrong#3 park + guaranteed
  win (mood floor: a session never ends on failure).

**Rules (STANDARDS §2/§3):**
- Pure functions (input → output, no side effects) so they are trivially testable; mastery,
  composer, and remediation are non-negotiably tested.
- No UI, no Firebase, no `Math.random()`. Consumes only the recipe **contract output**
  (`RECIPE_TEMPLATE.md`) and skill/mastery state — never recipe internals or legacy code.
- Persistence lives in `src/services/`; React orchestration lives in `src/hooks/`.

Gated behind `flags.useNewMastery` (`src/config/flags.js`) until proven.
