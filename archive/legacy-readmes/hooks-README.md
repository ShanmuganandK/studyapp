# src/hooks/ — React orchestration

Custom React hooks that wire the new core to the UI. Part of the new core grown alongside
the frozen legacy app (DECISIONS.md "Migration strategy"). Currently a placeholder folder —
hooks land here as screens migrate one at a time.

**Purpose:** keep components presentational (STANDARDS §1) by holding state + flow in hooks.
A hook orchestrates a piece of the learning loop — e.g. session flow, question delivery,
answer handling, mastery updates — by calling **`src/engine/`** (pure logic) and
**`src/services/`** (persistence/auth). Components render what the hook returns.

**Rules:**
- Hooks are the orchestration layer: they may call `engine/` and `services/`, never the
  reverse. They never reach into recipe internals — only the contract output.
- No direct external-SDK calls here; that boundary is `src/services/`.
- A migrating screen reads a flag in `src/config/flags.js` to choose its new hook vs the
  legacy path; legacy is never imported by new code.
