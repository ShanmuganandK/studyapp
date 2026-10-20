# AGENTS.md — Project Orientation for AI Coding Agents

> This file was `CLAUDE.md` until 2026-10-18. It is now `AGENTS.md`, the agent-neutral name. A
> one-line `CLAUDE.md` stub (`@AGENTS.md`) is kept **only** so Claude Code, which looks for that
> filename, still loads these instructions. **Edit this file, never the stub.**

> **Read at the start of every session, before writing any code:**
> this file → `DECISIONS.md` → `STANDARDS.md` → `ARCHITECTURE.md` → `claude-chat/TRACKER.md`.
>
> For anything else, see **`DOCMAP.md`** — it maps every document in the repo, says who may
> write it, and flags which ones describe **finished** work. Do not read the other ~20 markdown
> files speculatively; go to the map when you need a specific area.
>
> Resolve ambiguous project vocabulary against `GLOSSARY.md` before acting on it — if a term
> isn't there, ask the human rather than assuming.
>
> **Master HEAD rule.** Before pushing to or merging into `master`, confirm master's current HEAD
> (and `origin/master`'s) against your own last-known state and flag a mismatch before
> proceeding — however the push instruction is phrased and whoever gave it. (Closes a gap found
> 2026-09-02: master took an unreviewed direct push twice in three sessions, both from
> instructions executed without checking whether the agent's picture of master was current.)
>
> Applies to every coding agent (Claude Code, Antigravity, others). **If anything here conflicts
> with a task instruction, stop and ask before proceeding.**

---

## What this project is

**Tinku Math** — a CBSE/NCERT-aligned maths app for Indian children, **Grades 1–2 at launch
(Grade 3 planned, curriculum not yet built — TRACKER #12; DECISIONS 2026-09-23)** (the "Wonder"
band). Mascot is **Tinku**, a flat 2D blue-grey elephant with a glowing math star.
Built solo, targeting India, run from Dubai.

The heart is a **learning loop**: a child practises procedurally-generated maths, gets safe
remediation on mistakes, and improves over days via spaced repetition. A parent dashboard shows
progress.

**Success is measured by D7 retention, not revenue.** Build for kids returning tomorrow.

**The motivation, in the decisions that bind every choice** (so a session can reason from it
instead of guessing):

- **The average learner is the design target and breaks every tie** (DECISIONS 2026-08-25). A
  strong child shrugs off a bad difficulty jump; an average child decides maths isn't for them
  and puts the phone down. When a pacing choice is uncertain, take the gentler branch. Inflated
  scores, speed penalties and countdowns work against the child this app is for.
- **Never punish.** Wrong answers get a hint and Tinku's encouragement, never red, never a
  harsh shake; a session never ends on a failure (the mood floor).
- **Parents are the trust gate.** The app processes no child personal data and says so in a
  published privacy policy. **A false claim in a children's listing costs more trust than a
  missing feature**, which is why Grade 3 is "coming soon" instead of promised (DECISIONS
  2026-09-23). Never claim more than the build does.
- **Ship, then learn.** The launch itself is the signal source; kid-testing in India resumes
  post-launch and is **not** a launch gate.

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

## Where things stand — orientation snapshot (2026-10-18)

> **This is a snapshot for orientation, not a status document.** `claude-chat/TRACKER.md` is the
> only status source; if this section and the tracker disagree, **the tracker wins** — and fix
> this section in the same PR. Verify against the code before repeating any line here publicly.

- **Launch posture (DECISIONS 2026-09-23):** public release for **Grades 1–2**, Grade 3 "coming
  soon". Live at **`https://tinku.stringus.com`** (permanent origin — moving it wipes every
  user's `localStorage` progress and strands installed PWAs, so it is never changed casually).
  Done: domain (L1), first-run grade picker (L3), published contact **`tinku@stringus.com`**
  and the privacy-policy operator line (**"operated by Stringus, based in the UAE"**). Developer
  name **Stringus**, **personal** Play Console account (the account ID is not stored in the
  repo).
- **Android (TRACKER L4):** Capacitor (DECISIONS 2026-10-15). A **debug APK builds in CI on every
  merge to master and has run on a real phone** (Samsung S25 Ultra, installed with `adb install
  -r`), with **no INTERNET permission** — it loads and plays quizzes without one (verified on that phone). The **signed release AAB has never been built** (needs the upload key + 4 secrets in the
  `android-release` environment) and it gates the closed test (L9). The Android activity is
  **locked to portrait**. A sideload through the phone's own installer failed once ("App not
  installed", cause unknown); `adb` works. Steps: `ANDROID-RELEASE-RUNBOOK.md`.
- **Still open (mostly human):** Play account verification (L2), phone regression walk on the new
  domain (L5), store listing + Data Safety + Designed-for-Families (L7), a written success bar
  (L8), the 12-tester × 14-day closed test (L9).
- **Content coverage is partial — do not imply otherwise.** `src/recipes/skillMap.js` plans 35
  skills (Grade 1: 19, Grade 2: 16, Grade 3: none). **17 are `ready`: Grade 1: 7, Grade 2: 10**,
  all in the number/arithmetic strands (counting, comparing, add/subtract, 2-digit with
  carry/borrow, 3-digit numbers, ×-tables of 2/5/10). **Not built:** shapes, measurement, time,
  money, data/pictographs, patterns, sorting, ordinals, tens-and-ones, hundreds, numbers 21–99.
  Roughly half of those need question formats and art that don't exist yet, plus a teacher
  review of their distractor rules (TRACKER #7, #12). Store copy and in-app text must describe
  what exists (counting, add/subtract, place value, the 2/5/10 tables), **not** "the CBSE
  syllabus". Count the `ready` skills from `skillMap.js`, not from memory or from `README.md`.
  **The Grade 2 suggested path works only because the composer skips unbuilt prerequisites — an interim patch
  (DECISIONS 2026-10-19, 2026-10-20); the app still teaches no place value.** Building numbers 21–99 and
  tens-and-ones is the real fix. **Suggestions are grade-scoped** (DECISIONS 2026-10-20): a Class 2 child starts on
  Class 2 skills with Class 1 assumed cleared; progress is per skill id; there are no separate profiles (one child per
  device). **The closed-test success bar (L8) is decided** (7 of 12 children on 3+ days in week 1 and 2+ in week 2); what
  counts as "practised" is decided (a finished session) and **measured on the device** (`practiceDays`, shown in the parent
  dashboard and included in the export); the tester protocol is still to be written. The **Class** and **Colours** controls are
  parent-zone settings; the warm-up experiment is a tester tool (`VITE_TESTER_TOOLS`, debug APK only; DECISIONS 2026-10-20).
- **Screens on the new layout system:** only the **quiz and its summary** use the spacing budget
  (see "Quiz screen layout" below). The grade picker, skill list and parent screens do not yet;
  the first-run grade picker has a known layout bug (content stops about half-way down).
- **Design work in flight.** `design-handoff/` (brief, tokens, screenshots, mascot poses,
  `capture.mjs`) and `design-system/` (recommendations **DS-1…DS-8**) are **proposals and
  reference copies, not adopted decisions** — `src/index.css` and `tailwind.config.js` stay the
  source of truth. Biggest real finding: correct-green with white text is 2.28:1 in the default
  palette; Deep Sea CTA text is 2.06:1. A redesign must keep the **locked colour grammar**
  (amber = reward only, green = correct, soft coral = wrong, sky = hint, teal = review-due).

---

## Tech stack (do not change without a decision)

- **React 18 + Vite** (SPA), **Tailwind CSS v4** (`tailwindcss ^4`, `@tailwindcss/postcss`; migrated
  2026-10-16 from v3 after a Dependabot bump broke master twice: v4 is a config/CSS migration, not a
  lockfile change). The design tokens are still in `tailwind.config.js`, loaded from `src/index.css` with
  `@config`, so every token class keeps its name. Fonts are self-hosted via Fontsource (Nunito + Baloo 2);
  no CDN. **Do not use v3-only utilities** (`flex-shrink-*`, `bg-opacity-*`, bare `shadow`/`blur`/`rounded`,
  `outline-none`): v4 renamed or removed them (`shrink-*`, `/opacity`, `*-sm`→`*-xs`, `outline-hidden`).
- **PWA** (offline-capable, installable) — primary delivery on the web — **plus a Capacitor Android
  wrap** (`android/`, `capacitor.config.json`; `npm run build:android` bundles a separate
  `dist-android/` with no service worker). Android toolchain: **JDK 21**, Capacitor 8, compile SDK 36.
  The icons and the mascot are **Tinku**: icons come from `scripts/build-icons.py`, the six pose
  WebPs from `scripts/build-mascot.sh` (originals in `branding/mascot-originals/`); both are dev
  tools. Build size is guarded by `distLean.test.js`.
- **Persistence: browser `localStorage`, via the `progressStore` seam.** Keys are prefixed
  `tinku:v1:`. This is the *intended* architecture for MVP, not a shortcut.
- **No backend. No Firebase. No network calls of any kind from `src/`.**
- **Deployment:** Netlify. Production origin **`https://tinku.stringus.com`** (custom domain);
  every PR also gets a Netlify deploy preview (the Netlify site itself is still named
  `shan-studyapp-cbsc`). Android: GitHub Actions `android.yml`. Google Play later (L2–L9).
- Target devices: **low-end Android up to current upper-mid-range phones, portrait.** Performance
  matters. Animate only `transform` / `opacity`. Foldables and landscape are not targets.
- Tooling: Node 22 (CI), Vitest, ESLint 9 flat config, Playwright (Chromium) for
  `scripts/visual-snapshot.mjs`, `scripts/check-quiz-layout.mjs` and `design-handoff/capture.mjs`.

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
  a harder range is a *different skill*. A difficulty rung is not always a magnitude step: for
  `g2.add.2d-nocarry`, a rung selects a **strategy**, not a bigger number (DECISIONS 2026-08-27) —
  other skills generalise to that model as each is revisited.
- **Practice stops when mastery is proven** (~80% at hard level), then the skill enters
  spaced-repetition review and the child moves on. `level` promotes on **one** strong session
  (subject to `LEVEL_UP_REQUIRES_HARD` at the 4→5 hop); `difficulty` needs
  `DIFFICULTY_UP_STREAK` (2) **consecutive** strong sessions per rung. One weak session drops
  either axis. There is **no elapsed-time gate** (DECISIONS 2026-08-31, 2026-09-02).
- **Wrong answers are deliberate:** each distractor encodes a known misconception (e.g.
  `forgot-carry`), so hints can be targeted and the dashboard can explain *why* a child struggles.
- `misconceptions-reference.md` is canonical for tags and rules. **When a recipe and that doc
  disagree, the doc wins** — and check the distractor *rule* matches, not just the label.

This is why content is "solved forever" and why new grades/boards are cheap later.
**Protect the contract.** Screens, mastery and dashboard only ever see contract output —
never recipe internals.

---

## Quiz screen layout (DECISIONS 2026-10-18)

The quiz screen is one **spacing budget**, not a stack of elements that shrink each other.

- `SessionPlayer` is a size container (`.quiz-stage`); every size (Tinku, hint slot, type, tiles,
  counted objects, compare numbers) is a CSS variable in `src/index.css`, computed from the
  stage's own height/width. **Tinku is never resized for a hint** — the hint has a reserved slot.
  Per-grade profiles live in `src/config/quizLayout.js` (young grades get the big-Tinku profile).
- The bottom Home/Parent nav is **hidden while a question is showing** and returns on the
  summary. The Android activity is **locked to portrait**. The counting tray sizes itself from
  the room the question area has, so 11–15 objects (3 rows) shrink instead of clipping.
- When you change anything on these screens, run `npm run build && npm run layout:check` (on
  demand, **not in CI** — CI has no browser). It measures fit, hint-moves-nothing, Tinku size,
  dead space and tap size on 5 phone sizes, plus a hardest-rung counting pass. In the cloud
  sandbox it finds Chromium via `PLAYWRIGHT_BROWSERS_PATH`.
- Do not hardcode sizes in these components; read the variables.

---

## Guards — these exist to be believed

CI runs on every push and PR: `lint` → `lint:hex` → `privacy:check` → `test:run` → `build`,
then re-runs the bundle guards (`noFirebaseAuth.test.js`, `distLean.test.js`) **after** the build.
**CI green is the guard** — the test count changes almost every commit, so no count is pinned
here; check the CI run for the current total. `android.yml` also runs on every push to master
(debug APK). Run the CI checks locally before pushing; a push that turns CI red costs a cycle.

| Guard | Protects |
|---|---|
| `noFirebaseAuth.test.js` | No Google identity endpoints in `dist/`. Backs a published privacy claim. |
| T91 analytics guard | No analytics SDK in the build. |
| `privacyPolicy.test.js` + `npm run privacy:check` | Committed `public/privacy.html` is byte-identical to generator output; page loads no external host; the policy makes no unshipped or unverified claim; `OPERATOR_LINE` is asserted **both directions** (blank → names nobody + TODO survives; set → reaches both surfaces). |
| `androidProject.test.js` / `androidWorkflow.test.js` | The Android project: no permissions, cache-only FileProvider, no remote URL, backup policy, portrait lock, no `--` in XML comments, workflow shape. |
| `distLean.test.js`, `mascotAssets.test.js` | Build size budget; the six mascot WebPs are real transparent 1024 px images. |
| `scripts/check-raw-hex.mjs` | Design-token discipline — no raw hex in components (DECISIONS 2026-07-04 / 07-05). |
| `scripts/frozen-legacy.mjs` | ONE shared list of frozen paths, so guards can't disagree. |
| `npm run layout:check` | Quiz-screen layout on real phone sizes. **On demand, not CI.** |

**Standing rule: prove a new guard RED before trusting it green.** Inject the violation, watch
it fail, revert (or run it against the pre-fix build). A guard that has never failed is
unverified. Lint is scoped to **new code** — every pre-existing violation lives in frozen legacy
that the migration rule forbids editing. Exclusions are explicit commented lists, never a silent
`--quiet`.

---

## Working rules

**No claim without an artifact.** Do not write "done" in any document unless the thing exists in
the repo. On 2026-08-15 three tracker claims were sampled and three were false — including a
"standards guard wired into CI" that had never been committed. That is why the claims rule
exists. Say plainly what was **not** verified (for example "not yet seen on a real phone").

**Measure, don't infer, when the claim is public.** "No `fetch` in `src/`" is an argument;
"the built app issues 12 requests, all same-origin" is a fact. Anything that ends up in the
privacy policy or the store listing gets the second kind.

**Stop and flag rather than resolving silently.** Do not invent product decisions. Check
`DECISIONS.md`; if it isn't there, ask the human, then record the answer there.

**Scope fences are real.** Don't touch unrelated code. Don't over-engineer. Legacy is frozen:
`src/utils/generators/`, `src/data/questions*`, `masteryEngine.js` and the other paths in
`scripts/frozen-legacy.mjs` are never edited — new code never imports them.

**Published text is edited at its source.** The privacy policy lives in
`src/config/privacyPolicy.js`; `public/privacy.html` is **generated** — change the source, run
`npm run privacy:build`, commit both, and bump `LAST_UPDATED` when the published words change.
Never hand-edit the HTML. The published contact is **`tinku@stringus.com`**; `OPERATOR_LINE`
**must match the Play developer name** ("Stringus") — change both together. Keep personal
addresses, Play account IDs and any secret out of the repo. Never paste secrets (upload key,
passwords) into chat, commits or logs.

**Deploy verification.** After deploying, confirm the Netlify **Published** commit SHA matches
`master`, and that `https://tinku.stringus.com` (the production origin, not a `netlify.app`
preview) serves it. A stale service-worker cache and a genuinely stale published deploy look
identical from outside, and Netlify serves the last *successful* build indefinitely. Incognito
first — it bypasses the SW and splits the two in 30 seconds.

**Don't over-claim content.** Before writing any user-facing or store-facing sentence about what
the app teaches, count the `ready` skills in `skillMap.js` (see the snapshot above). Plans,
specs and `README.md` describe intent; `README.md` in particular still lists Grade 1 shapes,
time and money and a "Candy Land" theme that don't exist — treat it as legacy, not as a feature
list.

---

## Who owns what

> **The coding agent owns what the code IS. Claude Chat owns what we DECIDED.
> The human owns what happens outside the repo.**

| You (Claude Code / Antigravity / other coding agent) write | You read, but do not write |
|---|---|
| `src/`, tests, build config | `DECISIONS.md` — Chat's, append-only. You may add *verified facts* with human approval; never a product decision. |
| `ARCHITECTURE.md` — **same commit** as the change | `AGENTS.md`, `STANDARDS.md`, `DOCMAP.md` — rules, not status |
| `claude-chat/TRACKER.md` — when reporting work you landed | `claude-chat/TASK-INDEX.md` — the T-number dictionary |
| | `claude-chat/specs/*` — Chat writes, you consume |

`TRACKER.md` is the **only** status document in this repo. Nothing else records what is done.
`TASK-INDEX.md` deliberately holds no status — if you want to write "T9 is done" there, that
belongs in `TRACKER.md`.

*Exceptions, recorded:* this file is normally Chat's, but the human explicitly asked a coding agent
to refresh it on **2026-10-13** (snapshot, tech-stack and CI corrections) and on **2026-10-18**
(rename `CLAUDE.md` → `AGENTS.md`, drop stale lines, add the Android and quiz-layout facts). Both were
one-off instructions, not a standing licence — the "Where things stand" snapshot is the part most
likely to go stale, so whoever lands a launch-relevant change updates it in the same PR.

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

**How work lands in practice:** a task branch → push → a **draft PR** against `master` with the
checks you ran in its test plan → the human marks it ready and merges. Watch the PR for CI and
review events and fix red CI yourself. Stacked PRs are fine when a change genuinely depends on
an unmerged one; retarget to `master` once the base merges. In cloud sessions GitHub is reached
through the GitHub MCP tools, not the `gh` CLI. **Dependabot PRs** are not auto-safe: read what
they change (a lockfile-only patch bump with green CI is usually fine; a **major** bump such as
Tailwind 3→4 needs a real migration or an ignore). **Do not push or merge to `master`
directly**; the Master HEAD rule at the top of this file still applies.

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
