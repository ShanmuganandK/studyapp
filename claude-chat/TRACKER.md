# TRACKER.md — Tinku Math Gamified Evolution

> Canonical task tracker. Replaces the Google Sheet (multiple stale Drive copies
> as of 2026-07-16 — this file is the single source of truth going forward).
> **Maintenance rule:** update this in the SAME COMMIT as the work it describes,
> like ARCHITECTURE.md. Optimized for "what's next," not for exhaustive history —
> git log holds the detail behind each line.

_Last synced: 2026-08-14_

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
| 1 | **Network audit of shipping build** | ⏳ Next | Prove nothing leaves the device, so the privacy notice is literally true. Grep for `fetch`/XHR/`sendBeacon`, residual Firebase init, SW telemetry. **Confirm Fontsource woff2 are bundled, not CDN-fetched.** Record findings here. |
| 2 | **Privacy policy + Play Data Safety form** | ⏳ Next | Play requires a policy for every app regardless of collection. Notice wording per DECISIONS 2026-08-14 — no absolute "we collect no personal data" claim; acknowledge store/hosting technical data. |
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

- **Questionnaire v2 drafted** — 22 questions → 12, with answered items retired to a §0
  "closed, please confirm" table. Several more now answerable from the text above.
  Parked with the deferred consult; ready when the trigger fires.
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
- **Standards guard** (automated) — ESLint `no-console`/empty-catch/unhandled-promise + raw-hex grep script, wired into CI; violations can't merge
- **Full regression — automated pass** — 296/296 green (grew from 268 as fixes landed); token discipline, GPU-safety, frozen-file integrity all verified. `docs/responsive.md` "gap" was a FALSE POSITIVE (flat `docs-*.md` naming) — folded 2 missing lines (360/320 test widths; 200ms + prefers-reduced-motion) into existing `docs-responsive.md` instead of creating a duplicate
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
