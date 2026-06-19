# STANDARDS.md — Coding, Architecture, Testing & Data Standards

> Read alongside `CLAUDE.md` and `DECISIONS.md` at the start of every session. Applies to **both Claude Code and Antigravity**.
> This is a behavioral guardrail file, intentionally short. Follow it; don't expand it without reason.

---

## 0. Three behavioral rules (the most important)

1. **No silent assumptions.** If a requirement is ambiguous or missing, STOP and ask — do not guess and charge ahead. Check `DECISIONS.md` first.
2. **Don't over-engineer.** Solve the task in front of you. 50 lines should not become 500. No speculative abstraction, no features nobody asked for. Simplest correct solution wins.
3. **Don't touch unrelated code.** Change only what the task requires. Do not refactor, rename, or "improve" code outside the task scope in the same change.

Use **plan mode** for anything bigger than a trivial edit: state the plan, get approval, then implement.

---

## 1. Code style

- **React 18 functional components + hooks.** No class components. One component per file, PascalCase filename matching the component.
- **Keep components presentational.** Business logic lives in hooks (`/hooks`) or services (`/services`), not inside JSX components. A component should mostly render props/state.
- **Named exports for utilities; default export for the single component/recipe in a file.**
- **Tailwind for styling**, using theme tokens (CSS variables) — never hardcoded hex colors in components (band theming depends on this).
- **No magic numbers** in logic — name them (`const MAX_SUM = 20`).
- Small functions, clear names. Prefer readability over cleverness (the audience for this code is a solo founder + AI agents, not a perf-critical system).
- **Comments explain WHY, not WHAT.** Don't narrate obvious code.
- No dead code, no commented-out blocks left behind, no `console.log` in committed code (use a logger or remove).

## 2. Architecture rules (non-negotiable)

- **The recipe contract is sacred.** Every question comes from a recipe conforming to `RECIPE_TEMPLATE.md`. No hardcoded questions anywhere. Recipes live in `/recipes`, one per skill.
- **Separation of layers:**
  - `recipes/` — pure question generation (no UI, no Firebase, no React). Deterministic given (difficulty, rng).
  - `services/` — Firebase, auth, billing, persistence. The only place external SDKs are touched.
  - `hooks/` — React state + orchestration (session flow, mastery updates) calling services.
  - `components/` — presentational UI only.
- **Pure where possible.** Recipes and the mastery/spaced-rep logic must be pure functions (input → output, no side effects), so they're trivially testable.
- **The contract output shape never leaks recipe internals.** Quiz UI, mastery, and dashboard consume only the contract output.
- **No browser storage for app state** (`localStorage`/`sessionStorage`). Use React state + Firestore. (PWA artifact constraint + correctness.)
- **Offline-first.** Assume the network may be down. Firestore offline persistence on; the app must function for a full session offline and sync later.
- **Feature flags / config over hardcoding** for things likely to change (daily-limit count, price points, difficulty thresholds) — keep them in a single `config` module.

## 3. Testing standards

- **Framework:** Vitest + React Testing Library.
- **What MUST have tests:**
  - **Every recipe** — via the shared recipe validator (see below). Non-negotiable; a recipe without a passing validator run does not merge.
  - **Mastery / spaced-repetition logic** — promotion/demotion thresholds, interval scheduling, edge cases (0 attempts, all wrong, all right).
  - **Session composer** — correct mix (warm-up/frontier/review), respects daily limit, handles "nothing due".
  - **Remediation ladder** — wrong#1/#2/#3 transitions, mood-floor guarantee (session never ends on failure).
  - **Auth linking** — anonymous→Google preserves data (mock Firebase).
- **The shared recipe validator** (`recipes/__tests__/validator.test.js`): takes any recipe, runs `generate()` 100× at each difficulty (1–3), and asserts:
  1. Output matches the contract shape exactly.
  2. `correctAnswer` is always present in `options`.
  3. `correctAnswer` is mathematically correct for the generated params.
  4. `options` has no duplicates and the expected count.
  5. Difficulty respects the skill's ceiling (no out-of-range values).
  6. `misconceptions` array aligns index-wise with `options`.
- **Test behavior, not implementation.** Assert what the user/consumer sees, not internal calls.
- **Keep tests fast and deterministic.** Seed the RNG in tests. No real network, no real Firebase — mock `services/`.
- Aim for meaningful coverage on logic (recipes, mastery, composer, remediation), not 100% everywhere. UI components need light smoke tests, not exhaustive ones.

## 4. Data / Firestore conventions

- **Single source of truth for shapes.** Document every Firestore shape in `ARCHITECTURE.md`. Don't invent ad-hoc fields.
- **Everything hangs under the auth UID** (anonymous-first), surviving the anonymous→Google link untouched. Path pattern:
  ```
  users/{uid}/children/{childId}/profile
  users/{uid}/children/{childId}/skills/{skillId}
  users/{uid}/children/{childId}/sessions/{sessionId}
  users/{uid}/children/{childId}/streak
  ```
- **Skill state doc** (`skills/{skillId}`): `level (0-5)`, `difficulty (1-3)`, `lastSeen`, `nextDue`, `attempts`, `correct`, `misconceptions{tag:count}`, `recentParams[]` (last ~20, repeat-avoidance).
- **Write batched/coalesced.** Group fields updated together into one write (e.g. one `skills/{id}` update per session, not per question). Minimize Firestore round-trips (cost + offline behavior).
- **Never store** secrets, API keys, PII beyond what's needed, or anything sensitive in client-readable docs. Firebase config env vars only via `VITE_*` + Netlify env.
- **Security rules matter** (later task): a user can only read/write their own `users/{uid}/...`. Note it; implement at the billing/launch stage.
- **Reads are progressive.** Show cached/partial data immediately; never block the whole UI on a network read.
- **No personal data in URLs or query strings.**

## 5. Performance (low-end Android is the target)

- Animate only `transform` and `opacity` (GPU). Never animate layout properties (`width/height/top/left/box-shadow`) in loops.
- Compress all image assets (WebP, run through squoosh). Tinku poses and any art must be lightweight.
- Lazy-load non-critical screens/routes. Keep the initial bundle small.
- Avoid heavy libraries when CSS/a small hook will do (e.g. CSS animation before Framer Motion; Howler only where needed).

## 6. Security & safety basics

- This is a **children's app.** No third-party ad/tracking SDKs that profile children. Analytics events must be non-PII.
- Parent-gated areas (dashboard, paywall, settings) must be behind the parent gate.
- Never log children's data to third parties. Follow the Families Policy / DPDP posture in `DECISIONS.md`.

## 7. Git & review

- One branch per task. Small, focused commits with clear messages.
- Update `ARCHITECTURE.md` in the SAME commit as any structural change.
- The human reviews every diff before merge. Surface anything risky or out-of-scope in the change explicitly.

---

## How the two agents use this
- **Claude Code:** owns logic/architecture; enforces §2, §3, §4 most heavily; writes the reference recipes + validator that Antigravity then follows.
- **Antigravity:** owns UI/replication; enforces §1, §5; copies Claude's examples and must make every new recipe pass the §3 validator before the human merges.
- Both: obey §0 always.
