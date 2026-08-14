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
  **Finding that forced this.** The DPDP Rules 2025 were notified 13 Nov 2025 (G.S.R. 846(E)); the
  children's-data obligations bind from 13 May 2027. **Rule 10** requires the person identifying as the
  parent to be checked as an *identifiable adult* by reference to (a) identity/age details already held by
  the Data Fiduciary, or (b) identity/age details voluntarily provided by the individual or through a
  **virtual token mapped to such details, issued by an authorised entity** (including via a Digital Locker
  service provider). Rule 10's own **Illustrations Case 2 and Case 4** — where the parent is NOT already a
  registered user, which is exactly our situation — direct the fiduciary to the government-issued-details /
  token route. **OTP-to-mobile and Google sign-in are NOT on that menu:** OTP proves control of a phone
  number, not identity or age; Google holds the identity details, we do not, and Google is not an
  "authorised entity". **Schedule IV Part A's *educational institution* exemption is NOT available to us** —
  we are an app, not an institution of learning, and its conditions are drafted around *children enrolled
  with such institution*. (Schedule IV **Part B(5)** *does* permit the processing needed to run the Rule 10
  due diligence itself — the bootstrap — if we ever build that path.)
  **Decision.** Rather than build a DigiLocker/token VPC rail as a solo foreign operator on an unvalidated
  product, the MVP **never processes child personal data at all**, so s.9 and Rule 10 never trigger.
  **In scope:** device-local progress only; no accounts; no cloud; no sync; no analytics; no telemetry;
  no ads; no outbound messaging; **no payment of any kind**.
  **Out of scope for MVP (deferred, NOT cancelled):** T109 auth rebuild, anonymous→Google linking,
  Firestore, cloud sync, parent accounts, paywall, subscriptions.
  **Supersedes for MVP only:** the *Auth & accounts* and *Monetization* sections above, and the
  Firestore/anonymous-auth half of the migration strategy. All remain the intended post-validation design.
  **Positioning is UNCHANGED.** We remain a CBSE/NCERT-aligned maths app. Rebranding as a "game" was
  considered and **rejected**: DPDP applies to processing personal data of a child regardless of what the
  app is called, so the relabel buys nothing legally, discards our main differentiator with Indian parents,
  and risks volunteering into the *online gaming intermediary* category.
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
  **Revisit trigger:** real retention signal, or unprompted willingness to pay. At that point engage the
  DPDP lawyer and the CA, and choose between the token-VPC path (full Layer 2) and a
  paid-unlock-without-accounts path.
  **Verification caveat:** the Rule 10 / Schedule IV reading above is taken from published reproductions of
  the notified text, **not yet checked against the Gazette itself**. It is load-bearing for this decision and
  must be confirmed against G.S.R. 846(E) before any Layer 2 build.
