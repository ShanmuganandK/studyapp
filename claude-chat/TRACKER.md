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

_Last synced: 2026-08-18_

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
| 2 | **Privacy policy + Play Data Safety form** | ✅ **Done 2026-08-16** — 1 human action left | Both surfaces shipped: public page at **`/privacy.html`** and in-app via parent zone → "Read the full privacy policy", rendering from ONE source module and guarded against drift. Data Safety answers written verbatim in `play-data-safety-form.md`. **Corrected 2026-08-16:** the published legal conclusion ("no parental consent is required") and the age range are **removed and guarded** — see DECISIONS 2026-08-16. App name unified, so the policy now names the app the store will list. **Only remaining blocker: the live Netlify domain** (see the URL row below and the pre-launch checklist). `OPERATOR_LINE` is blank-and-guarded — must be closed before submission. |
| 2a | **CI wiring / standards guard** | ✅ **Done 2026-08-15** | Was a false claim (see the corrected Done entry below). Now real: `eslint.config.js` (ESLint 9 flat), `scripts/check-raw-hex.mjs`, `scripts/frozen-legacy.mjs`, `.github/workflows/ci.yml`. **Proven red on a real Actions run**, not trusted green. |
| 3 | **Progress export/import** | ✅ **Done 2026-08-17** | Shipped exactly the shape locked in DECISIONS 2026-08-17: one file (`tinku-math-progress-YYYY-MM-DD.json`), versioned/refusable envelope (`{format, version, exportedAt, skills}`), REPLACE-not-merge import behind a two-step confirm, validate-fully-then-write-once, unknown `skillId`s ignored+counted (never fatal), envelope guarded against an allowlist. **New files:** `src/services/progressBackup.js` (pure build/parse/validate — no DOM/storage, mirrors `mastery.js`/`composer.js` purity, takes `knownSkillIds` as a param rather than importing the curriculum, same decoupling as `composer.js` + `skillMap`), `src/hooks/useProgressBackup.js` (orchestration; ParentDashboard stays presentational). **`progressStore.js`** gained `replaceAllSkillStates(skills)` — one write, no prior read, genuine replace. **UI**: Export/Import in `ParentDashboard`'s settings footer, following the existing `confirmRemove` inline-confirm idiom; empty-progress state is a disabled Export button with a hint (my call — an empty-but-"valid" file is a footgun against later accidentally restoring nothing over real progress). **Policy, same commit:** the backup sentence is restored in `src/config/privacyPolicy.js`, the `does not promise the unshipped progress export` guard in `privacyPolicy.test.js` is FLIPPED (not deleted) to assert the opposite, `public/privacy.html` regenerated via `npm run privacy:build`. **Unblocks** the Netlify-rename row below (its "no recovery path" clause is now false). |
| 4 | Phone regression checklist (A–L) | 🔶 In progress | Manual walk on real device + DevTools. Sections A/B/C need RE-WALK (skill-state grammar changed). See `phoneregressionchecklist.pdf`. **ADD a new step (2026-08-15): verify the Netlify published deploy SHA matches `master` BEFORE walking anything** — see "Deploy verification" below. |
| 5 | Screen 3-B verdict (journey path vs. cards) | ⏳ Pending | Judge on current (post-grammar-fix) build. Path is live on master; card view at `?home=cards`. Kid-testing is the gate. |
| 6 | ~~Session composer build~~ | ✅ **Corrected 2026-08-18 — already Done, since 2026-06-28** | This row read "Queued — spec settled" for at least the whole 2026-08-15 → 2026-08-18 window. It was wrong: `src/engine/composer.js`, `src/config/composerConfig.js` and 47 tests shipped 2026-06-28 (`7bd17dc`), and `SkillSelectScreen` has rendered the "Tinku suggests!" / "↻ Review time!" card highlight from `recommendNext` ever since. Found by reading the actual files, not either doc — see the full correction below and in `DOCMAP.md`. **Two real gaps remain**, correctly distinguished from what shipped: in-session review-embedding (warm-up questions inside a frontier session) and `FRONTIER_PICK: 'momentum'` were never built — both are kid-test-gated design calls, not currently scheduled, same class as #5 and #9. |
| 7 | Remaining ~29 recipes | ⏳ Background | Curriculum breadth. Fully unblocked. |
| 8 | **Designed-for-Families programme rules** | ⏳ Read before submit — **privacy half now done** | We target under-13s, so we are in it. Content + ads rules are independent of DPDP. The **policy** obligations are closed by #2 (policy exists, is linked, is reachable in-app, no ads, no collection). **Still open:** target-age declaration, content rating questionnaire, content policy, store-listing assets, and the external-link rule as it applies to the parent-zone WhatsApp link — enumerated in `play-data-safety-form.md` §4. |
| 9a | **ParentGate integration test flakes on cold runs** | ✅ **Done 2026-08-17** | Taken ahead of #3 as sequenced above. Applied the "better fix" from the diagnosis below: split the single giant `it` (chaining ~20 sequential `waitFor`/`findBy` calls against vitest's default 5 s per-test timeout) into 4 staged tests — set → verify → forgot-reset → remove — sharing one continuous render via `beforeAll`/`afterAll` instead of per-test `render`/`cleanup`. Each stage now gets its own 5 s budget, and a future failure names the stage instead of an opaque 20-step test. Own commit, not folded into #3. Full run: **347 green + 1 skipped** (344 baseline + 3 new stages), lint clean (0 errors, same 3 pre-existing warnings). Original diagnosis preserved below. |
| 9 | **Welcome / onboarding screen — TRACE, then decide** | 🔎 **Traced 2026-08-18 — decision still open** | **Confirmed (a): `ProfileSetup.jsx` is the recalled "welcome page"** — pixel/line match against `documents/screenshots/01_welcome_screen.png` (committed 2026-06-18). **`ProfileSelector.jsx` is "the one other"** — a multi-child "Who is playing?" picker from the old anonymous→Google account model. Both genuinely unrendered (zero references in `src/`) and both additionally **inert**: `localAdapter`'s `onAuthStateChanged` always resolves `null` since the 2026-08-15 de-Firebase rewrite, so `profiles` never leaves `[]` and `addProfile` is a silent no-op if ever rendered. Already documented, not lost — `TASK-INDEX.md` T110 and `ProfileSetup.jsx`'s own docblock both say "quarantined." (b)/(c) ruled out: `git log --diff-filter=A --all` + both stale local branches checked, no unique unmerged commits. **Not a fifth false claim.** **Decision not yet made** — see the reference captured in Parked Ideas below; revisit against real kid-test signal (Kid-Test Log already asks "does a child launching straight into the skill path know what to do?"), not from a desk. |

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
> anywhere until now.

| Item | Status | Note |
|---|---|---|
| ✅ **App name decision + "CBSE" in the name** | ✅ **Resolved 2026-08-16** | **`PRODUCT_NAME` = "Tinku Math"** everywhere — manifest, launcher, page title, `package.json`, README, privacy policy. **Play listing title = `Tinku Math: Maths for Kids`** (26/30 chars); it lives **nowhere in the codebase** by design (ASO copy, entered by hand, changes on its own schedule). **Rule locked: brand first, keyword second.** "CBSE" is out of the *name* — statutory board, impersonation risk, exactly as flagged — and kept in the *description* (`CBSE-aligned maths practice for Grades 1-3`), which is ordinary descriptive use. The name is now defined once in `src/config/brand.js` and **derived** by every surface, so they cannot drift apart; `config/__tests__/brand.test.js` guards what can only be checked. **Store assets are unblocked.** DECISIONS 2026-08-16. |
| Developer / publisher name | ⏳ **Open — now guarded** | Own name vs. a trade name. Appears on the store listing and in the privacy policy. Interim contact is the personal Gmail; decide whether that ships. **The policy currently names NO operator** — it says "we" throughout, which is a transparency gap Play and DPDP both expect closed. `OPERATOR_LINE` in `src/config/privacyPolicy.js` is blank with a `TODO(operator)`, and the guard asserts **both directions**: while blank the policy must name nobody AND the TODO must survive; once set, the line must reach both surfaces. Whatever is chosen **must match the Play developer name**. Fill it, then `npm run privacy:build`. |
| ⚠️ **Netlify site name contains the `CBSC` typo** | ❗ **Open — decide, do not rush** | The site is **`shan-studyapp-CBSC.netlify.app`**, so the typo T9 was opened to fix in June now sits in the **public URL — the very URL that goes into the Play listing as the privacy-policy link**. **Good news: the hostname is hardcoded NOWHERE.** `grep -rniE "shan-studyapp\|netlify\.app"` returns zero hits across the working tree, and `git log --all -S "netlify.app"` shows it was never committed — every repo reference is the generic word "Netlify". **So a rename touches no code. It changes the ORIGIN, and that is where the damage is:** ① **all child progress is destroyed** — `progressStore` (`tinku:v1:skills`) and the parent passcode (`math_kids_settings_anon`) are `localStorage`, which is origin-scoped, but **export/import (#3) now ships — testers can export before any origin change**, so the "no recovery path" risk is closed (a parent/tester must actually export first — the app doesn't do it for them); ② **installed PWAs rot silently** — the offline-first service worker keeps serving the cached shell from a hostname that no longer resolves to you, so testers' apps appear to work while never updating again (the cache-vs-deploy ambiguity in its worst form: no error, just permanent staleness); ③ the old subdomain **returns to Netlify's pool**, so it is not yours to redirect from; ④ every already-shared link, WhatsApp share and QR code breaks. A **custom domain** crosses the same origin boundary (a redirect does not carry `localStorage`), plus DNS + cert, plus updating the policy URL in **both** Play fields if already submitted. **Not at risk:** the Capacitor/Play build — it loads bundled assets locally, so the web origin is irrelevant to the Android app. **Cheapest sequencing if you do it: ship #3 first, have testers export, then rename.** |
| Privacy policy public URL | 🔶 **Code done (#2) — needs the domain** | Page ships at **`/privacy.html`** (generated, precached, offline-reachable) and is linked in-app from the parent zone. **Nothing in the repo knows the live Netlify domain**, so `play-data-safety-form.md` carries `https://<SITE>/privacy.html` as a placeholder. Fill it into **both** places Play asks — store listing *and* Data Safety form — and confirm it loads in a **private window** (per Deploy verification above: incognito is also what proves it is the deploy, not your cache). |
| Play Data Safety form | 🔶 **Answers drafted (#2) — needs entering** | `claude-chat/play-data-safety-form.md` holds the verbatim wizard answers, the factual basis for each, and a pre-submission checklist. Answer is **no data collected, no data shared**. Still verify against the live form — it is Google's UI and it changes. ⚠️ **The declaration is a claim about the BUILD:** if any future build adds a network call, an SDK or an account, re-answer it *before* that build ships. |
| Designed for Families enrolment | ⏳ #8 | We target under-13s, so we are in it. Content + ads rules, independent of DPDP. |
| Store listing assets | ⏳ Not started | Icon, feature graphic, screenshots, short + full description. Blocked on the name decision above. |
| Play Console account | ❓ Unknown | DECISIONS says individual account under UAE identity, payouts to UAE bank. **Is it actually created and verified?** Google identity verification for individual developers takes time — start it early even though MVP takes no money. |
| Content rating questionnaire | ⏳ Not started | Standard Play step. |

## Open questions / to trace (added 2026-08-15)

| Item | Why it's here |
|---|---|
| **Done-sweep: verify every Done claim has an artifact — AND every queued claim ISN'T secretly done** | Originally scoped one direction only. Three Done claims were checked on 2026-08-15 and **three were false** — CI wiring, questionnaire v2, the 296 test count. That direction is still open (**~1 hour: for each Done line, does the artifact exist?** — do before kid-testing). **Widened 2026-08-18** after the mirror case surfaced unprompted: Now #6 (session composer) sat marked "Queued — not built" while `src/engine/composer.js` had shipped, tested and been wired into the UI for **seven weeks**. The claims rule was built to catch the first shape and does not catch the second — a queued/spec-settled item is worth a `grep`/`git log` check against the paths its own spec names, same as a Done line is worth an artifact check. Both sweeps belong in the same pass. |
| **Welcome screen** | **Traced 2026-08-18 — see Now #9.** `ProfileSetup.jsx`/`ProfileSelector.jsx` confirmed as the recalled screens, not a false claim. Whether to build/revive anything is a separate, still-open product decision. |
| **Questionnaire v2 not committed** | v2 exists as a chat draft only; the repo has v1 with A4 annotated in place. Either commit v2 or knowingly send v1. No action needed until the DPDP consult is un-deferred, but it must not be forgotten at that moment. |
| **Gazette PDF verification** | The Rule 10 / Fourth Schedule reading is confirmed across three reproductions incl. a law-firm full text, but **not against G.S.R. 846(E) itself**. Sufficient for the current decision (safe under any reading); close before any Layer 2 build. |
| **Dead code after de-Firebase** | `Login.jsx` is rendered nowhere and its auth backend is gone. `ProfileSelector.jsx` is also unrendered. Decide: delete, or leave as frozen legacy pending T109? Leaving unrendered components that reference a removed capability is how the next audit gets confused. |
| **Passcode re-homing** | Known and deferred: passcode lives under `math_kids_settings_anon` via the auth context. Needs proper re-homing **whenever** T109 happens. Recorded so it is not rediscovered as a bug. |
| **`ThemeManager.jsx` naming trap** (design-system audit, 2026-08-20) | It manages *views* (`skills`/`quiz`/`parent`), not colour themes, and applies no theme class anywhere today. When a real band switch lands, the obvious place to wire it is a file already named `ThemeManager` doing something unrelated — flagged, not fixed (widely referenced, separate diff). Decide: rename `ThemeManager` → something view-specific (e.g. `ViewManager`) and let a real `ThemeManager` be born correctly-named later, or accept the collision and document it loudly at the call site when band-switching is actually built. |

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
welcome-screen decision (#9) — not scheduled, not forgotten, waiting on the same India trip.

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

- Does the kid follow Tinku's pointer, or route around it?
- Does a backward (review) suggestion visibly deflate motivation?
- Does progress loss (cleared data / new device) actually happen in practice, and do parents notice? — informs whether export/import is sufficient
- Does a child launching straight into the skill path (no welcome/onboarding) know what to do? — informs Now #9
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
progress only, versioned envelope, REPLACE not merge — the shape behind Now #3)**.

Note: the 2026-08-18 corrections above (Now #6, the composer Done blocks, DOCMAP's
spec-practice-composer.md row) are status corrections, not new decisions — nothing
was added to `DECISIONS.md` for them.
