# CLAUDE.md — Project Orientation for AI Coding Agents

> **Read at the start of every session, before writing any code:**
> this file → `DECISIONS.md` → `STANDARDS.md` → `ARCHITECTURE.md` → `claude-chat/TRACKER.md`.
>
> For anything else, see **`DOCMAP.md`** — it maps every document in the repo, says who may
> write it, and flags which ones describe **finished** work. Do not read the other ~20 markdown
> files speculatively; go to the map when you need a specific area.
>
> Applies to Claude Code AND Antigravity. **If anything here conflicts with a task instruction,
> stop and ask before proceeding.**

---

## What this project is

**Tinku Math** — a CBSE/NCERT-aligned maths app for Indian children, **Grades 1–3** at launch
(the "Wonder" band). Mascot is **Tinku**, a flat 2D blue-grey elephant with a glowing math star.
Built solo, targeting India, run from Dubai.

The heart is a **learning loop**: a child practises procedurally-generated maths, gets safe
remediation on mistakes, and improves over days via spaced repetition. A parent dashboard shows
progress.

**Success is measured by D7 retention, not revenue.** Build for kids returning tomorrow.

---

## ⚠️ Current MVP shape — read this before assuming anything

**DECISIONS 2026-08-14 re-scoped the product.** The MVP is **device-local, processes no child
personal data, and takes no money.** This keeps us outside India's DPDP Act s.9 / Rule 10
entirely, so we can ship and get real signal before spending on legal infrastructure.

**In scope:** device-local progress · no accounts · no cloud · no analytics · no ads ·
no outbound messaging · **no payment of any kind**.

**Deliberately out of scope — deferred, NOT cancelled:** auth rebuild (T109) · Firestore ·
cloud sync · parent accounts · paywall · subscriptions · analytics.

These are **not** a backlog. Do not build toward them. Several older documents in this repo
describe that tier as though it were next; `DOCMAP.md` flags which.

---

## Tech stack (do not change without a decision)

- **React 18 + Vite** (SPA), **Tailwind CSS**
- **PWA** (offline-capable, installable) — primary delivery; **Capacitor** wraps it for Play later
- **Persistence: browser `localStorage`, via the `progressStore` seam.** Keys are prefixed
  `tinku:v1:`. This is the *intended* architecture for MVP, not a shortcut.
- **No backend. No Firebase. No network calls of any kind from `src/`.**
- **Deployment:** Netlify (web/PWA); Google Play later
- Target devices: **low-end Android.** Performance matters. Animate only `transform` / `opacity`.

> **Firebase was fully removed on 2026-08-15.** A network audit found the Auth SDK initialising
> on every app start, which made the published claim "nothing leaves the device" untrue. The
> dependency is gone, `lib/firebase.js` and `firebaseAdapter.js` are deleted, and the auth seam
> is an inert **null-user** adapter. `AuthProvider` remains in the tree because it still owns the
> parent passcode and profile state — only the adapter beneath it changed.
>
> **Do not reintroduce Firebase, any network client, or any analytics SDK.**
> `services/__tests__/noFirebaseAuth.test.js` will fail the build, and the published privacy
> policy depends on it.

---

## Core architecture: "logic, not questions"

We **never store questions.** We store **recipes** — functions that *generate* questions.
One recipe = infinite questions.

Every recipe conforms to ONE fixed contract (`RECIPE_TEMPLATE.md`). Input: `difficulty (1-3)`
+ seeded RNG. Output: `{ questionText, correctAnswer, options, format, misconceptions }`.

- **Difficulty is capped** at the curriculum ceiling per skill. It does NOT climb forever —
  a harder range is a *different skill*.
- **Practice stops when mastery is proven** (~80% at hard level, across sessions on different
  days), then the skill enters spaced-repetition review and the child moves on.
- **Wrong answers are deliberate:** each distractor encodes a known misconception (e.g.
  `forgot-carry`), so hints can be targeted and the dashboard can explain *why* a child struggles.
- `misconceptions-reference.md` is canonical for tags and rules. **When a recipe and that doc
  disagree, the doc wins** — and check the distractor *rule* matches, not just the label.

This is why content is "solved forever" and why new grades/boards are cheap later.
**Protect the contract.** Screens, mastery and dashboard only ever see contract output —
never recipe internals.

---

## Guards — these exist to be believed

CI runs on every push and PR: `lint` → `lint:hex` → `test:run` → `build`, then re-runs the
bundle guard **after** the build. Baseline is **328 tests**.

| Guard | Protects |
|---|---|
| `noFirebaseAuth.test.js` | No Google identity endpoints in `dist/`. Backs a published privacy claim. |
| T91 analytics guard | No analytics SDK in the build. |
| `privacyPolicy.test.js` | Committed `public/privacy.html` is byte-identical to generator output; page loads no external host; the policy makes no unshipped or unverified claim. |
| `scripts/check-raw-hex.mjs` | Design-token discipline — no raw hex in components (DECISIONS 2026-07-04 / 07-05). |
| `scripts/frozen-legacy.mjs` | ONE shared list of frozen paths, so guards can't disagree. |

**Standing rule: prove a new guard RED before trusting it green.** Inject the violation, watch
it fail, revert. A guard that has never failed is unverified. Lint is scoped to **new code** —
every pre-existing violation lives in frozen legacy that the migration rule forbids editing.
Exclusions are explicit commented lists, never a silent `--quiet`.

---

## Working rules

**No claim without an artifact.** Do not write "done" in any document unless the thing exists in
the repo. On 2026-08-15 three tracker claims were sampled and three were false — including a
"standards guard wired into CI" that had never been committed. That is why the claims rule
exists.

**Measure, don't infer, when the claim is public.** "No `fetch` in `src/`" is an argument;
"the built app issues 12 requests, all same-origin" is a fact. Anything that ends up in the
privacy policy or the store listing gets the second kind.

**Stop and flag rather than resolving silently.** Do not invent product decisions. Check
`DECISIONS.md`; if it isn't there, ask the human, then record the answer there.

**Scope fences are real.** Don't touch unrelated code. Don't over-engineer. Legacy is frozen:
`src/utils/generators/`, `src/data/questions*`, `masteryEngine.js` and the other paths in
`scripts/frozen-legacy.mjs` are never edited — new code never imports them.

**Deploy verification.** After deploying, confirm the Netlify **Published** commit SHA matches
`master`. A stale service-worker cache and a genuinely stale published deploy look identical
from outside, and Netlify serves the last *successful* build indefinitely. Incognito first —
it bypasses the SW and splits the two in 30 seconds.

---

## Who owns what

> **Claude Code owns what the code IS. Claude Chat owns what we DECIDED.
> The human owns what happens outside the repo.**

| You (Claude Code / Antigravity) write | You read, but do not write |
|---|---|
| `src/`, tests, build config | `DECISIONS.md` — Chat's, append-only. You may add *verified facts* with human approval; never a product decision. |
| `ARCHITECTURE.md` — **same commit** as the change | `CLAUDE.md`, `STANDARDS.md`, `DOCMAP.md` — rules, not status |
| `claude-chat/TRACKER.md` — when reporting work you landed | `claude-chat/TASK-INDEX.md` — the T-number dictionary |
| | `claude-chat/specs/*` — Chat writes, you consume |

`TRACKER.md` is the **only** status document in this repo. Nothing else records what is done.
`TASK-INDEX.md` deliberately holds no status — if you want to write "T9 is done" there, that
belongs in `TRACKER.md`.

**Claude Code / Antigravity split:** Claude Code builds the **first of a kind** (engine, data
models, contracts, anything expensive-if-buggy). Antigravity **replicates** the rest (remaining
recipes, UI components, styling, config) — always given a Claude-built example to copy.
The human reviews every diff before merge, and owns Play Console, Families Policy, tax, ASO
and kid-testing.

---

## Conventions

- Functional React with hooks. One component per file, PascalCase.
- Components stay **presentational** where possible; logic lives in hooks/services.
- Recipes live in `src/recipes/`, one file per skill, all matching `RECIPE_TEMPLATE.md`.
  Every recipe passes the shared validator before merge.
- **No hardcoded questions. No secrets in code.**
- Tailwind: use theme tokens (CSS variables), never hardcoded colours — band theming depends
  on it, and `lint:hex` enforces it.
- **Colour semantics are locked** (DECISIONS 2026-07-04 / 07-05 / 07-15): amber = reward and
  achievement **only**; correct = success green; wrong = soft coral (never red, never amber);
  hints = sky; review-due = teal `--color-review`. Any future "needs attention" state inherits
  teal, never amber.
- `KidButton` is **answer-tile-specific**. Navigation CTAs use the separate token-based pattern.
  Don't cross that boundary.
- Tests: Vitest + React Testing Library. Per-file `// @vitest-environment jsdom` where needed.
- Branding strings come from `src/config/brand.js`. Don't hardcode the product name.

## Git discipline

One branch per task. Small commits. Descriptive messages that say *why*, not just *what*.
The human reviews and merges. **Don't assume a prior session's uncommitted work exists** —
and don't assume yours survived; check.

---

## Stitch mockups — how to handle

Stitch produced screen mockups. They are **layout references only**, never code to import.
They contain decisions we have **overridden**: a robot mascot (we use Tinku), a dark theme
(we use light for Wonder), `$` pricing (we use ₹), and placeholder non-maths questions
(we generate). Apply the locked decisions; do not reproduce the mockup's mascot, theme,
pricing or content.

---

## Keep ARCHITECTURE.md current (standing instruction)

`ARCHITECTURE.md` is the living map of the codebase — the cheap "code view" that saves tokens
in later sessions.

- **Read it** early in a session to orient without scanning every file.
- **Update it** whenever you add a module, move things, or change how pieces connect —
  in the **same commit** as the code change.
- Keep entries SHORT: a few lines per module — what it does, key exports, what depends on it.
  A navigation aid, not exhaustive docs.

---

## When unsure

Stop and ask the human. Check `DECISIONS.md` first. If the answer isn't there, ask — then
record it there so the next session doesn't have to.
