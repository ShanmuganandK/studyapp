# TRACKER.md — Tinku Math Gamified Evolution

> Canonical task tracker. Replaces the Google Sheet (multiple stale Drive copies
> as of 2026-07-16 — this file is the single source of truth going forward).
> **Maintenance rule:** update this in the SAME COMMIT as the work it describes,
> like ARCHITECTURE.md. Optimized for "what's next," not for exhaustive history —
> git log holds the detail behind each line.
>
> **Claims rule (added 2026-08-15):** no line in a Done section without a committed
> artifact behind it. Three claims were checked on 2026-08-15 and three were false
> (CI wiring, questionnaire v2, the 296 test count). See "Open questions / to trace".

_Last synced: 2026-08-26_

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

## 🔥 PRIORITY ORDER (set 2026-08-21 — founder is IN INDIA, kid-testing now)

Everything below is ordered against ONE goal: **get real signal from real children
on this trip.** Anything that does not serve that waits.

| Rank | Item | Why this rank |
|---|---|---|
| **P0** | **#10 — Parent test panel** ✅ **Done 2026-08-21** (theme picker + grade selector + portal theme fix) | **Was the hard blocker on everything else — now closed.** Grade is settable via the parent zone, themes are switchable, and the portalled parent gate re-themes. Grade 2 content (#11) and Grade 3 curriculum (#12) can now be exercised end-to-end the moment they exist. |
| **P1** | **#11 — Grade-2 arithmetic content batch** ✅ **Done 2026-08-22** | 11 skills across 7 recipe modules, all reusing EXISTING question formats — no new art, no new interaction types. Grade 2 now has a real, non-trivial session. |
| **P2** | **#5 / #9 / composer gaps — observe, don't build** | 3-B verdict, welcome-screen decision, `FRONTIER_PICK:'momentum'`, in-session review embedding. All four are already kid-test-gated. The trip IS the gate. Watch, take notes, decide after. |
| **P3** | **#12 — Grade 3 curriculum spec** | Can't be built without it (see #12 — Grade 3 does not exist in the skill map). Spec is Chat's to write; it does not block this trip's testing, which can run on G1 + G2. |
| **P4** | **#7 remainder — non-arithmetic recipes** | Shapes, spatial, patterns, sorting, time, money, data. Each needs a question format that does not exist yet plus visual assets. Real work, not fill-in. Deliberately AFTER the trip. |
| **P5** | Pre-launch checklist (operator name, Netlify domain, Data Safety entry, store assets, content rating) | Gates submission, not testing. Nothing here changes what a child sees this week. |

---

## Now — build queue

| # | Item | Status | Detail |
|---|---|---|---|
| 1 | **Network audit of shipping build** | ✅ **Done 2026-08-15** | Found 1 blocker (startup Firebase Auth init), now fixed — see the audit block below. Everything else clean. |
| 1b | **De-Firebase the MVP build** | ✅ **Done 2026-08-15** | Blocker from #1 closed. Firebase dep dropped, `lib/firebase.js` + `firebaseAdapter.js` deleted, `localAdapter` rewritten as an inert null-user seam, guard test added. **The app now makes zero off-origin requests at runtime (verified in a real browser).** |
| 2 | **Privacy policy + Play Data Safety form** | ✅ **Done 2026-08-16** — 1 human action left | Both surfaces shipped: public page at **`/privacy.html`** and in-app via parent zone → "Read the full privacy policy", rendering from ONE source module and guarded against drift. Data Safety answers written verbatim in `play-data-safety-form.md`. **Corrected 2026-08-16:** the published legal conclusion ("no parental consent is required") and the age range are **removed and guarded** — see DECISIONS 2026-08-16. App name unified, so the policy now names the app the store will list. **Only remaining blocker: the live Netlify domain** (see the URL row below and the pre-launch checklist). `OPERATOR_LINE` is blank-and-guarded — must be closed before submission. |
| 2a | **CI wiring / standards guard** | ✅ **Done 2026-08-15** | Was a false claim (see the corrected Done entry below). Now real: `eslint.config.js` (ESLint 9 flat), `scripts/check-raw-hex.mjs`, `scripts/frozen-legacy.mjs`, `.github/workflows/ci.yml`. **Proven red on a real Actions run**, not trusted green. |
| 3 | **Progress export/import** | ✅ **Done 2026-08-17** | Shipped exactly the shape locked in DECISIONS 2026-08-17: one file (`tinku-math-progress-YYYY-MM-DD.json`), versioned/refusable envelope (`{format, version, exportedAt, skills}`), REPLACE-not-merge import behind a two-step confirm, validate-fully-then-write-once, unknown `skillId`s ignored+counted (never fatal), envelope guarded against an allowlist. **New files:** `src/services/progressBackup.js` (pure build/parse/validate — no DOM/storage, mirrors `mastery.js`/`composer.js` purity, takes `knownSkillIds` as a param rather than importing the curriculum, same decoupling as `composer.js` + `skillMap`), `src/hooks/useProgressBackup.js` (orchestration; ParentDashboard stays presentational). **`progressStore.js`** gained `replaceAllSkillStates(skills)` — one write, no prior read, genuine replace. **UI**: Export/Import in `ParentDashboard`'s settings footer, following the existing `confirmRemove` inline-confirm idiom; empty-progress state is a disabled Export button with a hint (my call — an empty-but-"valid" file is a footgun against later accidentally restoring nothing over real progress). **Policy, same commit:** the backup sentence is restored in `src/config/privacyPolicy.js`, the `does not promise the unshipped progress export` guard in `privacyPolicy.test.js` is FLIPPED (not deleted) to assert the opposite, `public/privacy.html` regenerated via `npm run privacy:build`. **Unblocks** the Netlify-rename row below (its "no recovery path" clause is now false). |
| 4 | Phone regression checklist (A–L) | 🔶 In progress | Manual walk on real device + DevTools. Sections A/B/C need RE-WALK (skill-state grammar changed). See `phoneregressionchecklist.pdf`. **ADD a new step (2026-08-15): verify the Netlify published deploy SHA matches `master` BEFORE walking anything** — see "Deploy verification" below. |
| 5 | Screen 3-B verdict (journey path vs. cards) | ⏳ **P2 — observe on this trip** | Judge on current (post-grammar-fix) build. Path is live on master; card view at `?home=cards`. Kid-testing is the gate — it is happening now. |
| 6 | ~~Session composer build~~ | ✅ **Corrected 2026-08-18 — already Done, since 2026-06-28** | This row read "Queued — spec settled" for at least the whole 2026-08-15 → 2026-08-18 window. It was wrong: `src/engine/composer.js`, `src/config/composerConfig.js` and 47 tests shipped 2026-06-28 (`7bd17dc`), and `SkillSelectScreen` has rendered the "Tinku suggests!" / "↻ Review time!" card highlight from `recommendNext` ever since. Found by reading the actual files, not either doc — see the full correction below and in `DOCMAP.md`. **Two real gaps remain**, correctly distinguished from what shipped: in-session review-embedding (warm-up questions inside a frontier session) and `FRONTIER_PICK: 'momentum'` were never built — both are kid-test-gated design calls, **P2, observe on this trip**. |
| **10** | **⭐ Parent test panel — theme + grade control** | ✅ **P0 — Done 2026-08-21** | **The blocker on all trip testing — closed.** Parent-zone-only controls (deliberately NOT kid-facing). Shipped all three parts: ① theme selector (3 candidate palettes); ② grade selector (1/2/3), feeding `ThemeManager`'s `grade` in place of the hardcoded `DEFAULT_GRADE`; ③ the portal theme fix — the theme class now applies to `document.body`, so the portalled `ParentGateModal` re-themes (verified in a real browser). Preference storage is its own key (`tinku:v1:testSettings`), never `progressStore`, never travels in an export (verified). See the "Done — Parent test panel" block below for the full verification. |
| **11** | **⭐ Grade-2 arithmetic content batch** | ✅ **P1 — Done 2026-08-22** | 11 skills shipped: `g1.add.within10`, `g2.num.compare999` (range extensions to `addition.js`/`compareNumbers.js`), `g2.add.2d-nocarry`, `g2.add.2d-carry`, `g2.sub.2d-noborrow`, `g2.sub.2d-borrow`, `g2.mul.intro`, `g2.mul.table2`, `g2.mul.table5`, `g2.mul.table10`, `g2.num.3digit` (5 new recipe modules). **`g1.num.21-99` and `g2.place.hundreds` deliberately NOT built** — no misconception table exists for either; see the Done block below. See "Done — Grade-2 arithmetic content batch" below for the full breakdown. |
| 7 | ~~Remaining ~29 recipes~~ **→ split; see #11 and the correction below** | ⏳ **P4 for the remainder** | **Corrected 2026-08-21 — "~29 recipes" was misleading in both directions.** ① It is **29 planned *skills*, not 29 recipe files** — several share one parameterised recipe (`mulTable` covers tables 2/5/10; `addition2d` covers carry + no-carry), so it is **~21 new recipe modules**, three of which are just range extensions to existing recipes. ② But it is **also bigger than it sounds**: roughly half need **question formats that do not exist** — shapes, spatial, sorting, patterns, pictographs, clock-reading, coin recognition fit none of `mcq`/`count-objects`/`compare`/`text-input`, and need new interaction types AND visual assets. `misconceptions-reference.md` (~68 rows, still pending teacher review) almost certainly does not cover shapes/time/money distractors yet. **The arithmetic half is split out as #11 (P1). This row now covers only the non-arithmetic remainder — P4, deliberately after the trip.** |
| 8 | **Designed-for-Families programme rules** | ⏳ **P5** — read before submit; privacy half done | We target under-13s, so we are in it. Content + ads rules are independent of DPDP. The **policy** obligations are closed by #2 (policy exists, is linked, is reachable in-app, no ads, no collection). **Still open:** target-age declaration, content rating questionnaire, content policy, store-listing assets, and the external-link rule as it applies to the parent-zone WhatsApp link — enumerated in `play-data-safety-form.md` §4. |
| 9a | **ParentGate integration test flakes on cold runs** | ✅ **Done 2026-08-17** | Taken ahead of #3 as sequenced above. Applied the "better fix" from the diagnosis below: split the single giant `it` (chaining ~20 sequential `waitFor`/`findBy` calls against vitest's default 5 s per-test timeout) into 4 staged tests — set → verify → forgot-reset → remove — sharing one continuous render via `beforeAll`/`afterAll` instead of per-test `render`/`cleanup`. Each stage now gets its own 5 s budget, and a future failure names the stage instead of an opaque 20-step test. Own commit, not folded into #3. Full run: **347 green + 1 skipped** (344 baseline + 3 new stages), lint clean (0 errors, same 3 pre-existing warnings). Original diagnosis preserved below. |
| 9 | **Welcome / onboarding screen — TRACE, then decide** | 🔎 **Traced 2026-08-18 — P2, observe on this trip** | **Confirmed (a): `ProfileSetup.jsx` is the recalled "welcome page"** — pixel/line match against `documents/screenshots/01_welcome_screen.png` (committed 2026-06-18). **`ProfileSelector.jsx` is "the one other"** — a multi-child "Who is playing?" picker from the old anonymous→Google account model. Both genuinely unrendered (zero references in `src/`) and both additionally **inert**: `localAdapter`'s `onAuthStateChanged` always resolves `null` since the 2026-08-15 de-Firebase rewrite, so `profiles` never leaves `[]` and `addProfile` is a silent no-op if ever rendered. Already documented, not lost — `TASK-INDEX.md` T110 and `ProfileSetup.jsx`'s own docblock both say "quarantined." (b)/(c) ruled out: `git log --diff-filter=A --all` + both stale local branches checked, no unique unmerged commits. **Not a fifth false claim.** **Decision not yet made** — Kid-Test Log already asks "does a child launching straight into the skill path know what to do?" Answer it on the trip. **Note:** #10's grade selector deliberately does NOT revive `ProfileSetup` — it is a parent-zone test control, which keeps this decision genuinely open rather than settling it by accident. |
| **12** | **⭐ Grade 3 curriculum — DOES NOT EXIST** | 📋 **P3 — spec needed before any code (Chat writes it)** | **Found 2026-08-21 by reading `skillMap.js` directly.** Its own header says *"the curriculum backbone for **Grades 1–2**."* 35 skills: **19 Grade 1, 16 Grade 2, ZERO Grade 3.** Not planned-but-unbuilt — absent. So "full board for Grades 1–3" is not a recipe-writing task; Grade 3 needs curriculum work FIRST: skills, strands, prereqs, difficulty ceilings, ordering, extending `claude-chat/specs/skill-map-spec.md`. **Does not block this trip** — testing can run on G1 + G2 (once #11 lands). ⚠️ Note the store description already says *"CBSE-aligned maths practice for Grades 1-3"* and `PLAY_TITLE`/positioning assume Grades 1–3 — so this must close before launch even though it does not block testing. |
| **13** | **Strategy rungs — generalise beyond `addition2d.js`** | ⏳ **P2 — observe on this trip first** | `g2.add.2d-nocarry` shipped 2026-08-27 (see Done block below). `DECISIONS.md` 2026-08-27 explicitly does NOT retro-fit every skill in the same entry. Candidates for the same treatment once the current trip's signal is in: `subtraction2d.js` (`g2.sub.2d-noborrow`), the Grade-1 reference recipes. **The walk-vs-hold question is answered — DECISIONS 2026-09-22 (bridge-in):** a session does both, on separate tracks — measurement holds one rung, presentation walks up to it via unscored bridge questions, behind a parent-zone test toggle (default OFF). See the Done block "Bridge-in: strategy-rung walk (behind test toggle)". **Still open:** generalising `strategyRungs`/the bridge to any skill beyond `g2.add.2d-nocarry` — same "observe on this trip first" gate. |

## Deploy verification (standing step — added 2026-08-15)

A cache/deploy scare on 2026-08-15 cost real confidence: the live app appeared to be
missing the parent zone and Screen 3-B, and looked months old. **Nothing was wrong** —
the code was on `master` and correctly wired; it was a local PWA cache.

The lesson is that **a stale service-worker cache and a genuinely stale published deploy
produce identical symptoms**, and only one of them is harmless. So:

1. **Before trusting anything you see on Netlify**, open the URL in a **private/incognito
   window**. That bypasses the service worker entirely and splits the problem in half in
   ~30 seconds — correct there means it is cache, not deploy.
2. **After every deploy**, confirm the Netlify **Published** deploy's commit SHA matches
   `master` HEAD. This failure mode is silent by design: Netlify keeps serving the last
   *successful* build indefinitely, so a build that has been failing for weeks looks exactly
   like a cache problem.
3. Clearing a stale PWA on a phone: uninstall from home screen → clear site data for the
   domain → revisit. On desktop: DevTools → Application → Service Workers → Unregister,
   then Clear site data, then hard reload.

Add steps 1 and 2 to `phoneregressionchecklist.pdf` as section 0, ahead of section A.

## Pre-launch checklist (blocks Play submission — added 2026-08-15)

> None of these are code. All of them gate the store listing, and none were tracked
> anywhere until now. **All P5 as of 2026-08-21** — they gate submission, not testing.

| Item | Status | Note |
|---|---|---|
| ✅ **App name decision + "CBSE" in the name** | ✅ **Resolved 2026-08-16** | **`PRODUCT_NAME` = "Tinku Math"** everywhere — manifest, launcher, page title, `package.json`, README, privacy policy. **Play listing title = `Tinku Math: Maths for Kids`** (26/30 chars); it lives **nowhere in the codebase** by design (ASO copy, entered by hand, changes on its own schedule). **Rule locked: brand first, keyword second.** "CBSE" is out of the *name* — statutory board, impersonation risk, exactly as flagged — and kept in the *description* (`CBSE-aligned maths practice for Grades 1-3`), which is ordinary descriptive use. The name is now defined once in `src/config/brand.js` and **derived** by every surface, so they cannot drift apart; `config/__tests__/brand.test.js` guards what can only be checked. **Store assets are unblocked.** DECISIONS 2026-08-16. ⚠️ **2026-08-21:** the description's "Grades 1-3" claim is not yet true of the curriculum — see Now #12. |
| Developer / publisher name | ⏳ **Open — now guarded** | Own name vs. a trade name. Appears on the store listing and in the privacy policy. Interim contact is the personal Gmail; decide whether that ships. **The policy currently names NO operator** — it says "we" throughout, which is a transparency gap Play and DPDP both expect closed. `OPERATOR_LINE` in `src/config/privacyPolicy.js` is blank with a `TODO(operator)`, and the guard asserts **both directions**: while blank the policy must name nobody AND the TODO must survive; once set, the line must reach both surfaces. Whatever is chosen **must match the Play developer name**. Fill it, then `npm run privacy:build`. |
| ⚠️ **Netlify site name contains the `CBSC` typo** | ❗ **Open — decide, do not rush** | The site is **`shan-studyapp-CBSC.netlify.app`**, so the typo T9 was opened to fix in June now sits in the **public URL — the very URL that goes into the Play listing as the privacy-policy link**. **Good news: the hostname is hardcoded NOWHERE.** `grep -rniE "shan-studyapp\|netlify\.app"` returns zero hits across the working tree, and `git log --all -S "netlify.app"` shows it was never committed — every repo reference is the generic word "Netlify". **So a rename touches no code. It changes the ORIGIN, and that is where the damage is:** ① **all child progress is destroyed** — `progressStore` (`tinku:v1:skills`) and the parent passcode (`math_kids_settings_anon`) are `localStorage`, which is origin-scoped, but **export/import (#3) now ships — testers can export before any origin change**, so the "no recovery path" risk is closed (a parent/tester must actually export first — the app doesn't do it for them); ② **installed PWAs rot silently** — the offline-first service worker keeps serving the cached shell from a hostname that no longer resolves to you, so testers' apps appear to work while never updating again (the cache-vs-deploy ambiguity in its worst form: no error, just permanent staleness); ③ the old subdomain **returns to Netlify's pool**, so it is not yours to redirect from; ④ every already-shared link, WhatsApp share and QR code breaks. A **custom domain** crosses the same origin boundary (a redirect does not carry `localStorage`), plus DNS + cert, plus updating the policy URL in **both** Play fields if already submitted. **Not at risk:** the Capacitor/Play build — it loads bundled assets locally, so the web origin is irrelevant to the Android app. ⚠️ **DO NOT rename mid-trip** — an origin change during active kid-testing destroys every tester's progress and silently rots their installed PWA. After the trip. |
| Privacy policy public URL | 🔶 **Code done (#2) — needs the domain** | Page ships at **`/privacy.html`** (generated, precached, offline-reachable) and is linked in-app from the parent zone. **Nothing in the repo knows the live Netlify domain**, so `play-data-safety-form.md` carries `https://<SITE>/privacy.html` as a placeholder. Fill it into **both** places Play asks — store listing *and* Data Safety form — and confirm it loads in a **private window** (per Deploy verification above: incognito is also what proves it is the deploy, not your cache). |
| Play Data Safety form | 🔶 **Answers drafted (#2) — needs entering** | `claude-chat/play-data-safety-form.md` holds the verbatim wizard answers, the factual basis for each, and a pre-submission checklist. Answer is **no data collected, no data shared**. Still verify against the live form — it is Google's UI and it changes. ⚠️ **The declaration is a claim about the BUILD:** if any future build adds a network call, an SDK or an account, re-answer it *before* that build ships. |
| Designed for Families enrolment | ⏳ #8 | We target under-13s, so we are in it. Content + ads rules, independent of DPDP. |
| Store listing assets | ⏳ Not started | Icon, feature graphic, screenshots, short + full description. Blocked on the name decision above. |
| Play Console account | ❓ Unknown | DECISIONS says individual account under UAE identity, payouts to UAE bank. **Is it actually created and verified?** Google identity verification for individual developers takes time — start it early even though MVP takes no money. |
| Content rating questionnaire | ⏳ Not started | Standard Play step. |

## Open questions / to trace (added 2026-08-15)

| Item | Why it's here |
|---|---|
| **Done-sweep: verify every Done claim has an artifact — AND every queued claim ISN'T secretly done** | Originally scoped one direction only. Three Done claims were checked on 2026-08-15 and **three were false** — CI wiring, questionnaire v2, the 296 test count. That direction is still open (**~1 hour: for each Done line, does the artifact exist?** — do before kid-testing). **Widened 2026-08-18** after the mirror case surfaced unprompted: Now #6 (session composer) sat marked "Queued — not built" while `src/engine/composer.js` had shipped, tested and been wired into the UI for **seven weeks**. The claims rule was built to catch the first shape and does not catch the second — a queued/spec-settled item is worth a `grep`/`git log` check against the paths its own spec names, same as a Done line is worth an artifact check. Both sweeps belong in the same pass. **Third instance, 2026-08-21:** "Remaining ~29 recipes" was neither a lie nor accurate — it was an unexamined shorthand that hid both a smaller file count and a much larger format/asset cost, and hid entirely that Grade 3 doesn't exist. **A queue row that has never been opened is worth re-reading against the code before it is scheduled, not when it is started.** |
| **Welcome screen** | **Traced 2026-08-18 — see Now #9.** `ProfileSetup.jsx`/`ProfileSelector.jsx` confirmed as the recalled screens, not a false claim. Whether to build/revive anything is a separate, still-open product decision — deliberately NOT settled by #10's parent-zone grade control. |
| **Questionnaire v2 not committed** | v2 exists as a chat draft only; the repo has v1 with A4 annotated in place. Either commit v2 or knowingly send v1. No action needed until the DPDP consult is un-deferred, but it must not be forgotten at that moment. |
| **Gazette PDF verification** | The Rule 10 / Fourth Schedule reading is confirmed across three reproductions incl. a law-firm full text, but **not against G.S.R. 846(E) itself**. Sufficient for the current decision (safe under any reading); close before any Layer 2 build. |
| **Dead code after de-Firebase** | `Login.jsx` is rendered nowhere and its auth backend is gone. `ProfileSelector.jsx` is also unrendered. Decide: delete, or leave as frozen legacy pending T109? Leaving unrendered components that reference a removed capability is how the next audit gets confused. |
| **Passcode re-homing** | Known and deferred: passcode lives under `math_kids_settings_anon` via the auth context. Needs proper re-homing **whenever** T109 happens. Recorded so it is not rediscovered as a bug. |
| **`ThemeManager.jsx` naming trap** (design-system audit, 2026-08-20; **now LIVE — #10 shipped 2026-08-21**) | It manages *views* (`skills`/`quiz`/`parent`), not colour themes. Flagged on 2026-08-20 as "the obvious place to wire a real band switch, doing something unrelated" — anticipated to go live the moment #10 landed, and it has: `ThemeManager` now calls `useTestSettings` and IS the mount point that activates theming (the theme-class logic itself lives in the hook, not here — STANDARDS §2). **Left un-renamed in #10 per instruction** (widely referenced, separate diff). Decide: rename `ThemeManager` → something view-specific (e.g. `ViewManager`) and let a real `ThemeManager` be born correctly-named later, or accept the collision and document it loudly at the call site. |
| **Remediation ladder: DECISIONS.md describes three steps, the build has two** (found 2026-08-26, verified against the code, not a new decision) | The Learning engine section (2026-07-04 era) specs wrong#1 = targeted hint, wrong#2 = visual walkthrough + retry easier, wrong#3 = park the skill + a guaranteed-win question so a session never ends on failure. `useQuizSession.js` ships only wrong#1 (targeted hint) and wrong#2 (reveal the correct option, auto-advance after `ADVANCE_DELAY_MS`, 1200ms) — no visual walkthrough, no easier retry, no park, no guaranteed-win question. The hook's own docblock said so: `(TODO: full "guaranteed-win last question" deferred per spec.)`. **Closed 2026-09-22** — DECISIONS 2026-09-22 revises step 2 (no easier retry mid-session — structural, a session is one fixed difficulty) and builds step 3 (park + one bonus question, excluded from scoring). See the Done block "Remediation ladder step 3 — park + bonus question". |
| **Master received unreviewed direct pushes twice in three sessions — Code never checked its picture of master's HEAD** (found 2026-09-02) | Process finding, same shape as the 2026-08-15 CI-wiring one: a gap between a rule (the human reviews and merges; `CLAUDE.md` "one branch per task") and what happened. (1) After the mastery-simulation task, Code pushed two commits straight to `origin/master` (`c4b7f57..4de5b71`) on the instruction "push and commit to origin". (2) After the `LEVEL_UP_STREAK` task, Code fast-forwarded the review branch into `master` and pushed (`4de5b71..df7b5db`) on the instruction "merge to master and commit to remote master" — so the experiment later rejected on its own simulation numbers reached master, and the next task's brief (written on the belief master was still at `4de5b71`) was already wrong. Neither was Code acting alone, and both instructions were explicit; the gap is that Code executed them without first checking that its picture of master's HEAD was current, or flagging the mismatch between the human's stated belief and the repo. **Fix, 2026-09-02:** a standing protocol line at the top of `CLAUDE.md` — Code confirms master's HEAD and origin/master's against its own last-known state before pushing to or merging into master, and flags a mismatch first, however the instruction is phrased and whoever gave it. On this task it did exactly that: it stopped, reported that master was at `df7b5db` not `4de5b71`, and waited. |

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
| **Kid-facing theme picker** | **Decided 2026-08-21 (founder call): NOT built.** A theme chooser reachable by a child is an unnecessary deviation from the learning loop and competes with the one-loud-CTA rule. Themes are a **test instrument** in the parent zone (#10). Whether a kid-facing picker ever ships is a post-trip question, gated on whether theme variety visibly moves engagement at all. |

**Revisit trigger:** real retention signal, or unprompted willingness to pay.
Then engage the DPDP lawyer + CA and choose between the token-VPC path (full
Layer 2) and a paid-unlock-without-accounts path.

## Parallel (non-code)

| Item | Status | Detail |
|---|---|---|
| **CA / tax questionnaire — SEND** | ⏳ Still live | `claude-chat/questionnaire-ca-tax-uae-india.md`. **Not** deferred with the DPDP consult. Section D1 (India day-count before UAE income is at risk of Indian residence taxation) is time-sensitive — **founder is now IN India, so the clock is running.** |
| **India day-count log** | ⏳ **Start now — arrival ~2026-08-21** | Track days-in-India from arrival, independent of when the CA replies. |
| Kid-testing in India | 🔥 **ACTIVE** | Signal source for the 3-B verdict (#5), the welcome-screen decision (#9), FRONTIER_PICK/review-embedding (#6 gaps), theme reaction (#10), and the revisit trigger above. See the Kid-Test Log watch-list. |
| Teacher review of `misconceptions-reference.md` | ⏳ Pending — **arrange while in India** | ~68 rows, one-time. Unblocks richer dashboard insight AND is a prerequisite for the non-arithmetic recipes (#7 remainder), whose distractor rules for shapes/time/money almost certainly are not in the doc yet. |

---

## Candidate theme palettes (drafted 2026-08-21, for Now #10)

Three candidates, as token overrides. **Not decided** — these exist to be tried on real children
and kept, changed or dropped on that evidence.

**Two rules constrain every palette, and are not negotiable:**
1. **Primary may not collide with a feedback colour.** No green primary (reads as *correct*), no
   coral (*wrong*), no teal (*review-due*). Safe hues: indigo/violet/purple/plum/navy.
2. **The semantic grammar is fixed** (DECISIONS 2026-07-04 / 2026-07-05): amber = reward ONLY,
   green = correct, coral = wrong, sky = hint/learning, teal = review-due. **Themes change the
   world, not the meaning.** A dark theme must invert the `-ink`/`-soft` slots to stay readable —
   that is exactly what those slots are for.

Every palette must also declare the `-rgb` channel triples for `primary`, `primary-ink` and `ink`,
kept in sync with their hex pair by `src/__tests__/designTokens.test.js` (design-system audit,
2026-08-20). Full candidate values are in the chat handoff for #10; **Deep Sea (dark) is the one
worth testing first** — dark exercises every inverted slot and is where a leak would surface.

---

## Done — Bridge-in: strategy-rung walk (behind test toggle) (2026-09-22/23)

Implements `DECISIONS.md` 2026-09-22 (bridge-in — LOCKED). Answers the walk-vs-hold question the
2026-08-27 entry left open, and closes it out on Now #13's row. Branch `bridge-in-strategy-rungs`,
cut from `51f3f81` (then-current master) — **not merged; the human reviews.**

**What it is.** Before the 8 scored questions, a session on a skill whose rungs are strategy
stages plays ONE unscored question at each rung BELOW the working rung, ascending — rung 1 gets
none, rung 3 gets rung 1 then rung 2. Measurement is untouched: still 8 scored questions at the
working rung, still one `sessionResult`. Ships OFF by default, behind a parent-zone test toggle
(`tinku:v1:testSettings`), gated per-skill by a new skill-map property (`strategyRungs: true`,
`g2.add.2d-nocarry` only today).

**Built as the bonus round's sibling, mirrored deliberately.** Same shape as the 2026-09-22
park+bonus work (`stage`, `currentQuestion(state)`, a frozen `state.index`, an injected factory):
new `stage: 'bridge'` that runs BEFORE `'scored'`, its own `bridgeQuestions`/`bridgeIndex` (never
a 9th entry in `state.questions`), `score` untouched (`state.stage === 'scored' ? +1 : unchanged`,
now covering bridge the same way it already covered bonus), misconception tags excluded the same
way. **One deliberate difference from the bonus round:** bridge length is known up front from the
working rung, so `bridgeQuestions` is built EAGERLY in `build()` (not lazily via an injected
factory at the moment it's needed, the way the bonus question is) — there is no "reached the end,
now decide" event to hang a lazy factory off.

**Parking does NOT apply to the bridge — the one place this ISN'T a bonus-round mirror.** A
bridge reveal runs the ladder (hint, then reveal) but must not set `parked`
(`parked: state.stage === 'scored' ? true : state.parked`) — parking exists so a session never
*ends* on failure, and the whole scored run always follows the bridge regardless of how the
bridge went. A scored reveal still parks exactly as before.

**The rung-selection decision is a pure, exported, independently-tested function.**
`bridgeRungsFor({ bridgeEnabled, strategyRungs, workingDifficulty })` → `[]` / `[1]` / `[1, 2]`.
Everything RNG/recipe-dependent (`buildLiteSession(..., { length: 1, skillId, difficulty: rung })`
per rung) stays in `build()`, untested at the hook level — same acknowledged gap as the bonus
round's `makeBonusQuestion`, not papered over.

**Toggle plumbing — necessary, not "other UI change."** The toggle has to reach `useQuizSession`
to do anything; that's plain prop-threading (`ThemeManager` → `RecipeQuizScreen` → `SessionPlayer`
→ `useQuizSession`, the same path `theme`/`grade` already take), zero new visual elements at any
of the three intermediate components. Flagged here explicitly since it wasn't named in the file
list. `TestPanel.jsx` gets the one requested control: "Warm-up steps (test)", an On/Off pair
matching the Grade control's existing pattern, token classes only (`lint:hex` clean).

**`testSettings.js` — `SCHEMA_VERSION` NOT bumped, on purpose.** `loadTestSettings` resets to full
defaults on ANY version mismatch, so bumping it would wipe every existing device's theme AND
grade the moment this shipped — not just default the new field. `normalise()` already falls back
per-field on a missing/invalid value, so a legacy v1 file with no `bridgeEnabled` key loads with
its theme/grade untouched and the toggle defaulting false. **A test locks the decision, not just
the outcome:** one test asserts `SCHEMA_VERSION === 1` directly (mutation-checked: bumping it
fails both that test and the legacy-load test, with the stored `version` hardcoded rather than
read from the current constant — an earlier draft of the legacy test read it from the constant and
didn't catch a bump, since both sides moved together; caught and fixed before committing).

**Tests — 26 new across 4 files, each mutation-checked.**
- `useQuizSession.test.js` (pure, 13 new): `bridgeRungsFor`'s six cases (rung 1/2/3, toggle off,
  opt-in off, undefined working difficulty); bridge-question order and the scored-run starting
  fresh at index 0 once it's exhausted; a bridge reveal does NOT park while a scored reveal still
  does; a correct bridge answer doesn't touch score; the bonus round's "identical sessionResult"
  proof extended to cover bridge on/off (and, separately, bridge + bonus chained in one session).
  Mutation-checked: bridge correct increments score, bridge reveal parks, rung order reversed,
  opt-in ignored, toggle ignored — each caught by at least one test.
- `useQuizSession.bridge.hook.test.js` (NEW file, 6 tests) — the one claim the pure tests can't
  reach: does a WRONG bridge answer's tag actually stay out of what gets SAVED? `renderHook` +
  `vi.useFakeTimers` (mirrors `useTestSettings.test.js`'s existing pattern — the first time this
  idiom is used for `useQuizSession` itself) drive a REAL session on the REAL `g2.add.2d-nocarry`
  recipe through real `ADVANCE_DELAY_MS`/`HINT_GRACE_MS` timers, then reads back
  `loadSkillState` — `attempts: 8` not 9, `misconceptions: {}` even though the bridge question was
  answered wrong. Also confirms, end to end (not just via the pure decision function): rung 3 →
  bridge at difficulty 1 then 2 then scored at 3; rung 1 → no bridge; toggle off → no bridge;
  opted-out skill → no bridge. Mutation-checked: relaxing the hook's tag-accumulation guard from
  `prev.stage === 'scored'` back to `!ev.correct` alone fails the tag-exclusion test.
- `testSettings.test.js` (+6): round-trip now covers `bridgeEnabled`; normalisation of a
  non-boolean value; the legacy-load describe block (2 tests + the `SCHEMA_VERSION` lock); an
  export-shaped check that the toggle never appears under `tinku:v1:skills`.
- `TestPanel.test.jsx` (+3): the control renders defaulting to Off selected, marks On when true,
  calls the handler with the tapped boolean.

**Real browser, built app (`npm run build` + `vite preview`, Playwright against the built output,
not dev server).** Seeded `g2.add.2d-nocarry` at difficulty 3 via `localStorage` directly (both
`tinku:v1:testSettings` with `bridgeEnabled:true` and a pre-set `tinku:v1:skills` entry), then
played a real session through the UI (reading each question's operands off the DOM and tapping the
correct-sum option). **Confirmed order: `33 + 5` (rung 1) → `54 + 10` (rung 2) → eight 2-digit + 2-
digit questions (rung 3).** A second run with the toggle off, same seeded difficulty, same
always-correct strategy, produced a saved skill state (`attempts`, `correct`, `level`,
`difficulty`, `difficultyStreak`) **byte-identical** to the bridge-on run's saved state. **Zero
console errors, zero off-origin requests**, both runs.

**What the question counter and progress indicator show during the bridge/bonus (reported per the
task brief, not fixed — a separate UI decision).** `state.index` is frozen through both, so on a
rung-3 session with the toggle on the counter reads **"1 / 8" for the rung-1 bridge question,
"1 / 8" again for rung-2, then "1 / 8" a third time for the first SCORED question** — it only
starts climbing on the second scored question. If the session then parks, the bonus round shows
**"8 / 8"**, frozen. `isBridgeQuestion`/`isBonusQuestion` are exposed on the hook's return value
for a future UI change to key off; `SessionPlayer.jsx` needs none today — the bridge/bonus render
correctly through the same phase-driven paths as any question.

**Resolved 2026-09-23 — see the Done block "Stage label replaces the frozen counter" below.**
`DECISIONS.md` 2026-09-23 (LOCKED) replaces the counter with "Warm-up"/"Bonus" during those two
stages instead of leaving the misread "1 / 8" / "8 / 8" in place. This paragraph is kept as the
finding that prompted the fix, not rewritten.

**Not touched, as scoped:** `mastery.js`, `masteryConfig.js`, every recipe file,
`scripts/simulate-mastery.mjs`. The mastery simulation report's drift guard stays green,
unchanged, run to confirm rather than assumed.

**Test count, measured against the actual branch base (`51f3f81`), not estimated.** Base:
**482 passed + 1 skipped (483 total)**, confirmed via a clean worktree checkout, not the working
tree (an untracked new test file would otherwise contaminate a `git stash` comparison — caught
before trusting the first, wrong reading, since untracked files aren't stashed without `-u`).
Branch: **508 passed + 1 skipped (509 total)** — **+26**, reconciled by counting `it(` blocks per
file, not estimated: `useQuizSession.test.js` 22→35 (**+13**), `testSettings.test.js` 10→14
(**+4** — one non-boolean-`bridgeEnabled` test plus the 3-test legacy-load `describe` block; an
initial draft of this paragraph guessed +6 for this file and was wrong, caught by actually
counting), `TestPanel.test.jsx` 3→6 (**+3**), new file `useQuizSession.bridge.hook.test.js`
(**+6**). 13+4+3+6 = **26**, exactly matching the measured delta. Lint clean (0 errors, same 3
pre-existing warnings), `lint:hex` and `privacy:check` clean, build clean.

---

## Done — Stage label replaces the frozen counter (2026-09-23)

Implements `DECISIONS.md` 2026-09-23 (LOCKED). Closes the counter artifact reported in the
bridge-in Done block above. Same branch, `bridge-in-strategy-rungs` (still unmerged; the human
reviews the whole branch).

**What changed — one component, no hook change.** `isBridgeQuestion`/`isBonusQuestion` already
existed on `useQuizSession`'s return value (shipped 2026-09-22, unconsumed until now) — nothing
new to expose. The counter itself lives in `SessionPlayer.jsx`'s top bar (checked, not assumed):
`{s.isBridgeQuestion ? 'Warm-up' : s.isBonusQuestion ? 'Bonus' : `${questionNumber} / ${totalQuestions}`}`,
same `<span>`, same `text-sm font-bold text-primary` token classes, same accessible-name shape as
before (the counter was plain rendered text with no ARIA wrapper, so the label is too — nothing
extra needed there). Scored questions are byte-for-byte unchanged.

**Neutral styling, checked not just claimed.** `text-primary` (indigo) throughout — no
`accent`/`review`/`success`/`encourage`/coral token, no ⭐, asserted by a test that inspects the
label's `className` and `textContent` directly rather than trusting the diff.

**Tests — 5 new (`SessionPlayer.test.jsx`), each mutation-checked:** bridge question shows
"Warm-up" and not "n / 8"; the first scored question after a bridge shows "1 / 8"; bonus question
shows "Bonus" and not the frozen "8 / 8"; a full toggle-off/never-parked run shows "1 / 8" through
"8 / 8" with the label never appearing (byte-for-byte the master behaviour); the label carries none
of the forbidden tokens and no star. Mutation-checked: dropping the bridge check (1 fails),
dropping the bonus check (1 fails), adding `text-accent` to the label (1 fails, caught by the
token-absence test).

**Real browser, built app, 360px (docs-responsive.md) and 320px.** Toggle ON, seeded
`g2.add.2d-nocarry` at difficulty 3, forced one reveal mid-run to exercise the bonus round.
Screenshots taken of a bridge question ("Warm-up"), the first scored question ("1 / 8"), and the
bonus question ("Bonus") — all render with identical layout and styling, label swapped only. A
320px pass confirms no wrap/overlap with "← Skills" or the mute button. **Zero console errors,
zero off-origin requests**, matching the 2026-09-22 verification's result.

**Not touched, as scoped:** `mastery.js`, `masteryConfig.js`, every recipe file,
`scripts/simulate-mastery.mjs`, and `useQuizSession.js` itself (the fields it needed already
existed).

**Test count.** 513 passed + 1 skipped (up from 508 at the start of this commit — +5, exactly the
5 new `SessionPlayer.test.jsx` cases, no discrepancy this time). Lint clean (0 errors, same 3
pre-existing warnings), `lint:hex` and `privacy:check` clean, build clean.

---

## Done — `ones-addition-ignored` wired into `g2.add.2d-nocarry`, rung 3 only (2026-09-21/22)

Wires the tag added to `misconceptions-reference.md` (2-digit addition without carry) into
`src/recipes/addition2d.js`. This is the gap DECISIONS 2026-08-25 named as the top teacher-review item:
"added the tens but ignored the ones" (34 + 24 → 54). **No-carry only — `g2.add.2d-carry` untouched.**
Branch `ones-addition-ignored-rung3` (an earlier version wired it with no rung restriction, on branch
`ones-addition-ignored`, still on origin, unmerged, superseded by this).

**Restricted to rung 3 on review.** The first pass used the doc's original condition,
`ones(b) !== 0` only, and measured it firing on 96.7% of rung-1 questions — *more* than rung 3
(78.6%). On rung 1, `b` is single-digit so `tens(b) === 0`, and the rule degenerates to
`sum - ones(b) = a` — the distractor is just `a` itself, which is "ignored `b` entirely," not
"added the tens, dropped the ones." That's the wrong misconception firing, not a wording quibble.
On review, the doc's condition column was corrected to `tens(b) !== 0` (rung 3 only — where
DECISIONS 2026-08-25 named the case, `34+24→54`), and the recipe now matches it exactly:
`tens(b) !== 0 && ones(b) !== 0`.

**Rule, as in the doc:** `(tens(a)+tens(b))*10 + ones(a)`. Two conditions, both required:
`tens(b) !== 0` (rung 3 only — see above) and `ones(b) !== 0` (collision guard — otherwise the
value equals the correct sum). The value is always `sum − ones(b)`.

**The two selection questions, answered (DECISIONS 2026-08-25).**
- **Does it need a plausibility check? No — it can never be implausible.** It sits within `ones(b) ≤ 9`
  of the answer, is ≥ `a` ≥ `max(a, b)` (so no monotonic violation), and stays above `answer/2` because
  `a ≥ 10`. So it competes for the *plausible* slots, never the single implausible one, and the
  one-implausible-slot rule cannot starve it. Guarded by a test.
- **Can it be starved anyway?** Only by the three-slot cut of plausible candidates (taken in array
  order; it is listed last). Structurally impossible on rung 3 — at most two candidates
  (`place-value-swap` and this one) can be plausible there — and guarded by a test that it is present
  in EVERY rung-3 question where both conditions hold.

**Measured, 20,000 seeded questions per rung (ad-hoc script, not committed — the committed tests guard
the structural claims, not these percentages), rung-3-only rule:**

| | rung 1 (2-digit + 1-digit) | rung 2 (+ multiple of ten) | rung 3 (2-digit + 2-digit) |
|---|---|---|---|
| tag available (`tens(b)≠0 ∧ ones(b)≠0`) | 0% | 0% | 78.7% |
| **`ones-addition-ignored`** | **0%** | **0%** | **78.7%** (every available question) |
| `random-slip` (unrestricted → rung-3-only) | 74.6% (unchanged) | 164.8% (unchanged) | 152.6% → 73.7% |
| `add-across-columns` | 42.6% (unchanged) | 42.7% (unchanged) | 44.7% → 45.3% (unchanged) |
| `operator-mixup` | 52.6% (unchanged) | 42.5% (unchanged) | 44.0% → 43.4% (unchanged) |
| `place-value-swap` | 45.9% (unchanged) | 50.1% (unchanged) | 58.6% → 58.9% (unchanged) |

Rung 3 behaves exactly as intended: the tag fills 78.7% of questions (never starved), replaces about
half the `random-slip` filler, and every older tag's frequency on every rung is within noise of the
unrestricted-rule baseline. Rungs 1 and 2 are back to their pre-change frequencies — the tag no longer
touches them at all.

**Hint wired.** `src/engine/hints.js` gains `'ones-addition-ignored': 'You got the tens right! Now add
the ones from BOTH numbers together too.'` — the doc's hint text verbatim, added alongside the shared
add/subtract entries following the file's existing pattern. `hints.test.js`'s `RECIPES` list does not
include `addition2d.js` (only the Grade-1 recipes), so that suite doesn't exercise this hint directly;
the recipe/validator tests confirm the tag is emitted and canonical.

**Guards.** Canonical-tag guard (`validator.test.js`) **proven RED first** — recipe emitting the tag
with the validator's set not yet updated failed with "emitted off-doc tag" — then GREEN after adding
it (that set is hand-maintained, not parsed from the doc). 7 tests (`structuralConstraints.test.js`):
exact rule value, collision guard, never-implausible, not-starved-on-rung-3, rung 1 never (tens(b)=0),
rung 2 never (ones(b)=0), carry skill never. Mutation-checked: dropping the `tens(b) !== 0` restriction
(1 fails — the rung-1-never test), `ones(b)` instead of `ones(a)` in the value (2 fail), leak into the
carry branch (2 fail).

**Not done / still open.** `TEACHER-REVIEW.md` item 4 (does the rule match the real error; copying
`b`'s ones, or dropping the ones column, might be commoner) is still pending — this ships the tag, it
does not settle that.

**Doc sync.** `ARCHITECTURE.md`'s `addition2d.js` entry lists the tag with its rung-3 condition, and
two claims there that were already false were corrected: `operator-mixup` "structurally unreachable"
(fixed 2026-08-25, now ~44%) and the pre-strategy-rung "39/69/99" no-carry caps. `DECISIONS.md`
2026-08-25's "open doc gap" text is locked history and left as written; the two TRACKER mentions of the
gap carry "closed" notes, and `misconceptions-reference.md`'s condition column is the human's fix
(commit `9495080`), not this branch's.

---

## Done — Remediation ladder step 3: park + bonus question (2026-09-22)

Implements `DECISIONS.md` 2026-09-22 (LOCKED): the gap flagged 2026-08-26 in the "Open questions"
table above, now closed. Branch `remediation-park-bonus`, cut from `origin/master` (`7103584`, the
human's doc-side entry) — no code existed on master for this before.

**`src/hooks/useQuizSession.js` only** (as scoped — the mechanism is skill-agnostic, no recipe
touched). New session-state fields: `stage` (`'scored' | 'bonus'`), `parked` (boolean, set once on
the first wrong #2 in `applyAnswer`, never incremented — a second reveal later in the session leaves
it exactly `true`), `bonusQuestion`. `advance()` gains an injected `makeBonusQuestion` factory (the
same "accept the impure part as a callback" idiom `sessionLite.js`'s `generateWithRepeatAvoidance`
already uses for `makeCandidate`) — called at most once, only when a parked session reaches the end
of its 8 scored questions; throws if a parked session reaches that point with no factory supplied,
rather than silently skipping the bonus round (CLAUDE.md: stop and flag).

**Universal, not `g2.add.2d-nocarry`-only (Code's call, per the entry).** The mechanism references no
tag, recipe, or skillId — it is a property of the SESSION (a reveal happened), not of the skill.
Restricting it to one skill would need an arbitrary `skillId` gate with no product reason behind it,
and the revised Learning-engine bullet (`DECISIONS.md`, same entry) describes the ladder as a general
rule, not scoped to one skill.

**Built as a distinct stage, not a 9th `questions` entry — the constraint that does the real work.**
`state.index` is deliberately NOT advanced when entering the bonus round; it stays at the last scored
index. That one choice is what makes `state.questions` (always length 8) and `state.score` (bonus
correctness never adds to it — guarded in `applyAnswer`'s correct branch) exactly what they would have
been had the bonus round never run, which is what the hook's `sessionResult` (`questionsTotal:
prev.questions.length`, `questionsCorrect: prev.score`) is built from. Confirmed by a dedicated test
that runs the SAME 8 scored answers two ways — stopping right as the bonus round begins vs. playing the
bonus round through to completion — and asserts `score`/`questions` are identical in both arms.
`misconceptionTagsRef` (hook-level, feeds `sessionResult.misconceptionTags`) is guarded the same way:
`if (!ev.correct && prev.stage !== 'bonus')`, the direct mirror of the tested score guard — not itself
testable at the pure-function level (tags are accumulated in a hook ref, not session state), but it is
the same one-line conditional, applied to the same boundary.

**Runs the existing ladder, not a new one.** The bonus question flows through the SAME `phase` values
(`solving → hint/correct → reveal/correct → complete`) `applyAnswer`/`advance` already drive for the 8
scored questions — resolved via a new `currentQuestion(state)` helper (bonus question when `stage` is
`'bonus'`, the scored one otherwise), used everywhere a question was previously read by index. This is
why `SessionPlayer.jsx` needs NO changes: its phase-keyed rendering, sound triggers, and auto-advance
timer already work for the bonus round unmodified. (`isBonusQuestion` is exposed on the hook's return
value for a future "Bonus round!" UI beat, unconsumed today — forward-compatible, not itself a UI
change.)

**Bonus question generation.** `buildLiteSession(prev.grade, rngRef.current, { length: 1, skillId:
prev.skillId, difficulty: 1 })` — difficulty 1 is universally the floor for every skill's `maxDifficulty`
(≥ 1), so no per-skill "easiest" lookup is needed. Draws from the SAME rng the session started with
(a new `rngRef`, set once in `build()`), so the bonus question is deterministic given the session's
seed, same as every other generated question — no `Math.random`.

**Tests.** 11 new (`useQuizSession.test.js`): no-park path never needs/calls the factory; a wrong #1
alone, and a grace-window re-show, do NOT park; parked set on the first reveal and left unchanged
(still `true`, not incremented) by a second; `advance()` throws without a factory when needed;
`bonusQuestion` is a genuinely distinct question object, never appended to `questions`; `index` stays
frozen (`questionNumber`/`totalQuestions` don't read "9/8"); the bonus round runs hint→reveal on wrong
answers the same as any question; a wrong bonus answer still completes the session (mood floor); and the
score/questions-identical proof above. The pre-existing "mood floor" test (which drives two wrong-#2
reveals) now runs the full bonus round rather than short-circuiting past it — it was the one existing
test whose fixture happened to park, and it needed a `makeBonusQuestion` stub for its final `advance()`.
**Mutation-checked:** letting bonus correctness increment score (2 tests fail), bumping `index` on
entry (1 fails), never setting `parked` (7 fail), and swallowing the missing-factory case instead of
throwing (1 fails).

**Not done, deliberately in scope.** No UI change (`SessionPlayer.jsx` untouched, confirmed unnecessary
above, not merely deferred). No repeat-avoidance between the bonus question and the 8 scored ones
(`buildLiteSession`'s internal repeat-avoidance starts fresh for the length-1 call) — not specified by
the DECISIONS entry, not added speculatively.

482 tests green (11 new), lint clean (0 errors, same 3 pre-existing warnings), `lint:hex` and
`privacy:check` clean, build green.

---

## Done — `LEVEL_UP_STREAK` reverted (2026-09-02)

Implements `DECISIONS.md` 2026-09-02 (LOCKED; supersedes 2026-09-01). Branch
`revert-level-streak-experiment`, cut from `df7b5db` and reviewed, then **fast-forward merged into
master (`19727c8`)** — no merge commit — after the branch was re-verified on a fresh checkout of the
committed tree (464 tests passing, `src/` diff against `4de5b71` limited to one README wording change,
lint / `lint:hex` / `privacy:check` / build clean). **master no longer carries the rejected experiment.**
Both `revert-level-streak-experiment` and `mastery-level-streak` (`df7b5db`, the rejected attempt) are
kept on origin as the historical record.

**Why, with the numbers** (500 seeds per archetype, `claude-chat/mastery-simulation-report.md`, rejected
arm kept there as a frozen record): archetype 5 mastered within 60 sessions in **23.6% → 0.0%** of runs
(**95.2% → 1.0%** even at 480 sessions); archetype 4 slowed from a median 17 to ~120 sessions;
strong learners slowed (minimum sessions to mastery 5 → 10, archetype 3's median 8 → 24);
archetypes 6–10 almost never reached `UNLOCK_LEVEL`. Mechanism and the deliberately-open
archetype-4-vs-5 cliff are in the DECISIONS entry.

**Reverted to the `4de5b71` behavioural state.** `mastery.js`, `masteryConfig.js`, `progressBackup.js`,
`progressStore.js` restored byte-for-byte from `4de5b71` (so `levelStreak`, `LEVEL_UP_STREAK`, the
backfill and my `?? 0` guards are gone; `difficultyStreak`/`DIFFICULTY_UP_STREAK` untouched). The
`levelStreak` tests are removed with the behaviour. **Allowlist drift guard proven RED first** — with the
engine reverted and `levelStreak` still in the allowlist, 4 tests failed (Guard A and 3 round-trip tests),
then GREEN after removing it.

**Revert verified against the record, not just by eye.** The regenerated live-engine tables (48 rows)
are identical to the 2026-08-31 baseline tables, and the 42 rejected-arm rows are preserved unchanged.
The simulation tests now pin the live engine to that baseline (sessions-to-mastery 5/6/8/36 then
"not reached"; structural minimum 5) — proven RED by setting `DIFFICULTY_UP_STREAK` to 1 (3 tests fail).

**Docs.** Kept: `ARCHITECTURE.md`'s `difficultyStreak` / `DIFFICULTY_UP_STREAK` documentation (a real gap
from 2026-08-27, independent of the experiment). Corrected to describe single-session `level`
promotion: `CLAUDE.md`, `GLOSSARY.md`, `src/engine/README.md`, `ARCHITECTURE.md`'s promotion-rule and
config paragraphs. `CLAUDE.md` also gains the master-sync protocol line (see the process finding in the
parked table below). The report opens with a pointer to DECISIONS 2026-09-02 so a reader knows which arm
is live.

**Test count, reconciled.** `4de5b71` measured directly: **456 passed** + 1 skipped. This branch:
**464 passed** + 1 skipped. Difference **+8**, all in `scripts/__tests__/simulate-mastery.test.js`
(11 → 19 tests; `src/` is unchanged at 445): **+5** live-engine baseline-pin tests (no level streak,
sessions-to-mastery pinned to the 2026-08-31 results, structural minimum 5, the open archetype-4-vs-5
cliff's shape, horizon monotonicity) and **+3** report tests (`spliceAll` idempotence, the top-of-report
pointer to DECISIONS 2026-09-02, and the report-drift guard). No `src/` test count moved: the
`levelStreak` tests added on the rejected branch were removed with the behaviour, back to `4de5b71`'s
445.
Lint 0 errors (same 3 pre-existing warnings), `lint:hex` and `privacy:check` clean.

**Left open on purpose:** the archetype-4-vs-5 cliff (a single-session gate lets a 68%-at-hard child
master almost always and a 56% one rarely). Revisit only on real kid-test signal; any fix must pass this
simulation before shipping (DECISIONS 2026-09-02).

---

## Done — `level` consolidation: `LEVEL_UP_STREAK` (2026-09-01)

> **Superseded 2026-09-02 — see `DECISIONS.md` 2026-09-02. The experiment was REJECTED and reverted.**
> Everything below records what was built and measured on branch `mastery-level-streak` (`df7b5db`); it
> is NOT the engine's behaviour — the revert (`revert-level-streak-experiment`) has landed on master
> (`19727c8`). The "Flagged, not fixed" items below (level 0 = "not started", `UNLOCK_LEVEL`,
> old-backup import) were consequences of the streak and are moot after the revert. Kept, not deleted,
> per the same pattern as the 2026-08-27 and 2026-08-31 blocks.

Implements `DECISIONS.md` 2026-09-01 (LOCKED): `level` now needs consecutive strong sessions before
every hop, mirroring `difficulty`. Follows directly from the 2026-08-31 simulation below.

**Shipped (all committed on branch `mastery-level-streak`).**
- **`masteryConfig.js`** — `LEVEL_UP_STREAK: 2` beside `DIFFICULTY_UP_STREAK`, with the consolidation
  rule and revisit trigger; file-header and middle-band comments updated to match.
- **`mastery.js`** — new state field `levelStreak` (independent of `difficultyStreak`); the level block
  in `applyResult` now reads as a sibling of the difficulty block. Strong session → streak +1 (capped);
  hop fires at `LEVEL_UP_STREAK`; weak → streak 0 AND level −1 (unchanged asymmetry); middle → streak 0.
  At the 4→5 hop, `LEVEL_UP_REQUIRES_HARD` still applies and, if the streak is met on a non-hard
  session, the streak **holds at its cap** (no reset) so the next strong session at hard fires the hop.
  Both streaks default `?? 0` so a pre-field state can never produce `NaN` and freeze level.
- **`progressBackup.js` / `progressStore.js`** — allowlist + field types extended for `levelStreak`
  (guard **proven RED first**: `SKILL_STATE_KEYS` vs `emptySkillState()` drift test and 3 round-trip
  tests failed on the 11-vs-12-key mismatch, then GREEN); `readStore()` backfills `levelStreak: 0`.
- **Tests** — the two subtle boundary cases (streak met on a non-hard session → level holds AND streak
  holds at cap; next strong session at hard → level advances, streak 0), weak-mid-streak reset,
  middle-mid-streak reset, independence from `difficultyStreak`, configurable length, legacy-state
  no-NaN. Existing hop tests re-based on a `primed()` helper (one strong session from a hop) so they
  still isolate what they were written to test. **Mutation-checked:** resetting instead of holding at
  the cap fails 3 tests; letting a weak session skip the streak reset fails 3 tests.
- **Simulation** (`scripts/simulate-mastery.mjs`, report) — now emits a *baseline* block
  (`LEVEL_UP_STREAK` 1 = the old engine; its 48 table rows are **identical** to the report committed at
  `4de5b71`), an *after* block, a before/after comparison and a longer-horizon table. Added guards: the
  committed report must equal a fresh regeneration (proven RED), and the baseline arm is pinned to the
  original results.
- **Doc sync** — `ARCHITECTURE.md` (skill-state shape and config list were ALSO stale from 2026-08-27:
  neither listed `difficultyStreak` / `DIFFICULTY_UP_STREAK`; fixed), `CLAUDE.md`, `GLOSSARY.md`,
  `src/engine/README.md`, `src/engine/mastery.js` and `masteryConfig.js` headers; earlier Done blocks
  below carry "superseded" pointers instead of being rewritten.

**Simulation result — read this before treating the change as done.** The DECISIONS entry expected the
streak to help archetype-5-shaped children. **It did not: archetype 5's mastery within 60 sessions fell
23.6% → 0.0% (95.2% → 1.0% by 480 sessions), its `UNLOCK_LEVEL` reach 100% → 62.6%, and mean difficulty
regressions rose 3.27 → 3.91.** Archetype 4 (68% at hard) went from 98.2% → 14.2% within 60, a slowdown
not a wall (100% by 480). Strong learners pay too: minimum sessions to mastery 5 → 10; archetype 3's
median 8 → 24, p90 13 → 37. `UNLOCK_LEVEL` reach within 60 for archetypes 6–10 fell to ≤ 6.2% (was 100 /
98.2 / 63.8 / 17.6 / 0.8%). Full tables and hand-written findings:
`claude-chat/mastery-simulation-report.md`. **No constant was changed** — under DECISIONS 2026-09-01's
own revisit trigger this is evidence for the human, not for Code to tune.

**Flagged, not fixed (outside this task's scope fence — each needs a human call).**
- **Level 0 = "not started" in the app** (`composer.js` treats `level > 0` as started; `progressSummary.js`
  and `ParentDashboard` bucket level 0 as `notStarted`). Level 0→1 now takes two consecutive strong
  sessions, so a child who plays a skill many times without two in a row still shows as "not started"
  — read from the code, not tested.
- **`UNLOCK_LEVEL` (3) gates prereq skills** in the skill map; it was calibrated against one-session
  hops. Finding 4 in the report quantifies the effect.
- **Progress backups exported before this change are refused on import.** The allowlist requires exactly
  the current keys, so a 12-key file (pre-`levelStreak`) fails validation as malformed. The same was
  already true of files exported before `difficultyStreak` (2026-08-27). Not changed here: loosening the
  strict allowlist is a DECISIONS 2026-08-17 question.

---

## Done — Mastery simulation across ten learner archetypes (2026-08-31)

The artifact behind `DECISIONS.md` 2026-08-31 (no day-gate on mastery). With no elapsed-time
backstop, consolidation rests on `DIFFICULTY_UP_STREAK` + `LEVEL_UP_REQUIRES_HARD`; this drives the
shipped `applyResult` with synthetic sessions to see how they behave across the learner spectrum.
Read-only against the engine — `mastery.js`, `masteryConfig.js` and every recipe are untouched.

- **`scripts/simulate-mastery.mjs`** — ten archetypes (`baseAccuracy` 0.97 → 0.45, `dropPerDifficulty`
  0 → 0.25), 8-question sessions played at `nextWorkingDifficulty`, per-question weighted coin flips,
  60-session cap, seeded via the recipe engine's `src/recipes/_rng.js` (never `Math.random`). Also
  runs 500 seeds per archetype and an exact binomial session-odds table. `node
  scripts/simulate-mastery.mjs` rewrites only the marked generated block of the report.
- **`claude-chat/mastery-simulation-report.md`** — archetype table, single-run results, 500-seed
  results, session odds, Findings, Limits (Findings/Limits are hand-written and survive regeneration).
- **`scripts/__tests__/simulate-mastery.test.js`** — 11 tests at the time (18 as of 2026-09-01): archetype 1 masters in <15 sessions;
  archetype 10 either masters or is explicitly flagged "not reached"; byte-identical rerun; report
  splice keeps hand-written sections. **Proven RED first:** swapping the rng for `Math.random` fails
  both determinism tests. `vitest.config.js` now includes `scripts/**/*.test.*` so these run in CI.

**Headline results — full tables and Findings are in the report; tuning calls are the human's, not
made here.** Only archetypes 1–4 reliably master (500 seeds: 100/100/100/98.2%); archetype 5 masters
in 23.6% of runs, archetype 6 in 0.2%, 7–10 in 0%. Mastery is a single strong session at the hard
rung (no streak at level 4→5), so a child at 0.68 accuracy on hard is mastered 98.2% of the time
given enough sessions — well below the nominal "~80% at hard". `STRONG_RATIO` 0.8 behaves as 7/8
(87.5%) at 8 questions. Archetype 10 is held by the floor (level/difficulty never below 1) but reaches
`UNLOCK_LEVEL` in only 0.8% of runs. **Limits:** fixed per-rung accuracy (no simulated child ever
learns), no fatigue, no remediation ladder, no spaced-rep review — complements kid-testing, does not
replace it.

**Note 2026-09-01, reversed 2026-09-02:** `LEVEL_UP_STREAK` was briefly added to change the "single
strong session at the hard rung / no streak at level 4→5" behaviour described above, then rejected
(`DECISIONS.md` 2026-09-02). The description above is the LIVE engine again. The report now marks the
`LEVEL_UP_STREAK` arm as a frozen rejected record.

`ARCHITECTURE.md` Tooling section updated in the same commit. `DOCMAP.md` was NOT edited (not Code's
to write) — the new report is unlisted there; flagged for the human.

---

## Done — Strategy rungs + level/difficulty decoupling (2026-08-27)

Resolves the pacing question left open at Now #11 (2026-08-22/26): a strong session bumped
`difficulty` a full rung immediately with no within-skill consolidation. Ships **both** options
that were on the table there — an actual strategy order (closer to (a)/(c)) plus the
2-strong-sessions gate (option (b)) — per `DECISIONS.md` 2026-08-27 (LOCKED).

**`src/recipes/addition2d.js` — `g2.add.2d-nocarry` rungs are now a strategy, not a magnitude
cap.** Rung 1 = 2-digit + 1-digit (add the ones), rung 2 = 2-digit + a multiple of ten (add the
tens), rung 3 = 2-digit + 2-digit (tens then ones). All three stay no-carry and inside the
skill's existing 99 ceiling — only operand SHAPE changes per rung, not the range. `buildOperands`
split into `buildOperandsCarry` (unchanged behaviour, `g2.add.2d-carry` only) and
`buildOperandsForRung` (new, no-carry only). New structural tests assert each rung's shape
(`structuralConstraints.test.js`); `validator.test.js`'s `CEILINGS['g2.add.2d-nocarry']` updated
to one flat cap (99) across all three rungs, since the per-rung magnitude cap no longer applies.
`g2.add.2d-carry` is untouched — its difficulty still scales a magnitude cap.

**`src/engine/mastery.js` — `level` and `difficulty` are separate axes.** `applyResult` used to
advance both off one `isStrong` boolean. Now: `level` keeps its existing one-strong-session
schedule *(2026-09-01 tried to supersede this with `LEVEL_UP_STREAK`; rejected 2026-09-02, so this description is live again)* (`LEVEL_UP_REQUIRES_HARD` intact at the 4→5 hop) — unchanged, since slowing it would
stretch mastery to ~10 sessions/skill for no gain. `difficulty` requires
`DIFFICULTY_UP_STREAK` (2, named constant in `masteryConfig.js`) **consecutive** strong sessions
at the current rung before advancing; any non-strong session (weak OR middle) resets the streak
to 0. A weak session's existing ease-down (difficulty −1) is unchanged and ALSO resets the
streak. New state field `difficultyStreak` on the skill-state shape (`emptySkillState`).

**Progress-export allowlist guard (DECISIONS 2026-08-17) — flagged before building, handled.**
Adding `difficultyStreak` to skill state grows the exported shape. Extended
`SKILL_STATE_KEYS`/`FIELD_TYPES` in `progressBackup.js` — **proven RED first** (4 failing tests
including the drift guard itself) **then GREEN**, per the standing rule, not just added and
trusted.

**`progressStore.js` backfill, the guard flag's second-order consequence.** A skill state saved
under the old 11-key shape (before this change, and not yet touched by `applyResult` again) would
export as 11 keys and FAIL reimport against the new 12-key allowlist. `readStore()` now backfills
`difficultyStreak: 0` on read (not written back — lands on disk naturally next time that skill is
played), so every state this module returns — including in an export taken before that skill's
next session — matches the current shape. Own test added.

Sample mix generated and eyeballed per rung (seeded, `mix-report`): rung 1 e.g. `47 + 1`, `97 +
2`; rung 2 e.g. `10 + 70`, `28 + 70`; rung 3 e.g. `81 + 18`, `46 + 40` — matches the intended
shapes, all ≤99, none carry.

446 tests green (up from 328 at session start — **`CLAUDE.md`'s hardcoded baseline was replaced
with "CI green is the guard"** in the same pass, since the number was already stale and changes
almost every commit), lint clean, `lint:hex` clean, build green.

**Not done, deliberately** (see `DECISIONS.md` 2026-08-27 "Open" + "Scope"):
- Strategy rungs generalising to other skills — landed in `addition2d.js` only.
- Within-session rung walking (Set B's paper-test format walked all three rungs in 8 questions;
  the app still holds one rung per session) — a session-shape change, out of scope here.
- The `misconceptions-reference.md` gap for "added the tens but ignored the ones" — already
  logged as the top item for the pending teacher review (2026-08-25 entry), unaffected by this
  change. *(Closed 2026-09-21: doc row added and the tag wired, rung 3 only — see the Done block
  "`ones-addition-ignored` wired".)*

**Also found, not fixed here — flagged, not silently edited:** `CLAUDE.md`'s mastery line claims
"~80% at hard level, **across sessions on different days**." `src/engine/mastery.js` records
`lastSeen` but never compares it across sessions to gate a level-up — nothing in the codebase
enforces a distinct-day requirement. Left the line as-is per instruction; needs a human call on
whether to fix the code or correct the doc.
**Resolved 2026-08-31 — doc corrected, not code:** `DECISIONS.md` 2026-08-31 (LOCKED) removes
the claim rather than building a day-gate; the wording is gone from `DECISIONS.md`,
`CLAUDE.md`, `masteryConfig.js`'s header and `src/engine/README.md`.

---

## Done — Distractor plausibility fix (2026-08-25, amended 2026-08-26)

Phase 2 of the kid-test audit at `eab63e5` (screenshots showed `g2.add.2d-nocarry` questions
answerable by elimination alone), **amended the same day it shipped** after its own report
surfaced two problems neither the original task nor this one anticipated: the ratio rule
misfiring at small answers, and a fixed-index tiebreak silently killing canonical tags. This
entry now describes the finished state, not the mid-point — one piece of work, not two.
**No tag rule changed anywhere in either pass** — the doc's misconception formulas stay exactly
as written; what changed is which of a recipe's already-built candidates get spent as option
slots.

**Final rule** (`src/recipes/_plausibility.js`): a distractor is implausible if it violates a
monotonic fact about the operation (sum < max(addends); difference > minuend; product < max
factor when both ≥2) or a magnitude ratio (< answer/2 or > answer×2) — **UNLESS** it's within
`PLAUSIBLE_ABSOLUTE_TOLERANCE` (3) of the answer, which overrides BOTH checks deliberately (a
value 2 away from the answer is never eliminable by magnitude reasoning, however large the
operands are). **At most ONE implausible distractor per question**, chosen **at random** among
however many are tied for the slot (not always the first in array order) — `operator-mixup` and
its analogues stay in the pool (they catch a real misconception a child without number sense yet
can't eliminate by magnitude); they just can't share a question with a second implausible option,
and no single tag can permanently hog the slot.

**Scope — 7 recipe modules, 9 skill groups**, in commit order: `counting3digit.js` (worst case,
alone), `addition2d.js`, `subtraction2d.js`, `addition.js` + `subtraction.js` (the Grade-1
reference recipes — explicitly brought into scope on the human's call, the **average-learner
principle**: the product is built for the average learner, not the strong one, and these are what
future skills get copied from — owed a `DECISIONS.md` entry, see below), `mulIntro.js` +
`mulTable.js`. Not touched: `compareNumbers.js` (non-numeric options, N/A) and `counting.js`
(now confirmed fully resolved despite never being edited — see below).

**Before/after, three points not two** (% of questions with 2+ implausible distractors, worst
difficulty rung shown; 500-run audit throughout):

| Skill | Phase-1 (no fix) | Phase-2 raw (selection-order fix alone) | Final (+ floor & tiebreak) |
|---|---|---|---|
| `g2.num.3digit` | 44.8–52.2% (44–49% all-three) | 0%† | **0%** |
| `g2.add.2d-nocarry` | 96–100% | 0%† | **0%** |
| `g2.add.2d-carry` | 40.2–64.2% | 0%† | **0%** |
| `g2.sub.2d-noborrow` | 51.6–81.0% | 3.6–9.2% | **0%** |
| `g2.sub.2d-borrow` | 36.0–59.6% | 0.8–1.6% | **0%** |
| `g1.add.within10` / `within20` | 0–53.0% | 0%† | **0%** |
| `g1.sub.within10` | 1.0–44.6% | **44.2–64.0%** | **0%** |
| `g1.sub.within20` | (same row) | 31.8–44.8% | **0%** |
| `g2.mul.intro` | 11.8–24.8% | 14.0–16.4% | **0%** |
| `g2.mul.table2/5/10` | 8.0–20.6% | 8.6–11.4% | **0%** |

† These three had zero phase-2-raw residual too — their implausible pairs (e.g.
`add-across-columns`/`operator-mixup`) fire on ordinary 2-digit answers, not specifically on 0/1,
so the selection-order fix alone was already sufficient for them. **The "Phase-2 raw" column is
the number the previous version of this table omitted** — it showed only "0%\*" with a footnote,
which read as a clean win where the raw number for `g1.sub.within10` had actually RISEN to 65%.
That is precisely what the claims rule exists to catch; corrected here, not just noted.

**A real conflict surfaced and was escalated, not resolved silently — since resolved.** Running
the new validator guard unconditionally proved "≤1 implausible" was mathematically impossible
when the correct answer was 0 or 1 (ratio bounds admit zero alternatives at 0, exactly one — the
value `2` — at 1). Stopped and asked rather than guessing; **human's call at the time: a
principled, answer-magnitude carve-out** (`MIN_ANSWER_WITH_GUARANTEED_PLAUSIBILITY`). The
follow-up task then asked whether the underlying ratio rule itself was measuring the wrong thing
at that range — it was: `3-3=0` calling 1/2/3 all implausible is a real child's tempting wrong
answer, not elimination-by-magnitude. **The absolute tolerance floor fixes the metric instead of
carving around it**, and the carve-out is gone: `MIN_ANSWER_WITH_GUARANTEED_PLAUSIBILITY`, its
proof block, and the validator's answer<2 skip were all deleted after verifying empirically they
had nothing left to protect (removing the skip and re-running passed unconditionally; the
floor's own math proves answers 0 and 1 now admit several plausible alternatives, not one).
`selectDistractors`'s uncapped last-resort loop is gone too — 76,000 generated questions across
every skill/difficulty confirmed it unreachable once the floor guarantees `answer ± 1/2/3` are
always plausible.

**Two canonical tags were structurally unreachable — found via the tag-survival check, now
revived, and the underlying mechanism generalised rather than special-cased.**
- `g2.add.2d-nocarry`: `operator-mixup` now surfaces on ~48.8% of questions (976/2000 sample).
- `g2.num.3digit`: `zero-placeholder-ignored` now surfaces on ~14.1% of questions (282/2000 sample).

Both were dying for the same reason: `selectDistractors` always took `implausible[0]` — whichever
tag was listed first in a recipe's candidate array won the one implausible slot on EVERY question
forever. This was never going to stay a two-instance problem — it's a rule that silently kills a
canonical tag in any recipe with two-or-more always-implausible candidates, written into every
recipe from here forward unless fixed once. `selectDistractors` now threads the recipe's own
seeded `rng` and draws randomly among tied implausible candidates (only when more than one
exists, so it doesn't touch the rng stream otherwise). **Full tag sweep, not just the two known
cases:** every canonical tag across all 9 skill groups now surfaces, confirmed by a 500-run audit
listing every tag seen per skill. The only tags still absent (`tens-ignored` /
`smaller-from-larger-force` on `g1.sub.within10`) are a **pre-existing, unrelated** characteristic
— that skill's minuend ceiling (≤10) never produces a teen minuend, so the teen-only condition
those tags require is structurally unreachable regardless of selection order; not caused by, or
fixed by, any part of this work.

**`counting.js` (still untouched, out of scope) — now fully resolved without a single edit.** The
specific concern the original task named (digit-length false positives, e.g. answer=9 vs
distractor=10) was already fixed by the ratio rule alone. Its subsequently-found answer≤1
residual (35.4% at `g1.count.1-9` d1) is now also gone — the floor lives in the shared
`isImplausible`/`selectDistractors` that `counting.js` already called, so the fix reached it for
free.

**Registration / verification**

| Check | Result |
|---|---|
| Tests | **436 green** (+9 this amendment: one determinism test per recipe module; 427 from the original phase-2 commit), 1 skipped. Baseline 416 (post text-cutoff-fix commit `8931b7a`). |
| Guard proven red, then restored | `addition2d.js` temporarily reverted to naive first-N candidate selection (the pre-fix behaviour) → guard failed with the exact expected message (3 implausible on a no-carry question) → restored, `git diff` clean. |
| Tag survival + frequency | Every canonical tag across all 9 skill groups confirmed surfacing (500-run audit), with observed frequency reported for the two revived tags above. Only the pre-existing, unrelated `g1.sub.within10` gap remains. |
| Guard coverage | Runs on **every** generated question now — no skip of any kind survives. |
| Determinism | Same seed → same question, asserted as a permanent test (`validateDeterminism`) per recipe module — the rng-based tiebreak could have broken this silently; it doesn't. |
| Lint / `lint:hex` / `privacy:check` | Clean — 0 errors (3 pre-existing warnings, unchanged). |
| **Real browser, built app**, 412×915 viewport | Original pass: `Two-Digit Adds` (g2.add.2d-nocarry) + `Add it Up!` (g1.add.within20). Amendment pass: `Pop the Balloons!` (g1.sub.within10, the skill most affected) + `Two-Digit Adds` again. All four sessions reached the celebration screen. **Zero console errors, zero off-origin requests**, both passes. |
| **Storage / migration** | **No skill-state shape changed anywhere, either pass.** Content-generation only — no `progressStore`/`mastery.js` field touched, no localStorage key touched. **No migration needed; no tester mid-session loses progress.** |

**What this does NOT fix — recorded so it isn't mistaken for done.** `random-slip` usage rose
after the selection-order fix and stayed elevated after the floor (expected — more candidates
compete for fewer slots once implausible ones are capped). **Observed accuracy will likely drop,
possibly sharply, especially on `g2.add.2d-nocarry`** — the measurement becoming honest, not the
app getting harder. `masteryConfig.js`/`STRONG_RATIO` were **not** retuned, even though promotion
may now look stalled on the previously-easiest-to-guess skills. **This fix does not address
difficulty PACING** — `applyResult` (`src/engine/mastery.js`) still advances both `level` and
`difficulty` off the same `isStrong` boolean in one step, with no consolidation/settling period;
that is the separate, still-open question logged in the Kid-Test Log's #11 entry, untouched here.

**Open doc gap (repeated from phase 1, still not filled — teacher review, not this task):**
2-digit-no-carry addition has only one near-tagged candidate (`place-value-swap`) once
`add-across-columns`/`operator-mixup` are capped to one implausible slot between them. "Added the
tens but ignored the ones" (34+24→54) remains a plausible real misconception with no doc entry.
*(Closed 2026-09-21: the doc entry `ones-addition-ignored` was added and wired into `addition2d.js`,
restricted to rung 3 — see the Done block "`ones-addition-ignored` wired". The teacher-review
sign-off on its rule and hint wording is still pending — `TEACHER-REVIEW.md` item 4.)*

**Three decisions are now owed a `DECISIONS.md` entry** (the human is drafting all three; see the
Decisions Log pointer below for the full list): the themes-as-test-instrument call from #10, the
distractor-plausibility rule itself, and the average-learner design principle.

**Scope fences honoured:** no tag formula changed, no recipe ceiling changed, no
`masteryConfig.js`/`STRONG_RATIO` change, frozen paths untouched, no `DECISIONS.md` entry (the
human is the one deciding the plausibility rule and the average-learner principle, per the task
brief).

---

## Done — Grade-2 arithmetic content batch (2026-08-22)

Closes Now #11 (P1). 11 skills shipped across 7 recipe modules — 2 range extensions to existing
Grade-1 reference recipes, plus 5 new modules. Every distractor draws its tag + rule from
`misconceptions-reference.md` verbatim (doc wins on conflict); no new question formats, no new
art, no new interaction types — every skill is `mcq` or `compare`, reusing formats that already
shipped.

| Module | Skills served | What's new |
|---|---|---|
| `addition.js` | `g1.add.within20` (unchanged), **`g1.add.within10`** | Converted to `skillIds`. Trap A: `crossing-ten-misstep`/`add-tens-to-ones` gated to within20 only — the within-10 misconceptions table has no such tags, and a sum of exactly 10 doesn't "cross" ten per the doc's own condition. |
| `compareNumbers.js` | `g1.num.compare20` (unchanged), **`g2.num.compare999`** | Trap B: the existing "shared ones digit / shared leading digit" pair-construction (so `=` always stays misconception-explainable) generalised via two range-parameterised helpers rather than forked, extending cleanly to a 999 range. |
| `addition2d.js` (new) | `g2.add.2d-nocarry`, `g2.add.2d-carry` | Rejection-sampled operand pairs make the ones column STRUCTURALLY carry-free or carry-required — asserted by a dedicated test, not a comment. |
| `subtraction2d.js` (new) | `g2.sub.2d-noborrow`, `g2.sub.2d-borrow` | Same structural pattern as `addition2d.js` for borrow/no-borrow. Entirely disjoint tag sets per the doc's two separate tables. |
| `mulIntro.js` (new) | `g2.mul.intro` | "Groups of" repeated-addition intro, 2 difficulty rungs only. Found and fixed a real collision while sample-verifying: `multiplication-as-addition` (a+b) and `multiplication-by-zero-identity` (the other factor) compute the identical number whenever one factor is 0 — the generic dedup was always picking the addition tag, so zero-identity never actually surfaced despite being coded. `generate()` now picks whichever tag applies instead of relying on insertion order. |
| `mulTable.js` (new) | `g2.mul.table2`, `g2.mul.table5`, `g2.mul.table10` | Fixed table value × multiplier; ceiling is on the multiplier, not the product. Same class of collision as `mulIntro.js` (T+m collapses to the identity-case value when m is 0 or 1) fixed the same way. |
| `counting3digit.js` (new) | `g2.num.3digit` | Format `mcq`, not `count-objects` (doesn't scale to hundreds). Question text spells out the place-value decomposition ("H hundreds, T tens and O ones make ?") so `correctAnswer` is independently re-derivable from the digits in the text, per RECIPE_TEMPLATE's guidance. |

**Registration (every point in the checklist):** all 11 skills flipped `planned` → `ready` in
`skillMap.js` with display fields (`displayName`/`subtitle`/`icon`); every module registered in
`sessionLite.js`'s `RECIPES`. `KIND_BY_RECIPE` gained `addition2d: 'add'` (commutative) and
`subtraction2d: 'sub'` (ordered), but **`mulIntro`, `mulTable` and `counting3digit` are
deliberately absent** (commented why at the call site): multiplication isn't commutative
pedagogically for a "groups of" skill (3×5 ≠ 5×3 to a child learning the concept — collapsing
them would defeat the doc's own `count-factor-swap` misconception), and `counting3digit` is
`mcq` not `count-objects`, so the `'count'` repeat-avoidance kind would read a `render.count`
that doesn't exist on its questions. The validator's `expectedAnswerFor` gained new branches and
its `compare` check was generalised from a hardcoded `g1.num.compare20` string match to any
compare-format skill via `render.left`/`render.right`.

**Out of scope — deliberately, not an oversight:**

| Skill | Why it's out |
|---|---|
| `g1.num.21-99` | `misconceptions-reference.md`'s own review-status note names it as tags/format pending. No tag table exists, and `count-objects` doesn't survive the range. |
| `g2.place.hundreds` | No misconception table exists anywhere in the doc. Same blocker. |
| `g1.place.tens-ones` | Doc-backed, but its own prereq is `g1.num.21-99`, so building it alone unlocks nothing. Travels with the bridge decision above. |

**Composer-suggestion consequence (recorded, not fixed — the skill map's prereq graph is
curriculum, changing it is the human's call):** `g2.add.2d-nocarry`, `g2.sub.2d-noborrow` and
`g2.num.3digit` all list `g1.place.tens-ones` as a prereq, which stays `planned` forever until
that bridge is built. Since `prereqsMet` treats a missing prereq state as locked, **`recommendNext`
will never suggest these three skills**, and — because their own dependents (`g2.add.2d-carry`,
`g2.sub.2d-borrow`, `g2.num.compare999`) require THEM to reach mastery first via the composer's
own suggestion chain — those three are practically unreachable by suggestion too, unless a parent
or child taps the card directly and plays it to mastery manually (which readySkills() permits:
prereqs gate suggestion, never rendering). **`g2.mul.intro` → `g2.mul.table2/5/10` is the one
Grade-2 line that unlocks cleanly** (hangs off the already-ready `g1.add.within20`), so it is
what `recommendNext` will actually walk a Grade-2 child through today. **All 11 skills still
render on Home and play correctly when tapped** on both Home views — `readySkills()` filters on
`status` and `grade` only, never on prereqs. This is the intended trip behaviour (a parent can
manually explore every Grade-2 skill during kid-testing), not a bug, and matches the exact
pattern already logged for Now #10's Grade-3 fallback.

**Verification**

| Check | Result |
|---|---|
| Tests | **416 green** (+14: 2 new `describe.each` skill-table rows' worth of validator coverage across the 7 modules, plus 4 new structural-guarantee tests), 1 skipped. Baseline **402 + 1 skipped**. |
| Validator coverage | Confirmed running 100× per difficulty **per served skill** — 11 skills, not 7 modules (`skillIds ?? [skillId]` normalisation in the shared validator already does this). |
| Lint / `lint:hex` / `privacy:check` | Clean — 0 errors (3 pre-existing warnings, unchanged); hex guard clean; privacy byte-identical. |
| **Guards proven RED then reverted**, one injection at a time | ① off-doc tag injected into `addition2d.js` (`forgot-carry` → `forgot-carry-oops-injected`) → canonical-tag guard failed with the exact off-doc-tag message → reverted. ② `g2.sub.2d-noborrow`'s d1 cap bumped 39→60 in `subtraction2d.js` → ceiling guard failed (`expected 57 to be less than or equal to 39`) → reverted. ③ `counting3digit.js`'s palindrome guard removed AND the generic dedup's answer-protection seed cleared → no-duplicate-options assertion failed (`expected 3 to be 4`) → both reverted. `git diff` confirmed clean after each. |
| No-carry/no-borrow structural claim | Asserted as a **test** (`structuralConstraints.test.js`), not a comment: 200 runs per difficulty confirm `g2.add.2d-nocarry`/`g2.sub.2d-noborrow` never require a carry/borrow, and their carry/borrow counterparts always do. |
| **Real browser, built app** (`npm run build` + `vite preview` + Playwright) | Set Grade 2 via the parent test panel → confirmed all 10 Grade-2 skills render on **both** Home views (Journey Path default + `?home=cards`) → played one 2-digit addition session (`Two-Digit Adds`, 8/8 correct, real carry/no-carry questions incl. `31+6=37`) and one multiplication session (`Table of 2`, 8/8 correct, including a real `2×0=?` zero-identity question) end to end, both reaching the celebration screen → **zero console errors, zero off-origin requests** across the whole walk. Also found and fixed a stale `TestPanel.jsx` copy ("Grades 2–3 have no skills yet") that this batch made false — corrected to name only Grade 3. |

**Scope fences honoured:** no new question formats (`mcq`/`compare` only), no new art/interaction
types, frozen legacy paths untouched, no prereq edges changed, `g1.num.21-99`/`g2.place.hundreds`
not built (no misconception table exists for either), no `DECISIONS.md` entry (nothing here was a
product decision).

---

## Done — Parent test panel: theme + grade control (2026-08-21)

Closes Now #10. A parent-zone **TEST INSTRUMENT** for kid-testing on a real device — 3 candidate
themes + a Grade 1/2/3 selector, behind the existing gate. **Nothing kid-facing:** no
kid-reachable theme picker (a DECISIONS-level call the human is recording separately). Three parts
shipped: theme selector, grade selector, and the portal-theming fix the 2026-08-20 audit flagged.

**Note on the #10/#11/#12 numbering:** the branch this was built on was cut from a local `master`
that predated `3e03cc1` (2026-08-21, same day) — the commit that actually added the PRIORITY ORDER
block and rows #10/#11/#12. Work proceeded against the task brief's own description of #10 (which
matched exactly) without that context; the mismatch was caught and reconciled via `git rebase
origin/master` before this was pushed, folding this Done block under the pre-existing #10 row
instead of duplicating it.

| Piece | What it is |
|---|---|
| `src/services/testSettings.js` | **New, storage seam** (mirrors `progressStore.js`). Own key **`tinku:v1:testSettings`** = `{ version, theme, grade }`, normalised on load/save. **Deliberately NOT in `progressStore`** (skills-only, allowlist-guarded) and NOT the passcode key — so it **cannot ride in a progress export** (export reads only the skills key). Exports `THEME_SLUGS`/`GRADES`. |
| `src/hooks/useTestSettings.js` | **New.** React state + the ONE side-effect that APPLIES a theme: a `theme-<slug>` class on **`document.body`** (`wonder` = no class). Body-level is the Part ③ fix — the portalled `ParentGateModal` is a `#root` sibling, so a `#root` class never reached it. Theme LOGIC lives here, not in `ThemeManager`. |
| `src/index.css` | **3 palettes** as `.theme-<slug>` blocks (colour custom props only): `sunset`, `bubblegum`, `deepsea` (dark). Human-supplied values; each obeys the two binding rules (primary ≠ feedback colour; fixed amber/green/coral/sky/teal grammar) and declares paired hex + `-rgb` in sync. |
| `src/components/TestPanel.jsx` | **New, presentational.** Theme swatches (preview each palette by scoping token utilities in `.theme-<slug>` — no raw hex) + Grade 1/2/3 control. Rendered in `ParentDashboard`'s footer. |
| `ThemeManager.jsx` / `SkillPathScreen.jsx` / `SkillSelectScreen.jsx` | `ThemeManager` calls `useTestSettings`, feeds `grade = currentProfile?.grade ?? testGrade ?? DEFAULT_GRADE`, passes theme/grade + setters to the dashboard. Both Home screens take a `grade` prop and filter via shared **`readySkills(grade)`** (built-in fallback-to-all, so Grade 3 is never an empty void). |
| `scripts/check-raw-hex.mjs` | Token-block exemption **widened** from `:root` to also cover `.theme-<slug>` token-definition blocks (effect-layer leaks outside them still caught). |

**What Grade 3 produces today (answer to the task's question):** Home screens now filter by grade
via `readySkills(grade)`; all `ready` skills are Grade 1, so Grade 3 falls back to the full Grade-1
set — **no crash, no empty void, visibly identical to Grade 1** until Grade 2/3 recipes land (#11/#12).
Grade becomes a real end-to-end instrument the moment that content exists.

**Naming decision (reported, not acted on):** theme-application logic lives in the correctly-named
`useTestSettings` hook; `ThemeManager` (which manages *views*) only calls it. The name collision is
now **live** (it's the mount point that activates theming). **Left un-renamed per instruction** —
rename decision open in "Open questions".

**Verification**

| Check | Result |
|---|---|
| Tests | **402 green** (+25: designTokens palette pairs +9, testSettings 9, useTestSettings 4, TestPanel 3), 1 skipped. Baseline 377/1. |
| Lint / `lint:hex` / `privacy:check` | Clean — 0 errors (same 3 pre-existing warnings); hex guard clean; privacy byte-identical. |
| Guards proven RED then reverted | ① `designTokens.test.js`: mismatched `.theme-sunset`'s `--color-primary-rgb` → the sunset pairing test fails → reverted. ② `check-raw-hex.mjs` (widened): raw `#123456` injected into the `.count-glyph` effect-layer rule → flagged → reverted (proves the palette-block exemption did NOT over-exempt). |
| **Real browser, built app** (`vite preview` + Playwright, 11 checks) | Clean boot: no `<body>` theme class. Switch to Deep Sea → `<body>` gets `theme-deepsea`, dashboard bg = `#0f2740`. **PART ③ PROVEN:** the gate modal is a `document.body` sibling (`#root.contains(modal)` = false) and its `primary-ink` heading follows the palette (`#dbe7ff`), i.e. the portal re-themes. Grade 3 Home renders ready skills (fallback, not empty). Export produces `{format,version,exportedAt,skills}` with the skill payload and **zero** theme/grade/preference data. |

**Scope fences honoured:** no kid-facing UI, no new recipes/skills (#11), no Grade 3 curriculum
(#12), no Netlify/origin change, legacy frozen paths untouched, `ProfileSetup`/`ProfileSelector`
NOT revived. DECISIONS.md not written (human records the themes-are-a-test-instrument entry).

**Follow-up (2026-08-26): Grade 3 removed from the picker, not just fallback-safe.** At ship,
offering Grade 3 was deliberately "safe" — `readySkills(3)` falls back to the Grade-1 set rather
than showing an empty Home. Founder's call: a grade with a numeral but no actual Grade-3 content
behind it reads as broken to a parent even though the fallback is technically correct — the
right instrument state is not to offer it at all until Now #12 lands. `testSettings.js`'s
`GRADES` narrowed from `[1,2,3]` to `[1,2]` (single source of truth — also the guard now
normalising an old persisted `grade: 3` back to 1, not just future-blocking it), `TestPanel.jsx`
renders whatever `GRADES` lists (no separate UI-only hide) and dropped the now-irrelevant "Grade
3 has no skills yet" helper text. The `readySkills(grade)` fallback itself is untouched and stays
correct in general — this only removes the ability to select the one grade that would exercise
it via the test panel. Restore `3` in `GRADES` the same day Now #12's curriculum work lands.

| Check | Result |
|---|---|
| Tests | **437 green** (+1: an explicit test that a persisted `grade: 3` normalises back to 1), 1 skipped. |
| Lint / `lint:hex` | Clean — 0 errors (3 pre-existing warnings, unchanged). |
| Real browser, built app | Parent zone renders exactly two grade buttons (`Grade 1`, `Grade 2`); `Grade 3` confirmed absent via `queryByRole`. Zero console errors. |

---

## Done — Design-system portability audit + hardening (2026-08-20)

Foundation work, not a feature: proved (and fixed) whether a future band re-skin can actually be
a token change. **Not a build** — no theme switcher, no dark mode, no Explorer content shipped.

**Audit (before any fix) swept `src/` excluding `scripts/frozen-legacy.mjs`'s frozen paths:**
- **The known leak, confirmed:** `index.css`'s effect layer (`--shadow-button`, `--shadow-card`,
  `.tinku-ground`, `.count-glyph`, `.kid-num-3d`) hardcoded Wonder indigo/ink as `rgba()`
  literals — 5 rules, ~9 calls. Plus one more outside `index.css`: `Layout.jsx`'s bottom-nav
  shadow was an inline Tailwind arbitrary-value `rgba(0,0,0,0.04)`.
- **One raw hex outside a token definition:** `.kid-tile-idle`'s gradient endpoint `#eef2ff` —
  verified (not assumed) that it is NOT reproducible as `--color-primary` at any single alpha
  over white (the three channels solve to inconsistent alphas).
- **No inline `style={{}}` carries colour/shadow/gradient anywhere in `src/`.** `Confetti.jsx`
  was already fully token-based — a clean pre-existing example, not part of the fix.
- **Non-effect-layer non-token classes found and left alone, by decision:** `text-white`
  (6 files, foreground-on-brand-button text), `Layout.jsx`'s desktop phone-bezel/notch chrome
  (`indigo-950`/`indigo-900`), `ParentGateModal.jsx`'s modal scrim (`bg-black/50`) — none of
  these are the shadow/gradient leak that was the actual ask; tokenizing them would have
  expanded this task's diff and the token vocabulary beyond what was asked. Documented as
  narrow, reasoned exceptions rather than fixed or silently ignored (see Guard below).
  `SkillCard.test.jsx`'s `.text-amber-500` is a negative test assertion, not a leak — false
  positive, no action.

**Fix — the effect layer now derives colour, it doesn't repeat it.** `--color-primary`,
`--color-primary-ink` and `--color-ink` each carry TWO co-declared forms: the hex literal
components consume, and a bare RGB channel triple (`--color-primary-rgb`, etc.) the effect
layer alpha-blends via `rgba(var(...), alpha)`. **An earlier version tried to make the triple
the ONLY source and derive the hex form via `rgb(var())`** to avoid duplication — proven wrong
in Step 3 below and reverted: per the CSS custom-properties spec, `var()` is substituted once at
the element where a property is *declared*, and descendants inherit the already-computed
result — so a scoped override of the triple never reached the derived hex token. The two forms
are now kept in sync by a new test, `src/__tests__/designTokens.test.js`, not by convention.
`.kid-tile-idle`'s `#eef2ff` became its own token, `--color-primary-tint` (not derivable, so not
folded into the triple scheme). `Layout.jsx`'s inline shadow became `--shadow-nav`.
**Verified value-preserving:** built-app screenshots before/after, byte-identical on 3 of 4
representative screens once `prefers-reduced-motion` removed animation-phase jitter as a
confound (the 4th differs only because the counting recipe randomizes its question each
session — confirmed unrelated to styling by direct inspection).

**Step 3 — proved the swap once, then reverted.** A throwaway `.theme-stress-test-dark` class
(colour custom properties only) applied to `#root`, built, and driven with Playwright against
the real `dist/` output.
- **What re-themed correctly:** Home (`SkillPathScreen`), the quiz question screen (including
  the now-fixed effect layer — shadows, mascot ground, tile gradient, count-glyph shadow), and
  the Parent Dashboard — all colour, no component touched.
- **What did NOT re-theme, found and diagnosed:**
  1. The `rgb(var())`-derivation bug above (initially discovered here, then fixed and
     re-verified in the same pass).
  2. **The Parent Gate modal never re-themed at all**, even after the fix — because
     `ParentGateModal.jsx` renders via `createPortal(..., document.body)` (DECISIONS 2026-07-14,
     the viewport-pinning fix), so its DOM node is a *sibling* of `#root`, not a descendant, and
     never inherits `#root`'s scoped custom properties. Confirmed via DOM inspection
     (`document.getElementById('root').contains(modal)` → `false`, `parentElement` → `BODY`).
     **A real band-switch mechanism needs the theme class on `document.body` (or `<html>`), not
     `#root` alone**, or every portalled surface stays locked to Wonder forever.
     **→ This is now Now #10's part ③.**
- Throwaway theme fully reverted (`index.css` block + `index.html` class) — `git diff` clean on
  both before the guard work started.

**Guard, widened (`scripts/check-raw-hex.mjs`, previously hex-only):** now also catches
`rgba()`/`rgb()`/`hsla()`/`hsl()` **literal** calls (a `var()`-based call like
`rgba(var(--color-primary-rgb), 0.2)` is correctly NOT flagged — that's the effect layer doing
its job) and non-token Tailwind colour utility classes in `.js`/`.jsx`. **`src/index.css` is no
longer exempted wholesale** — only its `:root { }` token-definition blocks are (there are two:
a small font-family block and the real token block), so the effect layer is linted like any
component now, which is the actual fix for how the original leak went uncaught. The
non-effect-layer findings from the audit (`text-white`, the phone-bezel chrome, the scrim) are
now explicit, per-site, reasoned exceptions in `scripts/frozen-legacy.mjs`'s
`COLOR_CLASS_EXCEPTIONS` — not a whole-file exemption, so a *different* violation in the same
file still fails.

**Flagged, not fixed — human decision needed:** `ThemeManager.jsx` manages views
(`skills`/`quiz`/`parent`), not colour themes, and applies no theme class anywhere. The obvious
place to wire a real band switch later is a file already named `ThemeManager` doing something
unrelated — see "Open questions" below.

**Verification**

| Check | Result |
|---|---|
| Tests | **377 green** (+3: `designTokens.test.js`), 1 skipped. Baseline 374. |
| Lint / `lint:hex` / `privacy:check` | Clean — 0 errors (3 pre-existing warnings, unchanged); widened guard passes on the real codebase. |
| Guards proven RED, one injection at a time, then reverted | ① `designTokens.test.js`: mismatched `--color-primary-rgb` against its hex pair → fails; ② `check-raw-hex.mjs`: literal `rgba()` inline in a component → fails; ③ `check-raw-hex.mjs`: `text-red-500` (not in the exceptions list) in a component → fails; ④ `check-raw-hex.mjs`: a literal colour added back into an effect-layer rule in `index.css` → fails. All four reverted, all green after. |
| Real browser, built app | Step 2's before/after screenshots (reduced-motion) byte-identical on Home/Parent Dashboard/Parent Gate; Step 3's stress-test screenshots + `getComputedStyle`/DOM diagnostics captured the two real findings above before revert. |

---

## Done — Practice composer (shipped 2026-06-28; tracker corrected 2026-08-18)

**This was NOT a 2026-08-18 build.** It is a status correction: Now #6 and `DOCMAP.md` both said
this was queued/spec-settled-not-built, and both were wrong. Recorded here in full, in the same
place every other shipped feature gets a Done block, so the record is complete going forward —
not because the work happened today.

**What shipped, 2026-06-28 (`7bd17dc`, same day as the mastery engine in `88ff481` and the parent
dashboard in `5f96c62`):**

| Piece | What it is |
|---|---|
| `src/engine/composer.js` | Pure recommender. `recommendNext(skillStates, skillMap, today, config)` walks the fixed priority chain — due-review → frontier → new-unlock → all-caught-up — exactly as specced. `getReviewsDue`, `getFrontierSkills`, `isPrereqsMet` also shipped, all pure, `today` always injected. Only `status:'ready'` skills are ever candidates; a missing prereq state counts as locked. |
| `src/config/composerConfig.js` | `PREFER_MOST_OVERDUE_REVIEW` (bool) + `FRONTIER_PICK` (`'lowest_level'` \| `'skillmap_order'`) — confirmed by reading the file directly, 2026-08-18. **No `'momentum'` option exists** — see the still-open gap below. |
| `src/engine/__tests__/composer.test.js` | 47 tests per the shipping commit's own message — full priority chain, prereq gating, tiebreaks, planned-skill exclusion, determinism. (Not re-run by this correction; cited from the commit, not independently verified today.) |
| `src/components/SkillSelectScreen.jsx` | Calls `recommendNext` in the same lazy `useState` initialiser that loads skill states (one storage read), passes `isSuggested`/`isReviewSuggested` booleans to `SkillCard`. Amber/sky card border + "Tinku suggests!" / "↻ Review time!" label — confirmed by reading the component directly, 2026-08-18. `all_caught_up` and a `null` skillId correctly produce no highlight. |

**Design principle honored:** single-skill focused sessions (locked in the spec) — the shipped
composer recommends ONE skill, never blends multiple skills into one session. That's a design
decision, not a shortfall.

**Two real gaps against the spec — correctly still open, not shipped:**

1. **In-session review embedding.** The spec's "how the UI uses it later" section imagined due
   reviews appearing as 2–3 warm-up questions *inside* a frontier session. What shipped instead:
   review-first priority at the *recommendation* level — if anything is due, the whole session IS
   the review. Blending reviews into a different skill's session was never built.
2. **`FRONTIER_PICK: 'momentum'`.** Config only supports `'lowest_level'` / `'skillmap_order'`
   today. `'momentum'` (most-recently-played unmastered skill, per the composer/suggestion-
   direction rationale below) does not exist in code.

Both are **kid-test-gated design calls**, same class as the Screen 3-B verdict (#5) and the
welcome-screen decision (#9) — P2, observe on the current trip.

**Verification note:** this correction is based on reading `composer.js`, `composerConfig.js`,
`composer.test.js`'s existence, and `SkillSelectScreen.jsx` directly, plus the git history for
`src/engine/composer.js` and `src/config/masteryConfig.js`. It does **not** include a fresh
`npm run test:run` — that re-verification is a small, cheap follow-up for whoever next has the
repo open, not urgent (the code and its own commit's test count are the artifact; nothing here
depends on re-running it today).

---

## Done — Composer / Suggestion Direction (design rationale — see correction above for build status)

- Frontier-first suggestion — review is NEVER the headline CTA. **Shipped** — see the Done block above.
- Due reviews embed as 2–3 warm-up questions at session start. **Still NOT built** — genuine gap,
  kid-test-gated, see the Done block above. (This bullet previously read "(composer, not yet
  built)", which conflated this one still-open piece with the composer as a whole — corrected.)
- New `FRONTIER_PICK: 'momentum'` config option — most-recently-played unmastered skill until
  mastered, then curriculum order, prereqs gate. **Still NOT built** — confirmed absent from
  `composerConfig.js`, 2026-08-18. Current production default `'lowest_level'` stays as fallback.
- Rationale: kids don't persist through backward-pointing suggestions; forward motion must be the
  visible default; retention happens invisibly inside sessions.
- Validate against real kid behavior (follow Tinku's pointer, or route around him?) before building
  either remaining piece — the India trip is that validation.

---

## Done — Progress export/import (2026-08-17)

Closes Now #3. Shape locked in DECISIONS 2026-08-17; this block records what actually shipped
against it.

| Piece | What it is |
|---|---|
| `src/services/progressBackup.js` | **New, pure.** Envelope build/parse/validate — no DOM, no storage, no React. `parseImportPayload` refuses the WHOLE import on any structurally malformed entry (wrong/extra keys, wrong types, `skillId` ≠ its own map key); a structurally-sound entry whose `skillId` isn't in today's curriculum is dropped and counted (`ignoredSkillCount`), never fatal. Takes `knownSkillIds` as a parameter rather than importing `skillMap.js` — same decoupling `composer.js` uses. |
| `src/services/progressStore.js` | `+replaceAllSkillStates(skills)` — one `writeStore` call, no prior read: a genuine REPLACE, not a merge. |
| `src/hooks/useProgressBackup.js` | **New.** Orchestration hook (ParentDashboard stays presentational): `exportProgress` (Blob → object URL → `<a download>` → revoke), `stageImportFile`/`pendingImport`/`confirmImport`/`cancelImport` for the two-step import flow. Error-code → sentence mapping lives here, not in the pure module or the component. |
| `src/components/ParentDashboard.jsx` | New "Progress backup" section in the settings footer. Empty-progress state = disabled Export button + hint (avoids a parent later restoring an accidental empty backup over real progress, since import always replaces). Import confirm follows the existing `confirmRemove` inline-confirm idiom. |
| `src/config/privacyPolicy.js` + `public/privacy.html` | Restored *"You can save a backup copy from the Parent Zone at any time."* in the `on-device` section — same commit, regenerated via `npm run privacy:build`. |

**Guards** (DECISIONS: envelope "guarded... not merely reviewed once"):
- **Guard A** (`progressBackup.test.js`) — `SKILL_STATE_KEYS` allowlist asserted equal to `emptySkillState()`'s real keys. **Proven RED**: temporarily dropped `misconceptions` from the allowlist → 4 tests failed including the guard itself → reverted.
- **Guard B** (`progressBackup.test.js`) — a passcode-shaped entry (`{ passcodeHash: '...' }`) smuggled under `skills` must be refused. **Proven RED**: temporarily made `isValidSkillStateEntry` return `true` unconditionally → 6 tests failed including the guard → reverted.
- **Guard C** (`ParentDashboard.test.jsx`) — real end-to-end: seeded jsdom `localStorage` with both a skill state AND the parent-passcode key, exported, asserted the Blob content contains the skill data and none of `passcodeHash` / the settings-key substring.

**Verification**

| Check | Result |
|---|---|
| Tests | **374 green** (+27), 1 skipped. Baseline before this work: 347 green / 1 skipped (post-#9a). |
| Lint / `lint:hex` / `privacy:check` | Clean — 0 errors (3 pre-existing warnings, unchanged); hex guard clean; privacy byte-identical. |
| Guards A and B | **Proven RED then reverted**, one injection at a time (see above). |
| **Real browser, built app** (`npm run build` + `vite preview`, Playwright against the actual `dist/`) | Seeded real progress → Parent zone shows the backup section → Export produces `tinku-math-progress-2026-08-17.json` with the correct `{format, version, exportedAt, skills}` shape and the real skill data, **zero passcode leakage** → cleared storage → Export correctly disabled with the hint → Import shows the two-step confirm (*"...1 skill... This can't be undone."*) → after confirm, `localStorage` exactly matches the original skill state → zero console errors. `/privacy.html`: **1 request, zero off-origin**, restored backup sentence renders. |

**Unblocks:** the Netlify-rename pre-launch-checklist row's "no recovery path" clause is now false — see that row below, updated in this commit.

---

## Done — Privacy policy + Play Data Safety (2026-08-15)

**Shape of the solution: one text, two surfaces, guarded.** The policy has to be at a public URL
(Play needs a link a reviewer can open without installing) *and* inside the app
(Designed-for-Families). Two hand-maintained copies of a legal text drift, and the stale one is
always the one nobody opens — so the words are **data** in `src/config/privacyPolicy.js` and both
surfaces render from it.

| Piece | What it is |
|---|---|
| `src/config/privacyPolicy.js` | **Source of truth.** Sections as plain data — no markup, no JSX — so Node and React both consume it. |
| `scripts/build-privacy-page.mjs` → `public/privacy.html` | The public page. Generated into `public/` (not `dist/`) so Vite copies it and it enters the **PWA precache** — offline-reachable like the in-app copy. |
| `src/components/PrivacyPolicy.jsx` | In-app copy: parent zone → privacy card → "Read the full privacy policy". Swaps in over the dashboard via local state — an external link would drop the parent out of the app in the Capacitor wrap. |
| `claude-chat/play-data-safety-form.md` | The Data Safety wizard answers **verbatim**, with the factual basis for each, plus a pre-submission checklist and the Designed-for-Families split (what #2 closed vs what #8 still owns). |

**Two deliberate departures from the approved draft** — both because the text may only claim what
is true today (full reasoning in DECISIONS 2026-08-15):

1. **"Short version: we don't collect anything" → "the app collects nothing about you or your
   child."** The original is the absolute claim DECISIONS 2026-08-14 rejects, and the draft itself
   contradicts it two sections later with the technical-information line. The shipped wording keeps
   the punch and draws the exact distinction: *the app* collects nothing (measured); the delivery
   services log what delivery services log.
2. **"You can save a backup copy from the Parent Zone at any time" — OMITTED.** Export/import is
   Now #3, not built. A policy may not describe a feature that doesn't exist. Restored (and the
   guard assertion **flipped**, per DECISIONS 2026-08-17) in the same commit that ships export.

**Data Safety answer is "No" to collection or sharing.** The form and the policy answer *different
questions* and must both stay as written — the form asks what **the app** collects (nothing: no
SDK, no network call); the policy additionally discloses Play Console vitals and Netlify request
logs because a parent deserves the whole picture. **Do not "reconcile" them** in either direction.

**Verification**

| Check | Result |
|---|---|
| Tests | **328 green** (+21 new), 1 skipped. Baseline before this work measured **308** across 4 clean runs. |
| Lint / raw-hex guard | Clean — 0 errors (3 pre-existing warnings, unchanged). |
| Drift guard | `npm run privacy:check` compares the committed HTML byte-for-byte with the generator output. Wired into CI **before** the build step on purpose — `npm run build` regenerates the page and would mask exactly the drift being checked. |
| SW navigation fallback | `navigateFallbackDenylist: [/^\/privacy\.html$/]` confirmed **present in the built `dist/sw.js`**, and `privacy.html` confirmed **in the precache manifest**. Without it the SW answers the policy URL with the app shell — for a Play reviewer on a device with the PWA installed. |
| **Real browser, built page** | `/privacy.html` served from `dist/`: **1 request, zero off-origin, no page errors.** Title, all 8 headings and the `mailto:` link render. The page is self-contained by requirement — a policy claiming "no network calls" must not make any. |
| Bundle size | 201.1 kB → **204.9 kB** (+3.8 kB for the policy text + in-app screen). |

**⚠️ Two human actions before submit** (neither is code):

1. **Netlify domain unknown to the repo.** `play-data-safety-form.md` carries
   `https://<SITE>/privacy.html` as a placeholder. Fill in the live domain in **both** places Play
   asks — store listing *and* Data Safety form — and confirm it loads in a private window.
2. ~~**The app-name decision**~~ — **RESOLVED 2026-08-16**, see the amendment below and the
   pre-launch checklist row.

## Done — Policy corrections + app-name unification (2026-08-16)

Two defects in the policy shipped two days earlier, plus the name mismatch that made it name an app
the store would not list.

**① The policy published a legal conclusion nobody qualified had reached.** The `children` section
ended *"...no parental consent is required for the app to work."* The first clause was a measured
fact about the build; that one was an **opinion on an open DPDP question** —
`questionnaire-lawyer-dpdp.md` Section B, consult deferred (DECISIONS 2026-08-14). In a
children's-app policy that is a misrepresentation risk if wrong, and it bought nothing: the factual
claim already did the reassurance work. Removed, and **guarded** — the phrase and its paraphrases
now fail the suite, and may only return alongside a DECISIONS entry recording a **human** legal
opinion. **The age range went too** ("aged roughly 5–9" matched nothing: DECISIONS said 5–8, the
composer spec 5–7, and Play's fixed buckets are declared in Console). The band lives in Play Console
only, so the two can never disagree. Grades 1–3 → Play's "Ages 6–8" when that is declared.

**② `OPERATOR_LINE` added, deliberately blank and guarded.** The policy says "we" throughout and
names nobody. The operator must match the Play developer name, which is still an open pre-launch
decision — so rather than guess, `TODO(operator)` is asserted in **both directions**: while blank
the policy must name no operator AND the TODO must survive; once set it must reach both surfaces.

**③ One name, derived not repeated.** Five surfaces held five literals. `src/config/brand.js` is now
the single source; `vite.config.js` derives the manifest and substitutes `%PRODUCT_NAME%` into the
`index.html` `<title>`; `privacyPolicy.js` re-exports it as `APP_NAME`. **Derivation beats
detection** — those cannot drift by construction. `config/__tests__/brand.test.js` covers the rest.
`PLAY_TITLE` = `Tinku Math: Maths for Kids` (26/30), recorded in docs only — never in code.

**Verification**

| Check | Result |
|---|---|
| Tests | **344 green** (+16), 1 skipped. Baseline 328. |
| Lint / raw-hex / `privacy:check` | Clean — 0 errors (3 pre-existing warnings, unchanged). |
| **Guards proven RED**, one injection at a time | ① restoring "no parental consent is required" → policy guard fails; ② deleting the `TODO(operator)` while blank → operator guard fails; ③ hardcoding `name: 'CBSE Math Kids'` back into `vite.config.js` → brand guard fails on **both** the structural assertion and the retired-name sweep; ④ hand-editing `public/privacy.html` → `privacy:check` exit 1. All reverted, all green after. |
| Built output | `dist/manifest.webmanifest` → `Tinku Math` / `Tinku Math` / `CBSE-aligned maths practice for Grades 1-3`; `dist/index.html` `<title>Tinku Math</title>`. **Zero** retired-name matches in either. |
| **Real browser, built output** | `/privacy.html`: new children section renders, **no** "parental consent", **no** age claim, **1 request, zero off-origin**. App shell: title reads **Tinku Math**, 12 requests, **zero off-origin**, no page errors. |
| Live-surface grep | `CBSE Math Kids` / `CBSC` return **nothing** outside the guard and `brand.js` itself (both must name them to do their job — exclusion is explicit and commented, never silent). |

**Left alone on purpose:** `documents/*.md` (historical planning records — rewriting them would
falsify what was true when written; they also carry stale `f:/AI Programming/CBSC App/` Windows
paths, its own cleanup) and the deletion question for dead `Login.jsx` (its *string* was renamed so
the guard has no hole, but whether the file lives is still open under "Dead code after de-Firebase").

### ⚠️ Flake observed in passing (NOT introduced here, but CI-relevant) — now tracked as Now #9a

`components/__tests__/ParentGate.noauth.integration.test.jsx` **failed once in ~10 full-suite
runs** — on the *cold* run (13.9 s total vs 10.6 s warm), and passed in isolation immediately
after. It is a single `it` chaining ~20 `waitFor`/`findBy` calls against the default **5 s** vitest
timeout, so a cold transform/import pass can push it over. **CI always runs cold.** Not touched
here (it is unrelated to this task and is someone's test to change), but it is a live flake risk on
the workflow that now gates every merge — a per-test `{ timeout: 15000 }` would close it.

**Promoted 2026-08-16 to Now #9a**, with the full diagnosis. It was wrong to leave this as a
footnote: every guard in this repo is worth exactly what a red run means, and a 1-in-10 flake
teaches people to re-run instead of read.

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

### 📌 Third finding (2026-08-15, no code impact) — a cache scare, and what it taught

The live Netlify app appeared to have lost the parent zone and Screen 3-B and looked months old,
immediately after a session that removed a dependency and deleted files. **Nothing was wrong:**
`master` had every file, and `ThemeManager` wired `SkillPathScreen` as the default home with
`ParentDashboard` behind the gate. It was a local PWA cache.

Recorded because the *diagnosis* is reusable: **"did we lose code" and "am I looking at the code"
are different questions with different tests**, and the cheap one — an incognito window — answers
the second in 30 seconds and mostly settles the first for free. A stale service worker and a
genuinely stale published deploy look identical from the outside. See "Deploy verification" above,
now a standing checklist step.

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
  - ⚠️ **2026-08-20:** this portal fix is exactly why the gate modal does not inherit a theme scope on `#root` — see the design-system audit and Now #10 part ③.
- **Skill-state visual grammar unified** — shared `skillStateVisual.jsx` helper, both Home views (path + cards) now derive ring/label/pips identically by construction. Fixed the amber-while-due violation (a review-due node was wearing the achievement color). One loud CTA per screen; due-not-suggested = muted teal cue on neutral ring, never amber. Cross-view identity test added. 296 tests.
  - **DECISIONS 2026-07-15:** grammar locked as above

## Done — Feel Layer

- **Wiring audit** — all 5 sounds (tap/correct/hint/wrong/complete) correctly wired through the sound service; haptics on tap+correct; mute silences both; parent zone correctly silent. Only `sleeping` mascot pose is unwired (inert, harmlessly preloaded). No defects found.
  - **DECISIONS:** mute is session-scoped by design, sound defaults ON each app start (restart-heavy kid usage) — not a bug
  - **T99 candidates captured** (below)

## Done — Legal / MVP Scope Cuts (2026-07-16 — the first simplification)

- **Legal pack created:** `questionnaire-lawyer-dpdp.md`, `questionnaire-ca-tax-uae-india.md`, `dpdp-lawyer-conversation-guide.md` — all reflect Indian-citizen/UAE-resident (NRI) founder profile
- **NyayGuru AI-advocate response received** — coherent on design questions, but **drifted on the one question governed by text** (recommended OTP/Google for Rule 10 twice, the second time while quoting text that doesn't support it). Useful for architecture, not for statutory reading. See 2026-08-14 block above.
- **Analytics removed entirely from MVP** — no Firebase Analytics SDK in the build, zero telemetry (guest or otherwise). Wrapper (T91) reduced to inert no-op seam; call-sites preserved for future reactivation.
  - **DECISIONS 2026-07-16:** MVP ships with NO analytics whatsoever.
- **T107 (privacy notice)** — reopened 2026-08-14, **closed 2026-08-15**: the store/hosting-data line is in the published policy and the absolute "we collect no personal data" claim is not used. See the "Privacy policy + Play Data Safety" Done block above.
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

**Live now (founder in India, 2026-08-21).** These are the questions the trip exists to answer;
four Now rows are gated on them and should NOT be built until they are.

- Does the kid follow Tinku's pointer, or route around it? — **informs `FRONTIER_PICK:'momentum'` (#6 gap)**
- Does a backward (review) suggestion visibly deflate motivation? — **informs in-session review embedding (#6 gap)**
- Journey path (default) vs card list (`?home=cards`) — which does a child navigate more confidently? — **informs #5**
- Does a child launching straight into the skill path (no welcome/onboarding) know what to do? — **informs #9**
- **NEW (#10):** does a theme change get noticed or reacted to at all? Does a child ask for a different one, or ask to keep one? **Watch for indifference as a real result** — if theme variety moves nothing, the kid-facing picker stays unbuilt and this is a cheap answer, not a failure.
- **NEW (#11):** is Grade 2 content pitched right, or too hard/easy? Does a Grade 2/3 child find the Grade 1 material insulting? **Specific instance found 2026-08-22 (screenshots, not yet a kid-test result):** on `g2.add.2d-nocarry`, one strong session (≥80%) bumps the adaptive difficulty a full rung immediately (`mastery.js`, pre-existing engine), and a session runs at ONE FIXED difficulty throughout — no ramp within the 8 questions. So the session right after a good one jumps straight to the harder ceiling (39→69) with no easing-in. **Corrected 2026-08-26 (was wrong):** the within-rung mix of trivial single-digit-addend questions (`66+1=?`, testing `column-alignment-shift`) with full 2-digit sums (`34+24=?`) is NOT deliberate — nothing in `addition2d.js` sets that proportion. `buildOperands` draws `a` uniformly across the full cap range FIRST, then draws `b` from `[1, cap-a]`; when `a` lands near the top of its range, `cap-a` is small, forcing `b` small (often single-digit) — the "trivial-looking" questions are an artifact of that sampling order, not a designed mix ratio. Content is correct CBSE Grade-2 syllabus (2-digit addition to 99, with/without carry); this is a PACING question, not a scope question. **Decision:** leave as-is until the trip's kid-test signal says otherwise — same gate as the other #11/#5/#9 pacing questions. If it turns out to matter, the options on the table are (a) an in-session difficulty ramp, (b) requiring 2 strong sessions before advancing a rung, (c) tuning down how often the trivial single-digit-addend variant appears.
- Does progress loss (cleared data / new device) actually happen in practice, and do parents notice? — informs whether export/import is sufficient
- **NEW (bridge-in, 2026-09-22, toggle default OFF):** does the bridge walk change the freeze on
  `34+24` (the rung-freeze finding that motivated strategy rungs, 2026-08-27)? Does the extra
  10–11 visible questions (bridge + scored, +1 more if parked) fatigue a child or cause
  abandonment? Compare toggle ON vs OFF on the same child/skill where possible. Revisit trigger
  already locked in `DECISIONS.md` 2026-09-22: if fatigue/abandonment shows, cut to the single
  rung immediately below the working rung (not the full walk) before dropping the idea entirely.
- (existing items carried from prior log — see git history / prior Drive export for full list predating this file)

## Parked Ideas (carried over, one line each)

- **Onboarding-tone reference (Stitch-style mockup, found online, 2026-08-18)** — a 3-screen toddler
  activity-app flow (welcome hero → name/age/avatar profile creation → tiled activity home). Tone
  only, revisit only if Now #9's kid-test signal calls for building an onboarding beat at all — not
  decided, not scheduled. **Sizing constraint if it ever gets built:** cap at 2 screens, not 3 — a
  child/parent won't sustain a third tap before reaching the actual app. **Corrections needed if
  ever drawn from (not exhaustive — too early to fix the list; re-audit against DECISIONS at time
  of use):** multi-character cast → Tinku is the ONLY mascot; age gate reads 2–5 yrs → this is
  Grades 1–3, ages ~6–8; generic activity tiles (art/puzzles/stories/music) → no analogue in a
  recipe/skill-map product; name + avatar + implied multi-child profiles → the deferred Layer 2
  account model, and a name field is exactly the kind of thing MVP scope (DECISIONS 2026-08-14)
  exists to avoid collecting at all. The image itself lives in chat history, not this repo — pull
  it back into DECISIONS/specs if and when this is actually picked up.
- **Kid-facing theme picker** — deliberately NOT in MVP (see "Out of MVP scope"). Revisit only if the
  trip shows theme variety actually moves engagement.
- **More Screen 3-B path variations** (raised 2026-08-21) — additional journey-path layouts to A/B
  alongside the current one. Parked, not scheduled: #5's verdict on path-vs-cards should land first,
  since more variations of a shape that loses to card-list would be wasted work.
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
and the constraints that bind when Layer 2 returns)**, 2026-08-15 (no auth SDK in
the MVP build), 2026-08-16 (`PRODUCT_NAME` derived not repeated; no legal
conclusions or age band in the policy), **2026-08-17 (progress export/import:
progress only, versioned envelope, REPLACE not merge — the shape behind Now #3)**,
**2026-08-21 (themes are a parent-zone test instrument, not a kid-facing feature)**,
**2026-08-25 (the average-learner design principle; distractor plausibility — at
most one implausible option per question, amended same day with the absolute
tolerance floor and the random tiebreak)**,
**2026-08-27 (strategy rungs replace magnitude rungs; `level` and `difficulty` decouple —
`difficulty` needs two consecutive strong sessions per rung)**,
**2026-08-31 (no day-gate on mastery; the "different days" claim is corrected and removed,
not implemented — same-day strong sessions count fully; validated by the simulation in
`claude-chat/mastery-simulation-report.md`, see the Done block "Mastery simulation across ten
learner archetypes")**,
**2026-09-01 (`level` requires consolidation too: `LEVEL_UP_STREAK` mirrors `DIFFICULTY_UP_STREAK`,
independent `levelStreak` counter, hold-at-cap at the 4→5 hop; re-validated by the same simulation —
before/after in `claude-chat/mastery-simulation-report.md`, see the Done block "`level` consolidation:
`LEVEL_UP_STREAK`")**,
**2026-09-02 (`LEVEL_UP_STREAK` rejected on that same simulation — archetype 5 mastery 23.6% → 0.0% —
and `level` reverts to single-session promotion; the archetype-4-vs-5 cliff deliberately left open —
see the Done block "`LEVEL_UP_STREAK` reverted")**,
**2026-09-22 (remediation ladder step 3: session-level park + one bonus question at the skill's
easiest difficulty, excluded entirely from score/questionsTotal/questionsCorrect/applyResult's input;
step 2 revised to drop the never-built easier-retry, since a session is one fixed difficulty — see the
Done block "Remediation ladder step 3: park + bonus question")**.

Note: the 2026-08-18 corrections (Now #6, the composer Done blocks, DOCMAP's
spec-practice-composer.md row) and the 2026-08-21 status ones (Now #7 split, Now #12 /
Grade 3 absent) are status corrections, not new decisions — nothing was added to
`DECISIONS.md` for them. **The three decisions previously logged here as owed are now
recorded** (`DECISIONS.md` Change log, 2026-08-21 and 2026-08-25 entries):
1. Themes are a parent-zone test instrument, not a kid-facing feature.
2. **The average-learner design principle** — the product is built for the average
   learner, not the strong one; a tiebreaker for pacing/difficulty/promotion decisions,
   worked example: why the Grade-1 reference recipes were brought into the plausibility
   fix's scope rather than deferred.
3. **The distractor-plausibility rule** — at most one implausible distractor per
   question, defined as a monotonic-fact violation OR a magnitude-ratio violation,
   overridden by an absolute-tolerance floor (±3) at small answers, with ties among
   implausible candidates broken at random. Implemented in `src/recipes/_plausibility.js`.
