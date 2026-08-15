# TRACKER.md — Tinku Math Gamified Evolution

> Canonical task tracker. Replaces the Google Sheet (multiple stale Drive copies
> as of 2026-07-16 — this file is the single source of truth going forward).
> **Maintenance rule:** update this in the SAME COMMIT as the work it describes,
> like ARCHITECTURE.md. Optimized for "what's next," not for exhaustive history —
> git log holds the detail behind each line.

_Last synced: 2026-08-15_

---

## ⚑ Current shape of the product (read this first)

Per **DECISIONS 2026-08-14**, MVP is **device-local, processes no child personal
data, and takes no money**. That is a deliberate scope choice, not a limitation
waiting to be lifted: it keeps us outside DPDP s.9 / Rule 10 entirely so we can
ship and get real signal before spending on legal infrastructure.

**In:** device-local progress · no accounts · no cloud · no analytics · no ads ·
no outbound messaging · no payment.
**Out (deferred, not cancelled):** T109 auth rebuild · Firestore · cloud sync ·
parent accounts · paywall · subscriptions.

**Positioning is unchanged** — still a CBSE/NCERT-aligned maths app. Rebranding
as a "game" was considered and rejected (see DECISIONS).

---

## Now — build queue

| # | Item | Status | Detail |
|---|---|---|---|
| 1 | **Network audit of shipping build** | ✅ **Done 2026-08-15** | Found 1 blocker (startup Firebase Auth init), now fixed — see the audit block below. Everything else clean. |
| 1b | **De-Firebase the MVP build** | ✅ **Done 2026-08-15** | Blocker from #1 closed. Firebase dep dropped, `lib/firebase.js` + `firebaseAdapter.js` deleted, `localAdapter` rewritten as an inert null-user seam, guard test added. **The app now makes zero off-origin requests at runtime (verified in a real browser).** |
| 2 | **Privacy policy + Play Data Safety form** | ⏳ **Next — now unblocked** | Play requires a policy for every app regardless of collection. Notice wording per DECISIONS 2026-08-14 — no absolute "we collect no personal data" claim; keep the store/hosting technical-data line. **The app-side claim can now be stated flatly** (no accounts, no auth SDK, no network calls from `src/`) — see the amended DECISIONS 2026-08-14 residual-obligations paragraph. |
| 2a | **CI wiring / standards guard** | ✅ **Done 2026-08-15** | Was a false claim (see the corrected Done entry below). Now real: `eslint.config.js` (ESLint 9 flat), `scripts/check-raw-hex.mjs`, `scripts/frozen-legacy.mjs`, `.github/workflows/ci.yml`. **Proven red on a real Actions run**, not trusted green. |
| 3 | **Progress export/import** | ⏳ Next | Parent-zone download/restore of progress as local JSON. Replaces cloud backup for MVP; built on the existing `progressStore` seam. Zero server, zero personal data. **v1 item, not a nice-to-have** — device-local PWA progress is fragile (clear-data / new phone / uninstall). |
| 4 | Phone regression checklist (A–L) | 🔶 In progress | Manual walk on real device + DevTools. Sections A/B/C need RE-WALK (skill-state grammar changed). See `phoneregressionchecklist.pdf`. |
| 5 | Screen 3-B verdict (journey path vs. cards) | ⏳ Pending | Judge on current (post-grammar-fix) build. Path is live on master; card view at `?home=cards`. Kid-testing is the gate. |
| 6 | Session composer build | ⏳ Queued | Spec settled (below). Unaffected by the legal re-scope — pure local engine work. |
| 7 | Remaining ~29 recipes | ⏳ Background | Curriculum breadth. Fully unblocked. |
| 8 | **Designed-for-Families programme rules** | ⏳ Read before submit | We target under-13s, so we are in it. Content + ads rules are independent of DPDP. |

## Out of MVP scope (by decision, not blocked)

> These were previously "gated on lawyer verification." As of 2026-08-14 they are
> **deliberately out of scope** — nothing is waiting on anyone. Revisit only on the
> trigger below.

| Item | Note |
|---|---|
| T109 — Auth rebuild (anonymous→Google, Firestore) | Deferred. Legacy auth stays frozen; no new auth work in MVP. |
| Cloud sync / parent accounts (Layer 2) | Deferred. Export/import (#3) covers the backup need locally. |
| Paywall / subscriptions | Deferred. **No payment of any kind in MVP.** When money returns it is Play Billing only — most likely a one-time unlock, never direct/informal payment. |
| Analytics (Firebase) | Deferred past MVP entirely — DECISIONS 2026-07-16. |
| Weekly parent summary (WhatsApp/email) | Deferred past MVP entirely — DECISIONS 2026-07-16. |
| DPDP lawyer consult | Deferred to the revisit trigger. Questionnaire + findings preserved below. |
| KG band expansion | Wonder band stable + kid-test signal. |

**Revisit trigger:** real retention signal, or unprompted willingness to pay.
Then engage the DPDP lawyer + CA and choose between the token-VPC path (full
Layer 2) and a paid-unlock-without-accounts path.

## Parallel (non-code)

| Item | Status | Detail |
|---|---|---|
| **CA / tax questionnaire — SEND** | ⏳ Still live | `claude-chat/questionnaire-ca-tax-uae-india.md`. **Not** deferred with the DPDP consult. Section D1 (India day-count before UAE income is at risk of Indian residence taxation) is time-sensitive ahead of the India kid-testing trip. |
| **India day-count log** | ⏳ Start now | Track days-in-India from now, independent of when the CA replies. |
| Kid-testing in India | ⏳ Planned | Signal source for the 3-B verdict, FRONTIER_PICK validation, and the revisit trigger above. |
| Teacher review of `misconceptions-reference.md` | ⏳ Pending | ~68 rows, one-time, arrange in India. Unblocks richer dashboard insight. |

---

## Done — Network audit of the shipping build (2026-08-15)

Audited `src/` + the built `dist/` (Vite build, `index-CKPQEueh.js`). Method: grep source
for network APIs; extract every external host from the built bundle, SW and `index.html`;
trace the static import graph from `App.jsx`.

### 🔴 BLOCKER (FOUND, then FIXED same day) — Firebase Auth initialized on every app start

The audited bundle contained the **Firebase Auth SDK** and **ran it at launch**, so the claim
"nothing leaves the device" was **not true**. Fixed in the de-Firebase commit — resolution and
verification at the end of this block.

- **Chain (all static ESM imports, so the module body always executes):**
  `App.jsx` → `AuthProvider` → `contexts/AuthContext.jsx` → `services/authService.js`
  → `import { firebaseAdapter }` → `services/firebaseAdapter.js` → `lib/firebase.js`
  → **`initializeApp()` + `getAuth()` at module scope.**
- **`isFirebaseConfigured` does not prevent this.** It only chooses *which adapter object*
  is called; the static import has already executed `lib/firebase.js` by then.
- **Live Google endpoints present in the bundle:** `identitytoolkit.googleapis.com`,
  `securetoken.googleapis.com`, `apis.google.com`, `firebaseapp.com`.
- **Prod takes the Firebase path, not the local one.** `netlify.toml` whitelists the
  `VITE_FIREBASE_*` keys, so they are set at build time; the audited `dist/` confirms it —
  the `mock-api-key-for-local-dev` fallback string is **absent** from the bundle (real key
  inlined) ⇒ `isFirebaseConfigured === true` ⇒ `firebaseAdapter`.
- **Actual runtime exposure:** `AuthContext` calls `onAuthStateChanged` on mount. On a *fresh*
  device with no persisted user this resolves locally (no request). But on **any device
  carrying a persisted legacy Google session**, launch triggers a token refresh to
  `securetoken.googleapis.com` — an outbound request carrying a refresh token and the child's
  device IP to Google. Legacy installs from the popup-auth era are exactly that population.
- **Mitigating:** `Login.jsx` is **not rendered anywhere**, so no *new* sign-in can occur.
  This limits the blast radius; it does not remove the init or the SDK.
- **Also:** removing it is a bundle win on low-end Android (`firebase@12.9.0` is a prod
  dependency; total JS is 318 kB).
**✅ RESOLUTION (same day).** MVP has no accounts at all (DECISIONS 2026-08-14), so the SDK had
no job. The `firebase` dependency is gone (84 packages removed), `lib/firebase.js` and
`services/firebaseAdapter.js` are deleted, and `localAdapter` is now an inert **null-user**
seam. `AuthProvider` **stays in the tree** — it still owns the parent passcode and profile
state; only the adapter beneath it changed, so no call-site moved (same seam pattern as the
T91 analytics no-op). The `protobufjs` override went too: it existed only to pin Firebase's
transitive dep for GHSA-j3f2-48v5-ccww, and protobufjs has left the tree entirely.

The old `localAdapter` returned a **fake signed-in user** (`explorer@local.dev`); reusing it
would have flowed a fabricated account into `AuthContext` and printed "Logged in as
explorer@local.dev" in the parent dashboard. It was nulled, not reused.

**Verification:**

| Check | Result |
|---|---|
| Tests | **308 green** (299 baseline + 9 new). ⚠️ The "296/296" figure below was **stale** — master measured **299** before this change. |
| Built bundle | **Zero** matches for `identitytoolkit` / `securetoken` / `apis.google.com` / `firebaseapp` anywhere in `dist/`. |
| **Runtime (real browser, built app)** | **12 requests, ALL same-origin. Zero off-origin. No page errors.** This is the strongest form of the privacy claim — measured, not inferred. |
| Blank-screen risk | Clear. The null user must still let `AuthContext` clear `loading` (it gates `{!loading && children}`); the app renders normally. |
| Child progress | **Unaffected.** `progressStore` keys on `'tinku:v1:skills'`, never on a uid — progress was always independent of auth. |
| Parent passcode | **Unaffected in the normal case.** Already keyed `math_kids_settings_anon` (`user?.uid ?? 'anon'`), and `user` was already null in prod. |
| Bundle size | **317.6 kB → 201.1 kB** (−116.5 kB, −37%) — a real win on low-end Android. |

⚠️ **Narrow edge case, accepted:** a device carrying a *persisted legacy Google session* had its
passcode stored under `math_kids_settings_<uid>`, and now reads `…_anon` — so that device's
parent gate reverts to unset until a new code is entered. It never touches child progress, and
the gate is a deterrent, not a security boundary (DECISIONS 2026-07-14). Affects only testers
who signed in on a build from before `Login.jsx` was unwired. Same class: any profiles saved
under a uid are no longer loaded, so `grade` falls back to `DEFAULT_GRADE` — harmless while
every `ready` skill is Grade 1.

### ✅ Clean — everything else

| Checked | Result |
|---|---|
| `fetch` / `XMLHttpRequest` / `sendBeacon` / `WebSocket` / `EventSource` in `src/` | **None.** Only hit is a `vi.stubGlobal` in `services/__tests__/analytics.test.js`. |
| **Fontsource woff2 — bundled or CDN?** | ✅ **Bundled.** All 9 woff2 emitted to `dist/assets/` and served same-origin. **No CDN fetch, no Google Fonts.** |
| Firebase **Analytics** SDK | ✅ **Absent.** No `getAnalytics`, no `googletagmanager`/`gtag`/`app-measurement`/`google-analytics.com`. The `@firebase/analytics` strings in the bundle are name constants in `@firebase/app`'s component registry, **not** the SDK. The T91 guard test holds. |
| Firestore / RTDB | ✅ **Absent.** No `firebaseio.com` or Firestore endpoints — registry name strings only. |
| Service worker (`dist/sw.js`) | ✅ **Clean.** Plain Workbox precache + `NavigationRoute`. No telemetry, no runtime remote caching, no external hosts. |
| `dist/index.html` | ✅ **Clean.** No preconnect/dns-prefetch, no third-party script or stylesheet. |
| Remaining external hosts in bundle | `wa.me` (parent-initiated feedback link, parent dashboard only — expected, unaffected per DECISIONS 2026-07-16); `bit.ly` traced to a **generic string inside vendor code, no call site**; `reactjs.org`/`w3.org`/`localhost` are error-message and namespace strings. |

### ⚠️ Non-privacy defect confirmed in passing

The SW precache list **omits the woff2 files** (`globPatterns` in `vite.config.js` lists
`js,css,html,ico,png,svg,webp` — no `woff2`). Fonts are bundled but **not precached**, so an
offline first load falls back to system fonts. Not a privacy issue — this is the known follow-up
already noted in DECISIONS (2026-07-04 typography) and ARCHITECTURE; the audit **confirmed it was
still open**.

**✅ FIXED 2026-08-15**, scoped to the **latin** subsets only. Principle recorded for next time:
**precached subsets track rendered scripts.** Fontsource splits each family by unicode-range and
the browser only *fetches* the ranges a page uses — but precaching is indiscriminate, so an
unscoped `woff2` glob pulled all nine subsets (devanagari, cyrillic, vietnamese included) to
render Latin. Precache **26 entries / 2447.98 KiB → 19 / 2203.05 KiB**, i.e. 244.93 KiB off the
install payload for ~71 KiB of font actually rendered. Revisit if UI localisation ships.
Verified in a real browser: offline reload renders with zero failed requests and `document.fonts`
reports **Baloo 2 Variable + Nunito Variable loaded**, not a system fallback.

### 🔴 Second finding (FOUND, then FIXED) — the "standards guard, wired into CI" did not exist

Surfaced while running `npm run lint` before committing. **`npm run lint` failed outright:**
ESLint 9 found no `eslint.config.js`. There was also **no `.github/workflows/`** and **no
`scripts/`** directory — on this branch *or on `master`*. (CodeQL and Netlify checks *were*
running via default setup, but neither runs our lint, hex guard or tests.) The "Done — Quality / Guardrails"
entry below claims *"Standards guard (automated) — ESLint `no-console`/empty-catch/
unhandled-promise + raw-hex grep script, wired into CI; violations can't merge."* That is
**not true of the committed repo**: nothing is wired, and nothing blocks a merge.

This matters more than usual: the de-Firebase guard test and the T91 analytics guard are only as
good as the thing that runs them. With no CI they ran only when someone remembered
`npm run test:run` locally.

**✅ RESOLVED (Now #2a).** Both were done — the config and workflow were *written*, since nothing
existed in git history to restore, and the false claim was rewritten to describe exactly what
shipped. Details in the corrected "Standards guard" entry below. The one deliberate narrowing:
the guard is scoped to **new code**, because every pre-existing violation lives in FROZEN legacy
that the migration rule forbids editing.

---

## Done — Legal research & re-scope (2026-08-14)

**Status: verification closed.** Read against three independent reproductions of
G.S.R. 846(E) (13 Nov 2025) — `dpdpa.com`, `dpdpa.in`, and **Spice Route Legal**,
which reproduces the full notification (preamble → Seventh Schedule). SRL is the
reference text. Not yet checked against the Gazette PDF itself — sufficient for
the current decision, close before any Layer 2 build.

⚠️ **Reproduction quality varies — do not trust a single source:**
`dpdpa.in` **omits Rule 10's Illustrations** entirely; `dpdpa.com` **drops one
Fourth-Schedule Part B entry** and mis-cites the Fourth Schedule as *"[See rule 11]"*
(correct: **rule 12**). An interim read off `dpdpa.in` briefly and wrongly suggested
the Illustrations weren't in the final Rules.

**Findings**

- **Commencement, from Rule 1(2)–(4):** Rules 1, 2, 17–21 on publication;
  Rule 4 at one year (13 Nov 2026); **Rules 3, 5–16, 22, 23 at eighteen months
  (13 May 2027)** — Rule 10 is in that third bucket.
- **Rule 10** — parent must be checked as an *identifiable adult* via (a) reliable
  identity/age details **already held by us**, or (b) details voluntarily provided by
  the individual or **through a virtual token issued by an authorised entity**
  (incl. via a Digital Locker Service Provider). Rule 10's four **Illustrations** are
  in the final Rules; **Cases 2 and 4** (parent not an existing registered user — our
  situation) direct us to the government-details / token route.
  **OTP and Google sign-in are not on that menu.** Also: 10(2)(c) — Digital Locker
  providers are *"as may be notified"*, so the designated set may not be settled.
- **Fourth Schedule `[See rule 12]`** — Part A(3) *educational institution* exemption
  is **NOT available to us** (we are an app, not an institution of learning; condition
  assumes *children enrolled*). **Part B(6)** *does* permit processing needed to confirm
  a Data Principal is not a child and to observe Rule 10 due diligence — the bootstrap,
  if that path is ever built.
- **Decision taken:** don't build the token/VPC rail on an unvalidated product.
  MVP processes no child personal data at all → s.9 / Rule 10 never trigger.
  **DECISIONS 2026-08-14.**
- **Rebrand-as-a-game considered and rejected** — DPDP turns on processing, not on the
  label; and *online gaming intermediary* is a defined class in the Third Schedule.

**Answers picked up for free** (were open questions, now just text — full list in DECISIONS):

| Was | Now |
|---|---|
| Grievance officer — India residency required? | **Rule 9** — publish contact for DPO or a person able to answer processing questions. **No residency requirement in the rule text.** |
| Grievance response window? | **Rule 14(3)** — not exceeding **90 days**, published on site/app. |
| Breach notification timing? | **Rule 7** — Data Principals without delay; Board without delay (description) then detailed report within **72 hours**. |
| Could we act as a Consent Manager? | **No** — First Schedule Part A requires an India-incorporated company with net worth ≥ **₹2 crore**. |
| Does the 3-year erasure rule hit us? | **No** — Third Schedule binds e-commerce ≥2cr, online gaming ≥50L, social media ≥2cr users only. |
| ⚠️ New constraint for Layer 2 | **Rule 8(3)** — personal data, traffic data and processing logs must be retained a **minimum of one year**. This is a FLOOR that cuts against delete-on-withdrawal designs. Irrelevant under MVP (we process nothing); load-bearing the day Layer 2 returns. |

**Still open for counsel (one question):** the Rule 10(1) qualifier — *"identifiable
**if required in connection with compliance with any law for the time being in force
in India**"* — whether it narrows the identifiability duty.

**Also done**

- **Questionnaire v2 — CHAT DRAFT ONLY, not committed** (corrected 2026-08-15). This entry
  previously read as though v2 were parked in the repo and ready to send. It is not: v2 exists
  only in a strategy-chat session — 22 questions → 12, answered items retired to a §0 "closed,
  please confirm" table. **The committed file `questionnaire-lawyer-dpdp.md` is still v1**
  (22 questions, sections A–F, no §0). Either commit v2 before the pack is sent, or send v1
  knowingly. **A4 is annotated in place in v1** as closed *unconditionally* — its factual
  premise was verified by the network audit (see the Done block above).
- ✅ `claude-chat/` now lives in the repo (self-hosted GitHub MCP working) — Drive fallback retired.

## Done — UI Overhaul (T111–T115)

- **T111** Screen 1 — tokens/foundation
- **T112** Screen 2 — Celebration (beat sequence, mastery-up amber beat)
- **T113** Screen 3 — Home/skill-select (card reskin)
- **Screen 3-B** — Journey-path experiment, live on master, card view preserved at `?home=cards` — **verdict still open**
- **T114** Screen 4 — Parent dashboard (premium-calm register, amber mastered-highlight, gate+privacy styled)
- **T115** Screen 5 — Sweep (nav polish, loading beats, 200ms transitions, gentle error states) — closes overhaul block

## Done — Quality / Guardrails

- **Standards alignment** (one-time §8 cleanup, new code only) — logger adoption, swallowed catches fixed, MasteryPips de-dup, PIN constant, `alert()` replaced
- **Standards guard** (automated) — ⚠️ **This entry was FALSE until 2026-08-15.** It previously read
  *"ESLint `no-console`/empty-catch/unhandled-promise + raw-hex grep script, wired into CI; violations
  can't merge."* **None of it was committed** — no `eslint.config.js`, no `.github/workflows/`, no
  `scripts/`; `npm run lint` failed outright. Found while running lint before a commit. **Now real,
  and this is what actually exists:**
  - **`eslint.config.js`** — ESLint 9 flat config. Errors: `no-console` (except `utils/logger.js`, the
    sanctioned path), `no-empty {allowEmptyCatch:false}`, `no-unused-vars` (`args:'none'` — the recipe
    contract fixes `generate(difficulty, rng, skillId)` and recipes legitimately ignore an arg),
    `promise/catch-or-return`, `promise/no-return-wrap`, `no-async-promise-executor`,
    `react-hooks/rules-of-hooks`. Warnings: `exhaustive-deps`, `react-refresh`.
  - **`scripts/check-raw-hex.mjs`** — token discipline (DECISIONS 2026-07-04/07-05); ESLint can't
    express it. **`scripts/frozen-legacy.mjs`** — ONE frozen-path list both guards share.
  - **`.github/workflows/ci.yml`** — `npm ci` → lint → lint:hex → test:run → build, on push and PR,
    then re-runs the bundle guard *after* the build (on a clean checkout there is no `dist/` for it
    to inspect and that assertion skips itself).
  - **Scope: NEW code only.** Every pre-existing violation is in FROZEN legacy, which the migration
    rule forbids editing and STANDARDS §8 excludes by its own wording. The exclusion is an explicit
    commented list, not a silent `--quiet`.
  - **Promise coverage is PARTIAL and the wording now says so:** `catch-or-return` catches a `.then()`
    with no rejection path; a bare un-awaited async call is **not** caught. Real floating-promise
    detection needs type information plain JS doesn't give ESLint. **Do not restore the phrase
    "unhandled-promise" without upgrading the tooling.**
  - **Proven red, not trusted green:** `console.log` into `SessionPlayer.jsx` → lint exit 1; raw hex
    into `SkillCard.jsx` → `lint:hex` exit 1; `console.log` into FROZEN `masteryEngine.js` → exit 0,
    confirming the scoping works by design. **Then proven on real GitHub Actions runs:** clean branch
    → `verify` **success**; a throwaway branch carrying the same two injected violations → `verify`
    **failure** at the Lint step (run `31883216200`, branch deleted after).
  - **Precision on the original finding:** the repo had **no committed workflow**, which is what made
    lint/tests unenforced. It was not running *nothing* — **CodeQL** and **Netlify** checks were
    already attached via GitHub/Netlify default setup (no file in `.github/`). Neither runs our lint,
    our raw-hex guard, or our test suite, so the gap was real — but "no CI at all" would have been
    the wrong description.
- **Full regression — automated pass** — 296/296 green at the time (grew from 268 as fixes landed; **now 308** — the count drifted to 299 before the 2026-08-15 de-Firebase work added 9); token discipline, GPU-safety, frozen-file integrity all verified. `docs/responsive.md` "gap" was a FALSE POSITIVE (flat `docs-*.md` naming) — folded 2 missing lines (360/320 test widths; 200ms + prefers-reduced-motion) into existing `docs-responsive.md` instead of creating a duplicate
- **`TinkuBubble` → `HintBubble.jsx`** naming fix in spec

## Done — Parent Gate & Skill-State Fixes (found via phone checklist walk)

- **Parent gate v1.1** — portal-to-`document.body` fix (modal was resolving `position:fixed` against a transform-animated ancestor, off-viewport when scrolled); passcode lifecycle added (change/remove in parent zone; forgot→runtime adult-arithmetic challenge, never stored); decoupled passcode from legacy auth (validation was silently no-op'ing when logged out — pre-dated the reskin). 282 tests.
  - **DECISIONS:** gate = deterrent model, not a security boundary
  - **Note (was for T109, now deferred):** legacy auth never actually implemented anonymous-first despite README claim; passcode storage needs proper re-homing **whenever** the auth rebuild happens; README corrected
- **Skill-state visual grammar unified** — shared `skillStateVisual.jsx` helper, both Home views (path + cards) now derive ring/label/pips identically by construction. Fixed the amber-while-due violation (a review-due node was wearing the achievement color). One loud CTA per screen; due-not-suggested = muted teal cue on neutral ring, never amber. Cross-view identity test added. 296 tests.
  - **DECISIONS 2026-07-15:** grammar locked as above

## Done — Feel Layer

- **Wiring audit** — all 5 sounds (tap/correct/hint/wrong/complete) correctly wired through the sound service; haptics on tap+correct; mute silences both; parent zone correctly silent. Only `sleeping` mascot pose is unwired (inert, harmlessly preloaded). No defects found.
  - **DECISIONS:** mute is session-scoped by design, sound defaults ON each app start (restart-heavy kid usage) — not a bug
  - **T99 candidates captured** (below)

## Done — Composer / Suggestion Direction (spec settled, not yet built)

- Frontier-first suggestion — review is NEVER the headline CTA
- Due reviews embed as 2–3 warm-up questions at session start (composer, not yet built)
- New `FRONTIER_PICK: 'momentum'` config option — most-recently-played unmastered skill until mastered, then curriculum order, prereqs gate. Current production default `'lowest_level'` stays as fallback.
- Rationale: kids don't persist through backward-pointing suggestions; forward motion must be the visible default; retention happens invisibly inside sessions
- Validate against real kid behavior (follow Tinku's pointer, or route around him?) before building

## Done — Legal / MVP Scope Cuts (2026-07-16 — the first simplification)

- **Legal pack created:** `questionnaire-lawyer-dpdp.md`, `questionnaire-ca-tax-uae-india.md`, `dpdp-lawyer-conversation-guide.md` — all reflect Indian-citizen/UAE-resident (NRI) founder profile
- **NyayGuru AI-advocate response received** — coherent on design questions, but **drifted on the one question governed by text** (recommended OTP/Google for Rule 10 twice, the second time while quoting text that doesn't support it). Useful for architecture, not for statutory reading. See 2026-08-14 block above.
- **Analytics removed entirely from MVP** — no Firebase Analytics SDK in the build, zero telemetry (guest or otherwise). Wrapper (T91) reduced to inert no-op seam; call-sites preserved for future reactivation.
  - **DECISIONS 2026-07-16:** MVP ships with NO analytics whatsoever.
- **T107 (privacy notice)** — reopened 2026-08-14: wording needs the store/hosting-data line (see Now #2); the absolute "we collect no personal data" claim is not used.
- **T91 amended** — inert seam pattern, 2026-07-16
- **T47 / T60** (Firebase instrumentation, auth-state analytics) — moved MVP → post-traction
- **Weekly WhatsApp/email summary deferred entirely from MVP** — parent dashboard (on-demand, in-app) IS the MVP report. No outbound messaging, no parent contact details collected at all in MVP. Inbound feedback link (parent-initiated WhatsApp) is UNAFFECTED — stays as-is.
- **MVP legal surface, net result:** collects nothing, sends nothing, stores everything on-device.

---

## Later / Phase 2+ (unchanged, one line each)

- KG1/KG2 band expansion (1st planned audience expansion)
- Explorer band (Grade 4–5)
- Web/desktop responsive (same codebase)
- B2B / schools
- Design-system component library
- Cloud accounts, sync, paywall (revisit-trigger gated)
- Analytics reactivation (consent-gated, post-traction)
- Weekly parent summary via WhatsApp/email (consent-gated, post-traction)
- T99 — Tinku expressiveness / feel-layer polish (candidates below)

### T99 candidates (from feel-layer audit, 2026-07-13)
- Sound on home node/card tap
- Celebration-screen sound beyond the fanfare (star count-up, mastery-up beat, CTAs)
- Screen/view-transition sound
- Tap sound on non-option buttons (back, nav, mute button itself)
- Haptics on hint/complete (currently only tap+correct)
- Wire `sleeping` mascot pose (idle/return beat) — or drop it from preload if not used
- Sound-binding test once feel-layer is finalized

---

## Kid-Test Log — Watch-list

- Does the kid follow Tinku's pointer, or route around it?
- Does a backward (review) suggestion visibly deflate motivation?
- Does progress loss (cleared data / new device) actually happen in practice, and do parents notice? — informs whether export/import is sufficient
- (existing items carried from prior log — see git history / prior Drive export for full list predating this file)

## Parked Ideas (carried over, one line each)

- KG band content
- Client-side-encrypted cloud backup (blob we cannot decrypt) — open question whether that still counts as processing child personal data; ask at the revisit trigger
- Using a registered Consent Manager as an outsourced verification path (we cannot BE one — First Schedule Part A — but using one is a separate question)
- See prior Drive tracker for the complete historical parked-ideas list (pre-2026-07-16)

---

## Decisions Log (pointer — full text in `DECISIONS.md` at repo root)

Dated entries relevant to this tracker's recent changes: 2026-07-05 (color rule),
2026-07-14 (gate = deterrent not security), 2026-07-15 (skill-state grammar),
2026-07-16 (mute behavior; NO analytics in MVP; NO outbound messaging in MVP),
**2026-08-14 (device-local MVP: no child personal data, no accounts, no payment;
Layer 2 deferred; positioning unchanged; Rule 10 / Fourth Schedule source basis
and the constraints that bind when Layer 2 returns).**
