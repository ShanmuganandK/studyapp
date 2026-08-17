# DECISIONS.md — Locked Decisions Log

> Single source of truth for product/design/technical decisions already made.
> Both Claude Code and Antigravity must follow these. If a task contradicts a decision here, ask the human.
> When a NEW decision is made, add a dated line here (newest at bottom of each section).

---

## Product scope

- **Launch scope = Grades 1–3 CBSE math only** (the "Wonder" band). Grades 4–5 ("Explorer" band) is Phase 2.
- **One app, not multiple.** Grade bands are themes/content inside one app, selected per child profile. Siblings supported under one account.
- **Freemium.** Generous free tier; premium unlocks unlimited practice + detailed parent reports + offline + themes. Free tier must stay genuinely good.
- **Success metric until Month 6 = D7 retention, not revenue.**
- Scope is FROZEN for MVP. New ideas go to the "Parked Ideas" list, not the build.

## Mascot

- **Tinku — flat 2D blue-grey elephant with a glowing math star.** This is the ONLY mascot.
- 6 emotion poses exist and are production-ready: happy, celebrate, encourage, thinking, sleeping, waving.
- The purple **robot** from Stitch mockups is **NOT used** anywhere. (Robots are generic; Tinku is the differentiation and is already consistent.)
- The **lavender 3D claymorphism** Tinku version is **parked for Phase 2** (art upgrade), not used at launch. If ever adopted, must re-add the math star and lock the reference sheet.
- Pose-to-moment mapping: header=happy(head crop), solving=thinking, correct=celebrate, wrong=encourage, daily-limit=sleeping, session-end=celebrate, login=waving/happy, paywall hero=celebrate.

## Theme / visual

- **Wonder band (G1–3) = bright/light theme.** Friendly for ages 5–8.
- **Explorer band (G4–5, Phase 2) = darker/cooler theme.** The Stitch dark mockups are the Explorer reference.
- Implement via Tailwind theme tokens (CSS variables): `theme-wonder`, `theme-explorer`. No hardcoded colors in components.
- **Typography (locked in the UI overhaul, 2026-07-04):** kid-facing display = **Baloo 2** (chunky, round, playful — big numbers/equations, answer tiles, titles); body & parent text = **Nunito** (friendly rounded, readable). Self-hosted via Fontsource (bundled woff2, `font-display: swap`, Latin subset ~72 kB) — no CDN, low-end-Android safe. Exposed as tokens `font-display` / `font-body`; `font-sans` defaults to Nunito. *(Known follow-up: the SW precache glob omits `woff2`, so fonts fall back to system fonts offline — add a font `CacheFirst` runtime rule later.)*

## Learning engine

- **Recipes, not stored questions.** Logic generates questions. See `RECIPE_TEMPLATE.md` for the contract.
- **Difficulty capped at curriculum ceiling per skill** (3 rungs: easy/medium/hard). Beyond the ceiling = a different skill.
- **Mastery = ~80% at hard level across multiple days**, then spaced-repetition review (intervals ~1/2/4/7/21 days). Stop drilling once mastered; move to next skill.
- **Distractors encode misconceptions** (e.g. forgot-carry) to drive targeted hints + dashboard insight.
- **Remediation ladder, never punish:** wrong#1 = targeted hint; wrong#2 = visual walkthrough + retry easier; wrong#3 = park skill, give a guaranteed-win question (mood floor — a session never ends on failure). Tinku is never disappointed, always "let's try together."
- **`misconceptions-reference.md` is the canonical source of truth for misconception tags.** Every recipe's `misconceptions[]` tags and every remediation hint must match it exactly (kebab-case). When the doc and a recipe disagree, the doc wins — reconcile the recipe to the doc, and verify the distractor RULE matches the tag's documented rule (don't just rename the label). New recipes draw their tags + rules from this doc. The doc still requires a one-time primary-math teacher review of its ~68 rows before launch; tag changes from that review are a contained follow-up.

## Auth & accounts

> **DEFERRED FOR MVP — see the 2026-08-14 entry in the change log.** MVP ships with no
> accounts, no anonymous UID, no Firestore. The bullets below remain the intended design for the
> post-validation tier; none of them are built now.

- **Anonymous-first.** `signInAnonymously()` on first launch; every guest is a real UID; all progress saved to it.
- **Play-first, login at value moments** (save streak, parent dashboard, purchase, add sibling, device switch). NEVER a login wall at app open.
- **Account linking** anonymous→Google via `linkWithCredential` — ZERO progress loss. Never create a second account; never lose streak/pet.
- **Login is parent-framed** ("Parents: sign in to save progress & view reports") — supports DPDP parental consent. The parent creates the account.

## Monetization

> **DEFERRED FOR MVP — see the 2026-08-14 entry in the change log.** MVP takes no money at all.
> When monetisation returns it is Google Play Billing only (most likely a one-time paid unlock),
> never direct/informal payment. The bullets below describe the post-validation subscription tier.

- **Google Play Billing** as the payment route (Google handles UPI + Indian GST for foreign/UAE developer). No direct web billing until ~₹3–5L/month (avoids OIDAR GST burden).
- **Pricing in ₹** set per-country manually (e.g. ₹99–149/mo, ₹499–999/yr). NOT $ — the Stitch paywall's $4.99/$49.99 is wrong for India.
- **No fake social proof.** "10,000+ happy parents" etc. must not ship until true.
- Paywall anchors to tuition cost ("less than one tuition class/month"), highlights sibling/family value, fires upgrade prompts only AFTER delivered results (~2 weeks), never day one. No paywall interrupts a child mid-activity.

## Platform / packaging

- **Android first** (PWA + Capacitor wrap). **PWA/web shipped immediately** (Netlify) for sharing + kid-testing.
- **iOS later** (~Month 6, Capacitor makes it cheap).
- Individual Play Console account under UAE identity; payouts to UAE bank.

## Tooling workflow

- **Stitch** = layout/design exploration → **Antigravity** translates layouts to React UI (applying locked decisions). **Claude Code** = engine/data/money/auth.
- Stitch MCP exists but mockups are references, not verbatim imports.
- One repo on the Windows laptop; both AIs work the same cloned folder; human reviews every diff; one branch per task.

---

## Migration strategy (existing app → new core)

**Context:** an audit (after the recipe foundation was built) found the repo is split-brain: a clean new recipe engine (`src/recipes/`, unwired) plus the existing Antigravity app (the running app), which predates these decisions and contradicts several on load-bearing points — auth is Google-popup-first (not anonymous-first), all state is in localStorage (forbidden), mastery is "3-in-a-row keyed to question slots" (not the spec'd spaced-rep), questions come from `Math.random()` generators + stored banks (violates the recipe rule), and the Wonder band uses a dark theme with child-selected grade + out-of-scope Grade 4.

**Decision:** the existing Antigravity app is treated as a **validated UI prototype**, not the production foundation. We **keep the good screens** (Adventure Map, Passport, quiz layout, visual modules) and **rebuild the core** (auth, storage, mastery, question generation, theming, profile/grade model) on the new architecture (recipe engine + Firestore + anonymous-first auth). Rationale: the contradictions are all in the interlocked foundation, so incremental patching would be a tangled rewrite anyway — and most of that core is unbuilt regardless, so "rebuild core" is mostly "build the planned core and don't wire the legacy versions back in."

**Execution — "build forward, retire backward" (strangler-fig):**
- **One branch line (`master`) stays working at all times.** No long-lived "old vs new" parallel branches. Short task branches only (one per piece of work), merged frequently.
- **New core grows in NEW folders:** `src/services/` (auth, firestore, billing), `src/engine/` (mastery, composer, remediation), `src/hooks/` (React orchestration). The recipe engine (`src/recipes/`) is already here.
- **Legacy is FROZEN:** `src/utils/generators/`, `src/data/questions*`, `masteryEngine.js`, the localStorage state, the popup-only auth — these are never modified. They run as-is until their replacement is proven, then deleted.
- **Rule:** new code never imports legacy; legacy is never edited. Screens (`src/components/`) are the only bridge and migrate one at a time.
- **Feature flags** (`src/config/flags.js`: `useRecipeEngine`, `useFirestore`, `useNewMastery`, … all default `false`) switch each screen between legacy and new paths. Flip locally to test new; flip off for instant rollback. A legacy path is deleted only after its flag has run `true` confidently.
- **Cheap contradictions fixed early** (low-risk, high-visibility): light theme for Wonder band; grade is a parent-selected profile property (no child grade-wall, no Grade 4, Grade 3 stays in the Wonder experience).

**End state:** the split-brain ends not by patching the old core but by growing the new one until the old is unused, then removing it. Legacy `utils/generators`, `data/questions`, `masteryEngine.js`, localStorage state, and popup-first auth are retired post-migration.

> **Note (2026-08-14):** the Firestore/anonymous-auth half of this migration is **deferred, not
> cancelled** — see the 2026-08-14 change-log entry. The recipe-engine, mastery, theming and
> profile-model halves proceed unchanged. `progressStore` remains the local persistence
> swap-point and stays local for MVP.

---

## Change log (append new decisions here with date)

- _(seed)_ Initial decisions captured from planning sessions.
- Migration strategy added after the code-vs-docs audit: existing app = UI prototype; rebuild core on recipe engine + Firestore + anonymous auth via strangler-fig with feature flags; keep good screens; legacy frozen then deleted.
- `misconceptions-reference.md` established as the canonical source for misconception tags + rules; reference recipes reconcile to it (doc wins); pending one-time teacher review of the ~68 rows.
- Skill cards use `displayName` (kid-friendly title), `subtitle` (curriculum tag, small/muted), and `icon` (emoji) stored in `skillMap.js` — data-driven, not hardcoded in the screen. Star emoji (⭐) is reserved exclusively for rewards/mastery; skill icons must not use it.
- (2026-07-04) **UI overhaul — Screen 1 (quiz)** established the Wonder **design-token system** (colour/type/space/radius/shadow as CSS custom properties on `:root`, exposed via Tailwind; Explorer will override the same properties under `.theme-explorer`) and the first shared primitive **`<KidButton>`**. Structural map in `ARCHITECTURE.md`; visual language in `ui-overhaul-design-direction.md`. **Locked feedback-colour meanings:** amber/stars = reward/achievement ONLY; correct answer = **success green**; wrong answer = **soft coral** ("encourage" — never red, never amber); hints/learning = **sky**. Component-render tests (RTL + jsdom) added to the stack (per-file `// @vitest-environment jsdom`).
- (2026-07-04) **Answer feedback fills the blank (LOCKED):** for any format that renders a blank (`compare` now; `text-input` + future blank-bearing formats later), a CORRECT answer lands the committed correct value into the blank as part of the correct-beat, so the child sees the full statement complete before transition. The **wrong-#2 reveal** ("here's how — let's see it together") ALSO fills the blank with the **correct** value — but in the **learning (sky) tone**, not the celebratory green — so the taught statement completes as a teaching beat, not false praise. Formats without a blank (`mcq`, `count-objects`) keep option-pop feedback — no fill. Presentation-only, view-state only; never plumb new data from the hook/recipe for a visual beat. Resting/wrong/hint states show the dashed placeholder; the blank **never shows a wrong value** (fill is always the correct one).
- (2026-07-05) **Review-due gets its own semantic token, distinct from amber (LOCKED):**
  amber/gold remains reward/achievement-**ONLY**. Review-due ("come back to this") is a gentle
  spaced-rep reminder, not a reward, so it must **not** reuse amber — sharing the channel blurs the
  one colour reserved for celebration. A dedicated token **`color.review` / `--color-review`** (a
  calm **teal**, `#14b8a6`) carries review-due UI: the skill-card **border** and the **↻ glyph**.
  It is deliberately kept distinct from the sky `learn` "Tinku suggests" family so *suggest* vs
  *review* read as different states on the same card list. The **"Review time!" label text** uses a
  readable **ink** token (never light-on-light; the teal is only on border/glyph). This is the one
  sanctioned addition to the Screen-1 token set — justified because it **protects** the locked amber
  meaning, not because the palette is expanding casually. **Any future "needs attention / revisit"
  state inherits `color.review`, never amber.** (Introduced with UI overhaul Screen 3 — home /
  skill-select; `SkillCard` consumes `border-review` / `text-review`.)
- (2026-07-12) **Mute is session-scoped by design; sound defaults ON each app start** (kids' app, restart-heavy usage). The `muted` flag is module-scoped (not persisted), so it resets to ON on full reload/restart — this is intentional, NOT a bug. (Flagged by the 2026-07-12 feel-layer audit precisely because it reads like one; locked here so future audits don't re-flag it.)
- (2026-07-14) **Parent gate is a Families-Policy deterrent, not a security boundary.** Recovery = an adult-skill challenge (runtime-generated two-digit × one-digit arithmetic, never stored), which resets the code and **never touches child progress**. Remove/change passcode lives inside the parent zone. The gate renders as a portal to `document.body` (true viewport overlay, independent of scroll/ancestor transform). Wrong challenge answer = gentle shake + retry, **no lockout counters** (deterrent, not security).
- (2026-07-15) **Skill-state grammar:** one call-to-action (suggested node); due-but-not-suggested shows muted teal cue on neutral ring, never amber; mastered shows amber only when not due; both home views share one mapping. (Fixes the amber-while-due violation of the 2026-07-05 rule; the shared source is `src/components/skillStateVisual.jsx` — `getSkillVisual` + `SkillStateCue` — consumed by both `SkillCard` and `SkillPathScreen`. The ↻ cue lives in the label; pips are level-only.)
- (2026-07-16) **MVP ships with NO analytics whatsoever** (no Firebase Analytics SDK in the build, no telemetry, guest or otherwise). Wrapper (T91) reduced to inert no-op seam; call-sites preserved. Analytics returns only post-traction, and only behind verified parental consent per DECISIONS entry on consent stack. Launch insight = observation, reviews, WhatsApp feedback, Play Console vitals.
- (2026-08-14) **MVP is device-local, processes no child personal data, and takes no money (LOCKED).**

  **Source basis (verified 2026-08-14).** DPDP Rules 2025, notified **13 Nov 2025 as G.S.R. 846(E)**
  (draft was G.S.R. 02(E) of 3 Jan 2025). Read against **three independent reproductions**:
  `dpdpa.com` (rule pages), `dpdpa.in` (rule pages + per-rule commencement index), and
  **Spice Route Legal**, which reproduces the full notification — preamble through Seventh Schedule.
  ⚠️ Reproduction quality varies: `dpdpa.in` **omits Rule 10's Illustrations**; `dpdpa.com` **drops one
  Fourth-Schedule Part B entry** and mis-cites the Fourth Schedule as *"[See rule 11]"*. The SRL
  full text is treated as the reference; **anything below citing a rule or schedule number follows SRL.**

  **Commencement (Rule 1(2)–(4)).** Rules 1, 2 and 17–21 on publication; Rule 4 at one year
  (13 Nov 2026); **Rules 3, 5–16, 22 and 23 at eighteen months (13 May 2027)** — Rule 10 is in that
  third bucket.

  **Finding that forced this decision.** **Rule 10** requires the person identifying as the parent to be
  checked as an *identifiable adult* by reference to (a) reliable identity/age details **already held by the
  Data Fiduciary**, or (b) identity/age details voluntarily provided by the individual or **through a virtual
  token mapped to such details, issued by an authorised entity** (10(2)(b) — an entity entrusted by law or
  by Government with issuing such details, including details or a token made available and verified by a
  Digital Locker Service Provider). Rule 10 ships with four **Illustrations**; **Cases 2 and 4** — where the
  parent is *not* an existing registered user, which is exactly our situation — direct the fiduciary to the
  government-issued-details / token route. **OTP-to-mobile and Google sign-in are NOT on that menu:**
  OTP proves control of a phone number, not identity or age; Google holds the identity details, we do not,
  and Google is not an "authorised entity". Note also 10(2)(c): a Digital Locker service provider is one
  **"as may be notified"** by the Central Government — the designated set may not yet be settled.

  **Fourth Schedule (`[See rule 12]`) checked.** **Part A(3)**'s *educational institution* exemption is
  **NOT available to us** — we are an app, not "an institution of learning that imparts education", and the
  condition is drafted around *children enrolled with such institution*. **Part B(6)** *does* permit the
  processing needed for confirmation that a Data Principal is not a child and for **observance of due
  diligence under rule 10** — the bootstrap that makes a verification flow lawful, if we ever build one.

  **Decision.** Rather than build a DigiLocker/token VPC rail as a solo foreign operator on an unvalidated
  product, the MVP **never processes child personal data at all**, so s.9 and Rule 10 never trigger.
  **In scope:** device-local progress only; no accounts; no cloud; no sync; no analytics; no telemetry;
  no ads; no outbound messaging; **no payment of any kind**.
  **Out of scope for MVP (deferred, NOT cancelled):** T109 auth rebuild, anonymous→Google linking,
  Firestore, cloud sync, parent accounts, paywall, subscriptions.
  **Supersedes for MVP only:** the *Auth & accounts* and *Monetization* sections above, and the
  Firestore/anonymous-auth half of the migration strategy. All remain the intended post-validation design.

  **Positioning is UNCHANGED.** We remain a CBSE/NCERT-aligned maths app. Rebranding as a "game" was
  considered and **rejected**: DPDP turns on *processing personal data of a child*, not on what the app is
  called, so the relabel buys nothing legally, discards our main differentiator with Indian parents, and
  risks volunteering into the *online gaming intermediary* category (a defined class in the Third Schedule).

  **When money returns, it is Google Play Billing only** — most likely a one-time paid unlock, never a
  subscription-with-account, and **never** direct or informal payment. Direct payment would breach Play's
  payments policy (app-removal risk) and would likely make us an OIDAR supplier needing Indian GST
  registration, which Play Billing otherwise absorbs as merchant of record.

  **Data loss is solved in code, not in a disclaimer:** parent-zone **export/import** of progress as a local
  JSON file. Zero server, zero account, zero personal data — this replaces cloud backup for MVP.

  **Residual MVP obligations (not zero):** Play requires a privacy policy for every app; the Play Console
  **Data Safety** form must be accurate; **Designed-for-Families** programme rules apply (we target
  under-13s); Play Console surfaces crash/install data to us automatically. The notice therefore reads
  *no sign-up, no accounts, progress stays on this device, no ads, no analytics, no tracking* **plus** one
  line acknowledging standard store/hosting technical data — **not** the absolute claim "we collect no
  personal data."

  > **AMENDED 2026-08-15 — the app-side claim is now verified, and may be stated flatly.**
  > When the paragraph above was written, the app-side wording was hedged because nothing had yet
  > proven what the shipping build actually did. The **network audit of 2026-08-15 closed that**, and it
  > found the hedge was justified: the bundle was initializing **Firebase Auth on every app start**
  > (`lib/firebase.js` running `initializeApp()`/`getAuth()` at module scope, behind a static import chain
  > that the `isFirebaseConfigured` check could not stop), so devices with a persisted legacy Google
  > session were refreshing tokens to Google at launch.
  >
  > That is **fixed**: the `firebase` dependency, `lib/firebase.js` and `firebaseAdapter.js` are gone, and
  > the auth seam is an inert null-user adapter. Verified three ways — no source file imports firebase;
  > **zero** Google identity endpoints anywhere in `dist/`; and, loaded in a real browser, the built app
  > issues **12 requests, all same-origin, zero off-origin**. A standing guard test
  > (`services/__tests__/noFirebaseAuth.test.js`) now asserts all three, so this cannot silently regress.
  >
  > **Net effect on wording.** The app-side half no longer needs hedging and should be stated plainly:
  > **no accounts, no auth SDK, no analytics SDK, and no network calls originating from the app at all.**
  > **The store/hosting line STAYS** — Play Console vitals and Netlify request logs are real, are outside
  > our control, and are not covered by the app-side claim. The absolute "we collect no personal data"
  > claim remains **rejected**, for that same reason.
  >
  > *(Caveat on the guard, resolved 2026-08-15: a guard only binds if something runs it. When this
  > amendment was first written `npm run lint` failed and no CI workflow was committed, so the guard
  > was a local check only. **`.github/workflows/ci.yml` now runs lint + the raw-hex guard + the full
  > test suite + build on every push and PR**, and re-runs the bundle assertion after the build so it
  > inspects a real `dist/`. The workflow was verified to actually go red on an injected violation,
  > not assumed green.)*

  **Constraints that bind the day Layer 2 returns** (recorded now so the deferred design starts correct):
  - **Rule 8(3) — one-year retention FLOOR.** Personal data, associated traffic data and processing logs
    must be retained **a minimum of one year** from the date of processing. This cuts against
    delete-everything-on-withdrawal instincts; withdrawal design must reconcile with it.
  - **Rule 6(1)(e)** — security logs likewise retained one year.
  - **Rule 14(3)** — grievance response period **not exceeding ninety days**, published on site/app.
  - **Rule 9** — must publish business contact info for the DPO or a person able to answer processing
    questions. **No India-residency requirement appears in the rule text.**
  - **Rule 7** — breach: intimate affected Data Principals without delay; intimate the Board without delay
    with a description, then a detailed report **within seventy-two hours**.
  - **First Schedule Part A** — a Consent Manager must be a company **incorporated in India** with net
    worth **not less than ₹2 crore**; that route is closed to us as an operator (using one is a separate
    question).
  - **Third Schedule** three-year erasure binds only e-commerce ≥2 crore, online gaming ≥50 lakh, and
    social media ≥2 crore registered users — not us.

  **Revisit trigger:** real retention signal, or unprompted willingness to pay. At that point engage the
  DPDP lawyer and the CA, and choose between the token-VPC path (full Layer 2) and a
  paid-unlock-without-accounts path.

  **Residual verification note:** the above is confirmed across three reproductions including a law-firm
  full text, but **not against the Gazette PDF itself**. That is sufficient for this decision (which is safe
  under any reading) and should be closed before any Layer 2 build. Open interpretive question for
  counsel: the Rule 10(1) qualifier *"identifiable **if required in connection with compliance with any law
  for the time being in force in India**"* — whether it narrows the identifiability duty.

- (2026-08-15) **No auth SDK ships in the MVP build (LOCKED).** The `firebase` dependency,
  `src/lib/firebase.js` and `src/services/firebaseAdapter.js` are removed; the auth seam
  (`services/authService.js` → `localAdapter`) is an **inert null-user adapter** that never fabricates
  a user. `AuthProvider` stays in the React tree because it still owns the parent passcode and profile
  state — only the adapter beneath it changed, so no call-site moved. This is the same seam pattern as
  the analytics no-op (2026-07-16): when accounts return post-validation, **only the adapter changes**.
  Prompted by the 2026-08-15 network audit, which found Firebase Auth initializing at every app start
  (details + verification in the amendment to the 2026-08-14 entry above). Bundle dropped 317.6 kB →
  201.1 kB as a side effect. **Standing guard:** `services/__tests__/noFirebaseAuth.test.js` asserts the
  seam is null-user, that no source imports firebase, that the deleted modules stay deleted, that
  `firebase` is not a dependency, and that no built `dist/` artefact contains a Google identity endpoint.
  **Do not reintroduce an auth SDK for convenience** — the no-network claim is now published in the
  privacy notice, not just an internal preference.

- (2026-08-15) **Privacy policy published: one source, two surfaces; Data Safety answered "No collection" (LOCKED).**
  The policy text is now committed as **data** in `src/config/privacyPolicy.js`, and both required
  surfaces render from it: the **public page** `public/privacy.html` (generated by
  `scripts/build-privacy-page.mjs`, linked from the Play listing) and the **in-app copy**
  (`components/PrivacyPolicy.jsx`, parent zone → "Read the full privacy policy", for
  Designed-for-Families). **Two hand-maintained copies of a legal text are forbidden** — the drifting
  copy is always the one nobody opens. `config/__tests__/privacyPolicy.test.js` fails CI on drift.

  **Wording, as shipped.** Follows the approved draft, with the app-side claim stated flatly per the
  2026-08-14 amendment (no sign-up, no accounts, progress on-device only, no advertising/analytics/
  tracking) and the **store/hosting technical-information section kept**. Two deliberate departures
  from the draft, both to keep the text true today:
  - **"Short version: we don't collect anything" → "Short version: the app collects nothing about you
    or your child."** The original is an absolute claim of the class DECISIONS 2026-08-14 rejects, and
    it is contradicted two sections later by the technical-information line. The shipped wording keeps
    the punch and draws the exact distinction the 2026-08-15 amendment draws: **the app** collects
    nothing (measured — zero off-origin requests); the delivery services log what delivery services log.
  - **The sentence "You can save a backup copy from the Parent Zone at any time" is OMITTED**, because
    progress export/import (TRACKER "Now" #3) **has not shipped**. A privacy policy may not describe a
    feature that does not exist. It is restored — with the assertion in the guard test deleted in the
    same commit — the day export lands, and not before.

  **Play Data Safety answer is "No" to data collection or sharing** (`claude-chat/play-data-safety-form.md`
  holds the verbatim wizard answers and the factual basis). **The form and the policy answer different
  questions and must both stay as written:** the form asks what *the app* collects (nothing — no SDK, no
  network call); the policy additionally discloses that Play Console vitals and Netlify request logs
  exist, because a parent deserves the whole picture. **Do not "reconcile" them** by adding a data type
  to the form or by deleting the technical-information section from the policy.

  **The Data Safety declaration is a claim about the BUILD, not an intention.** If any future build adds
  a network call, an SDK, or an account, the form must be re-answered *before* that build ships — Play
  treats an inaccurate declaration as a policy violation in its own right.

  **`/privacy.html` is a real page, not an SPA route.** `vite.config.js` carries
  `navigateFallbackDenylist: [/^\/privacy\.html$/]`; without it the service worker's navigation
  fallback serves the app shell to anyone opening the policy link on a device with the PWA installed —
  i.e. exactly the Play reviewer we need it to work for.

- (2026-08-16) **`PRODUCT_NAME` is "Tinku Math", derived not repeated; Play title is brand-first (LOCKED).**
  Five surfaces held five literals and had drifted: PWA manifest `CBSE Math Kids`, launcher
  `Math Kids`, page title `CBSE Math Kids App`, `package.json` `cbse-math-kids-app`, privacy policy
  `Tinku Math`. **A privacy policy naming a different app than the store listing is a Play review
  flag**, so this stopped being cosmetic the moment the policy was published.

  **The name now lives once**, in `src/config/brand.js`, and every live surface DERIVES from it:
  `vite.config.js` takes the manifest `name`/`short_name`/`description` from it and substitutes
  `%PRODUCT_NAME%` into the `index.html` `<title>` via a `transformIndexHtml` hook;
  `config/privacyPolicy.js` re-exports it as `APP_NAME`. Derivation beats detection — these cannot
  drift by construction. `config/__tests__/brand.test.js` covers what can only be checked
  (`package.json`, `README.md`) and sweeps every live surface for the retired names.

  **`SHORT_NAME` = "Tinku Math"** (10 chars, under Android's ~12-char launcher limit — no
  abbreviation needed). If the name ever grows, pick a real short form rather than letting the
  launcher truncate blindly; the guard asserts the limit.

  **Play listing title = `Tinku Math: Maths for Kids`** (26/30). **It deliberately lives NOWHERE in
  the codebase** — it is ASO copy entered by hand in Play Console and changes on its own schedule,
  whereas `PRODUCT_NAME` is the app's identity. Recorded here and in the TRACKER pre-launch
  checklist only.

  **Rule locked with it: brand first, keyword second.** "CBSE" must NOT appear in the NAME — CBSE is
  a statutory board and a name implying affiliation or endorsement risks Play's impersonation
  policy. Describing the app as CBSE-**aligned** in the DESCRIPTION is an ordinary descriptive claim
  and is retained. The guard asserts both halves: no CBSE in `PRODUCT_NAME`/`SHORT_NAME`, CBSE
  present in `DESCRIPTION`.

  **Scope note:** dead `Login.jsx` was renamed too (it is unrendered, but a guard with a hole in it
  invites the string back). `documents/*.md` were left alone — historical planning records;
  rewriting them would falsify what was true when written. The guard's exclusion list is explicit
  and commented, never a silent skip (same principle as `scripts/frozen-legacy.mjs`).

- (2026-08-16) **The privacy policy publishes no legal conclusions, and no age band (LOCKED).**
  The `children` section previously read *"Because we process no personal data about children, no
  parental consent is required for the app to work."* The first clause is a **measured fact** about
  the build. The second is a **legal conclusion** on a question **no lawyer has answered for us** —
  it is open in `questionnaire-lawyer-dpdp.md` Section B and that consult is deferred (DECISIONS
  2026-08-14). In a children's-app policy that is a misrepresentation risk if it is wrong, and it
  buys nothing: the factual claim already does all the reassurance work.

  Now reads: *"Tinku Math is designed for children and their parents. We do not collect any personal
  data about your child, so there is nothing for us to store, share, or sell."*

  **Guarded.** `config/__tests__/privacyPolicy.test.js` fails on "no parental consent is required"
  and its obvious paraphrases. **It may only return alongside a DECISIONS entry recording a HUMAN
  legal opinion that says so. Deleting the assertion is not that entry.** This is the same standing
  pattern as the unshipped-export guard.

  **The age range is gone entirely.** It read "aged roughly 5–9", which matched nothing: the repo's
  own claims already disagreed (DECISIONS said 5–8, the composer spec 5–7), Play's target-age
  buckets are fixed and are declared in Console, and no band has been declared yet. A second copy in
  the policy could only drift out of step with the Console declaration, so **the band lives in Play
  Console only**. Grades 1–3 maps to Play's "Ages 6–8" bucket when that declaration is made.

  **`OPERATOR_LINE` is deliberately still blank.** The policy says "we" throughout and names nobody,
  which is a transparency gap Play and DPDP both expect closed — but the operator name must match
  the Play developer name, and that (own name vs. trade name) is an open pre-launch decision.
  `privacyPolicy.js` carries a `TODO(operator)` and the guard asserts **both directions**: while
  blank, the policy must name no operator AND the TODO must survive, so the reminder cannot be
  quietly deleted; once set, the line must appear on both published surfaces. **This must be closed
  before submission.**

- (2026-08-17) **Progress export/import: one file, progress only, REPLACE not merge (LOCKED).**
  DECISIONS 2026-08-14 settled that data loss is solved in code rather than in a disclaimer, and
  named parent-zone export/import as the answer. This entry fixes that feature's **shape** before it
  is built, so the load-bearing choices are made deliberately instead of at the keyboard.
  **This is a decision, not a status claim** — `claude-chat/TRACKER.md` records what is actually built.

  **What travels: the `tinku:v1:skills` payload, and nothing else.** The parent passcode
  (`math_kids_settings_anon`) is **not** progress and must never enter the file. It is a
  Families-Policy deterrent (2026-07-14), and a backup a parent is encouraged to email themselves or
  drop into cloud storage must not double as a credential file — that would buy nothing and add a
  category of risk this MVP otherwise does not have. Nothing else in `localStorage` travels.

  **The file carries behaviour only, and must stay that way.** Skill states are keyed by `skillId`
  and hold levels, dates, counts and misconception tags — the same property that keeps
  `progressStore` clear of DPDP s.9. **Guarded**, so a later change cannot quietly widen the
  envelope: the exported shape is asserted against an allowlist, not merely reviewed once.

  **The envelope is versioned and refusable.** A backup opened by a future build must be either
  understood or rejected with a clear message — never *partially* understood. Version 1 is the
  current shape.

  **Import REPLACES; it does not merge.** Reconciling two histories per skill — `level`, `lastSeen`,
  `nextReview`, `reviewInterval`, misconception counts — is silent-wrong-state territory, and a
  wrong merge is invisible to a parent: it surfaces weeks later as a spaced-repetition schedule
  nobody can explain. This feature's entire value is trust, so it does the predictable thing and
  says so, behind a two-step confirm stating plainly that progress on this device will be replaced.
  **Validate fully, then write once** — a half-applied import is the one outcome worse than a refused
  one. Unknown `skillId`s are ignored and counted, never fatal: the skill map grows, and an old
  backup must stay restorable.

  **Delivery is web-standard** (`Blob` + `<a download>`, `<input type="file">`), because the PWA is
  the delivery vehicle today. **The Capacitor wrap is a known gap, deliberately not built for** —
  recorded in `ARCHITECTURE.md` and revisited when the Play build is real, rather than pre-solved
  against a wrapper that does not yet exist.

  **Policy coupling.** The sentence *"You can save a backup copy from the Parent Zone at any time"*
  was omitted on 2026-08-15 because the feature did not exist. It returns in the **same commit** that
  ships export — and the guard that forbade it is **flipped to assert the opposite, not deleted**. A
  deleted guard is a hole; the both-directions pattern already used for `OPERATOR_LINE` is the
  standing form. `public/privacy.html` is regenerated in that same commit, or `privacy:check` goes
  red on byte identity.
