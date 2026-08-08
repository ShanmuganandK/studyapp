# TRACKER.md — Tinku Math Gamified Evolution

> Canonical task tracker. Replaces the Google Sheet (multiple stale Drive copies
> as of 2026-07-16 — this file is the single source of truth going forward).
> **Maintenance rule:** update this in the SAME COMMIT as the work it describes,
> like ARCHITECTURE.md. Optimized for "what's next," not for exhaustive history —
> git log holds the detail behind each line.

_Last synced: 2026-07-16_

---

## Now

| Item | Status | Detail |
|---|---|---|
| Phone regression checklist (A–L) | 🔶 In progress | Manual walk on real device + DevTools. Sections A/B/C need RE-WALK (skill-state grammar changed). See `phoneregressionchecklist.pdf`. |
| Screen 3-B verdict (journey path vs. cards) | ⏳ Pending | Judge on current (post-grammar-fix) build. Path is live on master; card view at `?home=cards`. |
| Legal — lawyer questionnaire sent | ⏳ Pending send | `claude-chat/questionnaire-lawyer-dpdp.md` ready. NyayGuru AI-advocate draft response received (covers A–G) — human lawyer is now a VERIFICATION pass, not open exploration. |
| Legal — CA questionnaire sent | ⏳ Pending send | `claude-chat/questionnaire-ca-tax-uae-india.md` ready. Founder = Indian citizen, UAE resident (NRI). |
| Move claude-chat/ into GitHub repo | ⏳ Pending | Currently living in Drive as a fallback — GitHub write connector was broken this session. Use Claude Code or a self-hosted GitHub MCP to migrate. |

## Blocked / Gated

| Item | Gated on |
|---|---|
| T109 — Auth rebuild (anonymous→Google linking, Firestore) | Lawyer verification of VPC (verifiable parental consent) mechanism |
| Cloud sync / accounts / paywall (Layer 2) | Same — T109 |
| Weekly parent summary (WhatsApp/email) | Deferred past MVP entirely — see Decisions Log below |
| Analytics (Firebase) | Deferred past MVP entirely — see Decisions Log below |
| KG band expansion | Wonder band stable + kid-test signal |

## Parallel (non-code)

- India trip timing — highest-leverage window to close the legal consult
- Kid-testing — ongoing signal source for 3-B verdict and composer suggestion logic

---

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
  - **Note for T109:** legacy auth never actually implemented anonymous-first despite README claim; passcode storage needs proper re-homing during the rebuild; README corrected
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

## Done — Legal / MVP Scope Cuts (2026-07-16 — the big simplification)

- **Legal pack created:** `questionnaire-lawyer-dpdp.md`, `questionnaire-ca-tax-uae-india.md`, `dpdp-lawyer-conversation-guide.md` — all reflect Indian-citizen/UAE-resident (NRI) founder profile
- **NyayGuru AI-advocate response received** — conservative but coherent read on all sections A–G; narrows the human lawyer's job to a verification pass
- **Analytics removed entirely from MVP** — no Firebase Analytics SDK in the build, zero telemetry (guest or otherwise). Wrapper (T91) reduced to inert no-op seam; call-sites preserved for future reactivation.
  - **DECISIONS 2026-07-16:** MVP ships with NO analytics whatsoever. Returns only post-traction, behind verified parental consent.
- **T107 (privacy notice) closed again** — notice is true as written once analytics are out; no qualification needed
- **T91 amended** — inert seam pattern, 2026-07-16
- **T47 / T60** (Firebase instrumentation, auth-state analytics) — moved MVP → post-traction, consent-gated
- **Weekly WhatsApp/email summary deferred entirely from MVP** — parent dashboard (on-demand, in-app) IS the MVP report. No outbound messaging, no parent contact details collected at all in MVP.
  - **DECISIONS 2026-07-16:** returns post-consent-stack only, as an explicit opt-in scope, strictly transactional content, no upsell in-message (per legal Q C3 guidance). Inbound feedback link (parent-initiated WhatsApp) is UNAFFECTED — stays as-is.
- **MVP legal surface, net result:** collects nothing, sends nothing, stores everything on-device. Launch requirements = accurate privacy notice + Play Families data-safety form + grievance contact.

---

## Later / Phase 2+ (unchanged, one line each)

- KG1/KG2 band expansion (1st planned audience expansion)
- Explorer band (Grade 4–5)
- Web/desktop responsive (same codebase)
- B2B / schools
- Design-system component library
- Cloud accounts, sync, paywall (T109-gated)
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
- (existing items carried from prior log — see git history / prior Drive export for full list predating this file)

## Parked Ideas (carried over, one line each)

- Full session composer build (spec settled above, not yet built)
- KG band content
- See prior Drive tracker for the complete historical parked-ideas list (pre-2026-07-16)

---

## Decisions Log (pointer — full text in `DECISIONS.md` at repo root)

Dated entries relevant to this tracker's recent changes: 2026-07-05 (color rule),
2026-07-14 (gate = deterrent not security), 2026-07-15 (skill-state grammar),
2026-07-16 (mute behavior; NO analytics in MVP; NO outbound messaging in MVP).

## Provenance note

This file was authored in a strategy chat session (2026-07-16) and written to
Drive as a working fallback after the GitHub write connector failed (403 on all
writes this session — reported as a bug). Move into the repo's `claude-chat/`
folder once GitHub write access is restored, then this becomes the file Claude
Code maintains in-commit going forward.
