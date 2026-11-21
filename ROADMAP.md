# ROADMAP.md — Future Product, Curriculum & Design Direction

> **Scope (Single Source of Truth):** Future product features, open closed-test UX follow-ups, design-system proposals, open primary-math teacher pedagogy sign-offs, testing framework evolution, and deferred post-launch scope.
> - Detailed post-L9 future improvements (product differentiation, UI/UX upgrades, brand positioning, organic audience growth, ethical IAP strategy, and pre-2027 child age-signal compliance planning) are documented in [`IMPROVEMENT_PLAN.md`](IMPROVEMENT_PLAN.md).
> - Live release status & closed-test ops live in [`CURRENT_STATE.md`](CURRENT_STATE.md).
> - Code-level defects, stale flags, boundary breaches, lint warnings, and automated test gaps live in [`TECH_DEBT.md`](TECH_DEBT.md).

---

## 1. Closed-Test UX Follow-Ups (Pending Prioritisation)

Measured via Playwright at `360×640` and `412×915` CSS px (not yet verified on real devices; Android target guideline is `48 dp`, whereas `layout:check` currently enforces `>= 44 px` on answer tiles only):

| ID | Area | Priority | Detail |
|---|---|---|---|
| `F1` | Child-facing controls under `48 dp` | Done (`2026-11-21`) | Expanded `"← Skills"`, `MuteButton`, `"Listen to hint"`, and Celebration buttons to `>= 48×48` hit boxes without shifting layout (`SessionPlayer.jsx`, `HintBubble.jsx`, `CelebrationScreen.jsx`), and asserted in `scripts/check-quiz-layout.mjs`. |
| `F2` | Parent-screen controls under `48 dp` | Done (`2026-11-20`) | Added `min-h-[48px]` across `ParentDashboard`, `ClassPicker`, `ThemePicker`, `PrivacyNotice`, and `TestPanel` buttons/links. |
| `F3` | Parent screen at `360×640` | Done (`2026-11-21`) | Verified in Playwright (`scripts/check-quiz-layout.mjs` `360×640` pass): zero horizontal overflow, `Tinku Noticed` card fits viewport, and all interactive controls measure `>= 48 px`. |
| `F4` | Tablet phone-frame presentation | Done (`2026-11-20`) | Scoped phone-mockup bezel, notch, and `85dvh` frame to `@media (min-width: 640px) and (hover: hover) and (pointer: fine)` (`Layout.jsx`, `index.css`), giving touch tablets a centred full-height canvas. |
| `F5` | Families declarations & target age | Human ops | Tracked under `L7` in [`CURRENT_STATE.md`](CURRENT_STATE.md). |

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
- **Layer 3:** Automated Playwright player driving the built app for UX regressions (never treated as evidence about real children).
- **Layer 4:** Structured kid-test protocol with an optional, default-off, parent-exported on-device session log (stored under test settings, zero identifiers, never networked — requires a locked scope decision before building).
- **Layer 5:** Recalibrate Layer 2 persona parameters from Layer 4 observations.

---

## 5. Kid-Test Watch-List (Gated Decisions — Do Not Build Until Signal Arrives)

- **Home navigation (`SkillPathScreen` vs `?home=cards`):** Which view children navigate more confidently.
- **Composer tuning:** Whether children follow Tinku's pointer (`FRONTIER_PICK: 'momentum'`) and whether review-due prompts deflate motivation (in-session review embedding).
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
