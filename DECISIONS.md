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

## Learning engine

- **Recipes, not stored questions.** Logic generates questions. See `RECIPE_TEMPLATE.md` for the contract.
- **Difficulty capped at curriculum ceiling per skill** (3 rungs: easy/medium/hard). Beyond the ceiling = a different skill.
- **Mastery = ~80% at hard level across multiple days**, then spaced-repetition review (intervals ~1/2/4/7/21 days). Stop drilling once mastered; move to next skill.
- **Distractors encode misconceptions** (e.g. forgot-carry) to drive targeted hints + dashboard insight.
- **Remediation ladder, never punish:** wrong#1 = targeted hint; wrong#2 = visual walkthrough + retry easier; wrong#3 = park skill, give a guaranteed-win question (mood floor — a session never ends on failure). Tinku is never disappointed, always "let's try together."
- **`misconceptions-reference.md` is the canonical source of truth for misconception tags.** Every recipe's `misconceptions[]` tags and every remediation hint must match it exactly (kebab-case). When the doc and a recipe disagree, the doc wins — reconcile the recipe to the doc, and verify the distractor RULE matches the tag's documented rule (don't just rename the label). New recipes draw their tags + rules from this doc. The doc still requires a one-time primary-math teacher review of its ~68 rows before launch; tag changes from that review are a contained follow-up.

## Auth & accounts

- **Anonymous-first.** `signInAnonymously()` on first launch; every guest is a real UID; all progress saved to it.
- **Play-first, login at value moments** (save streak, parent dashboard, purchase, add sibling, device switch). NEVER a login wall at app open.
- **Account linking** anonymous→Google via `linkWithCredential` — ZERO progress loss. Never create a second account; never lose streak/pet.
- **Login is parent-framed** ("Parents: sign in to save progress & view reports") — supports DPDP parental consent. The parent creates the account.

## Monetization

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

---

## Change log (append new decisions here with date)

- _(seed)_ Initial decisions captured from planning sessions.
- Migration strategy added after the code-vs-docs audit: existing app = UI prototype; rebuild core on recipe engine + Firestore + anonymous auth via strangler-fig with feature flags; keep good screens; legacy frozen then deleted.
- `misconceptions-reference.md` established as the canonical source for misconception tags + rules; reference recipes reconcile to it (doc wins); pending one-time teacher review of the ~68 rows.
