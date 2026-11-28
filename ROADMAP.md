# ROADMAP.md — Future Product, Curriculum & Design Direction

> **Scope (Single Source of Truth):** Future product features, open closed-test UX follow-ups, design-system proposals, open primary-math teacher pedagogy sign-offs, testing framework evolution, and deferred post-launch scope.
> - Detailed post-L9 future improvements (product differentiation, UI/UX upgrades, brand positioning, organic audience growth, ethical IAP strategy, and pre-2027 child age-signal compliance planning) are documented in [`IMPROVEMENT_PLAN.md`](IMPROVEMENT_PLAN.md).
> - Live release status & closed-test ops live in [`CURRENT_STATE.md`](CURRENT_STATE.md).
> - Code-level defects, stale flags, boundary breaches, lint warnings, and automated test gaps live in [`TECH_DEBT.md`](TECH_DEBT.md).
> - App-level testing (smoke test in use; CI, deploy-gate, Android and performance testing plans held until agreed) lives in [`TESTING_PLAN.md`](TESTING_PLAN.md).

---

## 1. Closed-Test UX Follow-Ups (Pending Prioritisation)

Measured via Playwright at `360×640` and `412×915` CSS px (not yet verified on real devices; Android target guideline is `48 dp`, whereas `layout:check` currently enforces `>= 44 px` on answer tiles only):

| ID | Area | Priority | Detail |
|---|---|---|---|
| `F1` | Child-facing controls under `48 dp` | Done (`2026-11-21`) | Expanded `"← Skills"`, `MuteButton`, `"Listen to hint"` (hidden via `hasHintVoice()` until voice clips are bundled), and Celebration buttons to `>= 48×48` hit boxes without shifting layout (`SessionPlayer.jsx`, `HintBubble.jsx`, `CelebrationScreen.jsx`), and asserted in `scripts/check-quiz-layout.mjs`. |
| `F2` | Parent-screen controls under `48 dp` | Done (`2026-11-20`) | Added `min-h-[48px]` across `ParentDashboard`, `ClassPicker`, `ThemePicker`, `PrivacyNotice`, and `TestPanel` buttons/links. |
| `F3` | Parent screen at `360×640` | Done (`2026-11-21`) | Verified in Playwright (`scripts/check-quiz-layout.mjs` `360×640` pass): zero horizontal overflow, `Tinku Noticed` card fits viewport, and all interactive controls measure `>= 48 px`. |
| `F4` | Tablet phone-frame presentation | Done (`2026-11-20`) | Scoped phone-mockup bezel, notch, and `85dvh` frame to `@media (min-width: 640px) and (hover: hover) and (pointer: fine)` (`Layout.jsx`, `index.css`), giving touch tablets a centred full-height canvas. |
| `F5` | Families declarations & target age | Human ops | Tracked under `L7` in [`CURRENT_STATE.md`](CURRENT_STATE.md). |
| `F6` | Home: Wonder World hero intro & path hop-on-advance | **Done** (`2026-11-28`, owner review) | **Why:** the earlier `2026-11-25..27` prototype chained 4 motion phases (`700 ms` blank-cover hero → `400 ms` shrink to header → `0.7–1.5 s` diagonal sticker-glide over medallions → header-slot collapse) and replayed the top-to-bottom glide on **every** Home visit. **Approved ages 6–8 refinement (`2026-11-28`):** (1) **Original `Tinku_Wave.svg` kept with puppet-rigged animations:** preserves 100% of the `6b653a9` vector trace and layers GPU-safe waving arm, ear wiggle, eye blink, brow perk, gentle body sway, and star-glow animations (`prefers-reduced-motion` safe); (2) **Animated side-margin math vignettes (`WonderBackdrop.jsx`):** frames `GradePickerScreen` and cold-open Home with staggered `1·2·3` counting blocks, `2 + 3 = 5` reveal card, ticking `3:00` clock, and tilting `cm` ruler + set-square in `--color-illo-*` tokens while keeping the centre clear around Tinku; (3) **Emotion-specific Tinku choreography & detached prop layers (`Mascot.jsx`, `scripts/build-mascot-layers.py`):** splits detached props (`?`, floating stars, confetti, `Zzz`) from the `2000×2000` originals into aligned transparent WebP layers so props float/twinkle independently while Tinku performs emotion-tuned squash-and-stretch (`celebrate` hop, `thinking` tilt, `encourage` nod, `sleeping` deep breathe); (4) **1-beat cold-open Hero (`~1.22 s`, tap-skippable) + hop-on-advance cadence + tap-to-count:** cold open cross-fades straight to Tinku's stop, same-stop returns open immediately with a hop, stop advances hop along a parabolic arc, `.mascot-breathe` is suppressed on small inline pills, and `count-objects` adds tap-to-count bounce + ascending pentatonic marimba ticks. Guarded by `Mascot.test.jsx`, `SkillPathScreen.test.jsx`, `WonderBackdrop.test.jsx`, `QuestionView.test.jsx`, `sound.test.js`, `mascotAssets.test.js`, `distLean.test.js`, and `layout:check`. |
| `F7` | Parent zone: Progress / Settings switch | Done (`2026-11-26`) | **Why:** one long scroll did two jobs: Class sat `2,673 px` down under the whole report (`390×844`). Chosen instead of a third, kid-facing Settings tab ([`DECISIONS`](archive/decisions/DECISIONS.md) `2026-11-26`). **Shipped (`ParentDashboard.jsx`):** a two-way switch under the header; opens on **Progress** (wins, currently working on, Tinku Noticed, skills, last practised, days practised); **Settings** holds Class, Colours, Parent lock and Progress backup in one card (Class `285 px` down), then tester tools, privacy and feedback. Approved after a side-by-side prototype review. Guarded by 5 `ParentDashboard.test.jsx` tests, the `layout:check` parent pass on both tabs, and `visual:capture` `03b-parent-settings`. |

---

## 2. Open Design-System Proposals (`DS-1`, `DS-5..DS-8`)

`src/index.css` and `tailwind.config.js` remain the sole token source of truth. (`DS-2` `#16a34a` and `DS-3` darker `--color-muted` shipped; `DS-4` is moot after `deepsea` removal.)

| ID | Proposal | Priority | Summary |
|---|---|---|---|
| `DS-1` | `--color-on-primary` & `--color-on-success` text tokens | P1 (required before any dark palette / Explorer band) | Replace the 6 hardcoded `text-white` exceptions in `scripts/frozen-legacy.mjs` (`COLOR_CLASS_EXCEPTIONS`) so primary buttons and correct tiles re-theme cleanly on inverted/dark palettes. |
| `DS-5` | Motion duration, easing & `48px` tap-size tokens | P3 (post-launch) | Extract hardcoded `@keyframes` durations/easing and `48px` tap size into CSS variables (`--dur-*`, `--ease-spring`, `--size-tap-min`). |
| `DS-6` | Bundled SVG icon set | v2 kid-first shipped (`2026-11-21`) | Token-coloured bespoke flat-2D kid-first SVG medallions shipped for all `36/36` ready skills (`src/components/SkillIcon.jsx`, `viewBox 48×48`) across Home & Parent Dashboard; individual icons can still be refined with commissioned art later. |
| `DS-7` | Tinku poses for loading / empty / error states | P3 | Map existing mascot poses (`Tinku_Sleeping`, `Tinku_Think3`, `Tinku_Encourage_2`) to empty, loading, and error states so Tinku hosts every child-facing screen. |
| `DS-8` | Token mirror sync hygiene | P2 (process) | If external design-tool token mirrors are adopted again, keep them strictly derived from `src/index.css` in the same PR. |

---

## 3. Open Teacher Pedagogy Review (`☐ 1 – ☐ 17`)

All 36 Grade 1–2 skills are shipped (`status: 'ready'`), but several reconstructed or LLM-authored misconception rules and recent expansions await a human primary-math teacher sign-off. When an item is signed off, update [`misconceptions-reference.md`](misconceptions-reference.md), any affected recipe, `src/engine/hints.js`, and `src/recipes/__tests__/validator.test.js` in the same change.

- **☐ 1 (`regroup-ignored`, `g1.sub.within20`):** Reconstructed rule `10 + (ones(a) - b)` collapses to the correct answer; confirm either a valid distinct rule or permanent removal (currently unemitted).
- **☐ 2 (`g1.num.21-99`, `numbers21to99.js`):** Confirm the `mcq` next-number/sequence format and its 5 drafted tags (`decade-transition-stall`, `decade-ten-overshoot`, `before-instead-of-after`, `place-value-swap`, `off-by-one`).
- **☐ 3 (Cross-LLM Review #1 changes):** Confirm collision guards, replacing `exponentiation-confusion` with `skip-count-misstep`, the 3 rewritten place-value hints, and promoting shapes/fractions into Grades 1–2.
- **☐ 4 (`ones-addition-ignored`, `g2.add.2d-nocarry`):** Confirm `(tens(a)+tens(b))*10 + ones(a)` rule and hint wording for rung-3 2-digit addition.
- **☐ 5 (`g1.place.tens-ones`, `placeValue.js`):** Confirm `tens-only-counted` (`t * 10`), scoping `unit-counting-only` to visual blocks, and palindrome/zero guards on `digit-reversal` & `expanded-addition`.
- **☐ 6 (`g2.place.hundreds`, `placeValue3.js`):** Confirm expanded-form composition (`300 + 40 + 5`) vs digit-value extraction (`"value of 4 in 345"`) and `place-column-shift`.
- **☐ 7 (`g1.num.ordinal`, `ordinal.js`):** Confirm collision guards (`position < N`, `2 * position != N + 1`) and ordinal string vs numeric options.
- **☐ 8 (`g2.time.clock`, `timeClock.js`):** Confirm `12:00`/`6:30` `hand-size-reversal` guard and `off-by-one-hour`.
- **☐ 9 (`g2.money.amounts`, `moneyAmounts.js`):** Confirm whole-unit coin/note scope (no decimal sub-units in Grade 2) and the 3 added tags (`ten-across-zero-borrow`, `operator-mixup`, `off-by-one`).
- **☐ 10 (`g1.money.coins`, `g1.time.daynight`):** Confirm expanded coin tags (`coin-count-as-value`, `sum-as-concatenation`, `off-by-one`) and day/sequence tags (`before-after-reversal`, `sequence-off-by-one`, `cycle-wrap-error`).
- **☐ 11 (`g1.shapes.2d`, `g1.shapes.space`):** Confirm 2D-shape tags (`rotation-blindness`, `square-rectangle-confusion`, `side-corner-count-slip`, `curved-straight-mixup`) and spatial tags (`opposite-spatial-term`, `vertical-horizontal-confusion`, `reference-anchor-swap`).
- **☐ 12 (Grade 1 Pre-number strand):** Confirm newly authored misconception tables for `g1.prenum.compare`, `g1.prenum.sort`, and `g1.prenum.patterns`.
- **☐ 13 (Measurement strand):** Confirm newly authored tables for `g1.measure.length`, `g1.measure.weight`, `g2.measure.length-std`, and `g2.measure.capacity`.
- **☐ 14 (`g2.data.pictograph`):** Confirm pictograph tags (`adjacent-row-read`, `total-instead-of-difference`, `scale-factor-ignored`, `off-by-one`) and Grade 2 symbol scale caps.
- **☐ 15 (`g2.frac.halves-quarters`, `fractionsBasic.js`):** Confirm the 4 fraction tags (`denominator-magnitude-bias`, `shaded-to-unshaded-ratio`, `unshaded-complement-picked`, `double-instead-of-half`) and collection-half prompts.
- **☐ 16 (8-question session variety expansion):** Confirm expanded fraction modes (`1/3`, `2/3`, unshaded complement, `3/4` of a group) and Pentagon on `g1.shapes.2d` Rung 2.
- **☐ 17 (Cross-skill difficulty parity & progressive strategy rungs):** Confirm Rung 1 → 2 → 3 progression across Grade 2 arithmetic (`addition2d`, `subtraction2d`), `pictograph`, `measureLength`, and `timeClock`.

---

## 4. Calibrated Testing Framework (Layers 2–5)

Layer 1 (automated unit/integration/guard suite) is live. Planned calibration loop:
- **Layer 2:** Simulated child personas (traits: learning rate, misconception tendencies, freezing, hint usage, fatigue — labelled `"assumed"` until calibrated) running full sessions (`bridge`, remediation ladder, bonus, mastery), not only `applyResult`.
- **Layer 3:** Automated Playwright player driving the built app for UX regressions (never treated as evidence about real children). **Status (`2026-11-26`):** a smoke test (`npm run smoke`, Level 0) is in use; the wider app-level testing plan (CI journeys, deploy previews, a deploy gate, after-deploy checks, Android emulator flows, performance, where tests live) is held in [`TESTING_PLAN.md`](TESTING_PLAN.md), each level to be agreed before it starts ([`DECISIONS`](archive/decisions/DECISIONS.md) `2026-11-26`).
- **Layer 4:** Structured kid-test protocol with an optional, default-off, parent-exported on-device session log (stored under test settings, zero identifiers, never networked — requires a locked scope decision before building).
- **Layer 5:** Recalibrate Layer 2 persona parameters from Layer 4 observations.

---

## 5. Kid-Test Watch-List (Gated Decisions — Do Not Build Until Signal Arrives)

- **Home navigation (`SkillPathScreen`) — owner flagged `2026-11-25`:** Every stop on the Journey Path can be tapped in any order (prereqs only steer Tinku; the UI never gates a stop), so a child can scatter across the path with no single "you are here". Proposed direction, **not yet decided**:
  - *Guided for the child:* stops behind Tinku stay playable; stops ahead read as a friendly "not yet" (no grey padlock); tapping one has Tinku say "Let's finish *X* first!" and scrolls back to Tinku.
  - *Choice for the parent:* a parent-zone "Move Tinku to…" so the path can follow what school taught this week (CBSE schools won't teach in the app's order).
  - *Open:* stops ahead truly locked, or tappable with a nudge; whether children who already know a topic need a "quick check to skip ahead".
  - Tinku being off-screen on load was a separate defect (`TD-15`), fixed `2026-11-25` without waiting on this decision: Home now opens scrolled to Tinku's stop and shows a "Back to Tinku" button while that stop is scrolled away (`SkillPathScreen.jsx`, guarded by `SkillPathScreen.test.jsx` and the `layout:check` Home pass). (`?home=cards` card variant archived in `archive/legacy-code/`.)
- **Composer tuning — where Tinku stands:** Today (`FRONTIER_PICK: 'lowest_level'`, `src/config/composerConfig.js:17`) Tinku goes to the started, unmastered skill with the lowest level, so it jumps around once a child has started several. Reproduced in Playwright on `2026-11-25` (Class 1: Counting 1–9 at level 3, then Addition within 10, 2D shapes and Day/night started at level 1): playing each in turn moved Tinku stop 6 → 15 → 19 → 6. Candidate rules:
  - `'lowest_level'` (today): weakest started skill first; zig-zags.
  - `'momentum'` (proposed `2026-08`, never built; only `'lowest_level'` / `'skillmap_order'` exist): the most recently played unmastered skill until mastered. Follows the child, so scattered taps still scatter Tinku.
  - *First unfinished stop* (proposed `2026-11-25`): Tinku only moves forward along the path; due reviews still come first, then Tinku returns to its stop.
  - *Open — pace:* move on at `UNLOCK_LEVEL` 3 (3 strong sessions) or `MASTERED_LEVEL` 5 (at least 5 strong sessions, the last at hard difficulty; more in practice), across 19 Class 1 stops. Leaning 3, with levels 4–5 coming back as revisits.
  - *Open — reviews:* a due review currently takes Tinku and the loud node back up the path. The archived composer rationale (`archive/trackers/TRACKER.md`) said review should never be the headline call-to-action, and should instead be blended into sessions as warm-up questions (never built). Decide together with the rule above.
  - *Gate:* either the owner's own observation counts as the signal, or wait for `L9` results. Record the call in [`archive/decisions/DECISIONS.md`](archive/decisions/DECISIONS.md) before building.
- **Theme indifference check:** Whether theme switching moves engagement at all (kid-facing theme picker stays unbuilt unless proven valuable).
- **Bridge-in warm-up toggle:** Whether walking lower rungs prevents freezes on `2d + 2d` without causing abandonment/fatigue (fallback: show only the single rung immediately below working rung).
- **Progress loss & backup:** Whether families hit data loss in practice or find JSON export/import sufficient.

---

## 6. Post-Launch Scope & Layer 2 Revisit Triggers

> **Future improvements blueprint:** Concrete post-L9 proposals across voice-first UX, tactile manipulatives, parent misconception coaching, one unified Wonder World, branding, zero-analytics growth, and `2026-10-20`-compliant parent-convenience IAP live in [`IMPROVEMENT_PLAN.md`](IMPROVEMENT_PLAN.md).

**Deliberately out of MVP (revisit only after real retention signal or unprompted willingness to pay):**
- **Curriculum expansion:** Grade 3 (needs full skill map + misconception authoring first), KG1/KG2 band, Explorer band (Grades 4–5).
- **Feel-layer polish (`T99`):** Non-option tap sounds, celebration sub-beat audio, additional haptics, wiring `sleeping` pose (or dropping from preload).
- **Monetisation (undecided):** Play Billing only (free learning loop stays complete; never paywall gentler learning). Requires Families policy check, parent gate before purchase, `INTERNET` permission impact review, updated privacy policy + Data Safety form, and **Google Play Age Signals API compliance review** if U.S./Brazil (or other mandatory age-signal jurisdictions) remain enabled.
- **Layer 2 (accounts, cloud sync, consent-gated analytics, weekly parent summaries):** Requires DPDP legal counsel review (including Gazette PDF `G.S.R. 846(E)` verification), **Google Play Age Signals API compliance review** (if shipping in U.S./Brazil or other mandatory age-signal jurisdictions), and re-auditing all privacy/Data Safety claims.
- **Desktop/web responsive & B2B/schools:** Same codebase once mobile retention is proven.

### Non-Code Operational Reminders (Active)
- **Play Age Signals API & mandatory regional child-signal laws (Pre-January 2027 gate):** Before **January 2027** (when **CA AB 1043**, **AL HB 161**, and **Brazil Digital ECA** mandatory signal-sharing take effect) — **ONLY if** Tinku Math ships in U.S./Brazil (or other mandatory jurisdictions) **AND** introduces Layer 2 / minor-affecting features (Play Billing IAP, accounts, cloud sync, analytics, or significant updates affecting minors): add a **Google Play Age Signals API review** (handling age bands, parental approval / revocation callbacks, Play Console significant-change reporting, and the new mandatory-jurisdiction check method) alongside the existing DPDP legal, `INTERNET` permission, Data Safety, and Designed-for-Families gates. See [`IMPROVEMENT_PLAN.md`](IMPROVEMENT_PLAN.md) (§7.2) for the full compliance gate checklist.
- **UAE ↔ India residency & CA/tax check:** Section D1 (India day-count tracking before UAE-source income is exposed to Indian residence taxation) in `archive/ops/questionnaire-ca-tax-uae-india.md` remains time-sensitive and independent of Layer 2 deferral.
