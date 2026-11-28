# ARCHITECTURE.md — High-Level System Design

> **Scope (Single Source of Truth):** Concise, present-tense technical architecture — module layers, runtime flows, device-local storage schemas, dual PWA/Capacitor builds, privacy pipeline, layout/asset budgets, and active architectural principles.
> - Let `src/` (assisted by local Graphify queries when indexed) explain function-level internals.
> - Engineering rules & commands live in [`AGENTS.md`](AGENTS.md); recipe contracts live in [`RECIPE_TEMPLATE.md`](RECIPE_TEMPLATE.md); live release status lives in [`CURRENT_STATE.md`](CURRENT_STATE.md); known code defects & boundary exceptions live in [`TECH_DEBT.md`](TECH_DEBT.md).
> - Historical decision rationale (~1-year log) is preserved in `archive/decisions/DECISIONS.md`.

---

## 1. Runtime & UI Flow

```text
index.html (<title>%PRODUCT_NAME%</title>)
  └── src/main.jsx (Fontsource Baloo 2 & Nunito + index.css)
        └── src/App.jsx (ErrorBoundary → AuthProvider → AppRouter)
              └── src/components/AppRouter.jsx (top-level view router: 'skills' | 'quiz' | 'parent')
                    ├── First-run gate (!gradeChosen): GradePickerScreen
                    └── Layout (.app-shell / .app-frame, useOnline offline banner, 2-tab bottom nav)
                          ├── 'skills': SkillPathScreen
                          ├── 'quiz':   RecipeQuizScreen → SessionPlayer → QuestionView (+ HintBubble, QuizPips, KidButton, CelebrationScreen, Confetti)
                          └── 'parent': ParentGateModal (portal + adult challenge) → ParentDashboard (Progress | Settings tabs)
                                          (progressSummary, practiceSummary, PrivacyNotice/PrivacyPolicy,
                                           passcode controls, useProgressBackup, ClassPicker, ThemePicker,
                                           TestPanel [gated by VITE_TESTER_TOOLS || bridgeEnabled], mailto feedback)
```

- **Theming mount:** `AppRouter.jsx` mounts `useTestSettings()`, applying `.theme-<slug>` (`wonder`, `sunset`, `bubblegum`) on `document.body` so portalled modals (`ParentGateModal`) inherit the active palette. `wonder` is the `:root` default.
- **Android Back handling:** `AppRouter.jsx` mounts `useAndroidBackButton()` so hardware Back closes the PIN modal, exits Quiz/Parent back to Skills, and only leaves the app from Skills.

---

## 2. Layer Boundaries & Core Modules

| Layer | Responsibility | Key Live Modules |
|---|---|---|
| `src/config/` | Static product config, tunables & single-source policy text | `brand.js`, `privacyPolicy.js`, `masteryConfig.js`, `composerConfig.js`, `quizLayout.js`, `flags.js` |
| `src/recipes/` | Pure, deterministic question generators + curriculum graph | `skillMap.js` (`36/36` `ready` G1–2 skills), `_rng.js`, `_plausibility.js` (used by 19 recipes), `27` recipe modules (`19` single-skill + `8` multi-skill) |
| `src/engine/` | Pure pedagogy, mastery, spaced repetition & recommendation | `sessionLite.js` (`RECIPES` registry + 8-Q session builder), `mastery.js` (0–5 level, decoupled difficulty rungs, Leitner intervals), `composer.js` (grade-scoped `recommendNext`), `hints.js` (`85/85` tag parity, `<= 10` words), `parentCoaching.js` (`84/84` diagnostic coaching), `progressSummary.js`, `practiceSummary.js` |
| `src/hooks/` | Session state machine, remediation ladder, settings & backup | `useQuizSession.js`, `useTestSettings.js`, `useProgressBackup.js`, `useOnline.js`, `useAndroidBackButton.js` |
| `src/services/` | Device-local persistence, backup I/O, audio, Capacitor seams | `progressStore.js`, `practiceDays.js`, `testSettings.js`, `authSettingsStore.js`, `progressBackup.js`, `fileTransfer.js`, `platform.js`, `sound.js`, `localAdapter.js` (inert null-user), `authService.js`, `analytics.js` (inert no-op) |
| `src/contexts/` | React context wrappers for auth/PIN gate state | `AuthContext.jsx` (`AuthProvider`), `useAuth.js` |
| `src/components/` | Presentational screens & UI primitives | `AppRouter.jsx`, `Layout.jsx`, `GradePickerScreen.jsx`, `WonderBackdrop.jsx`, `SkillPathScreen.jsx`, `SkillIcon.jsx` (`36/36` SVG medallions), `RecipeQuizScreen.jsx`, `SessionPlayer.jsx`, `QuestionView.jsx` (4 archetypes, 11 formats, 16 `mcq` `render.kind` trays, tap-to-count `count-objects`), `CelebrationScreen.jsx`, `ParentGateModal.jsx`, `ParentDashboard.jsx`, `Mascot.jsx`, `KidButton.jsx` |
| `src/utils/logger.js` | Sole sanctioned `console.*` wrapper | Exempted from `no-console` in `eslint.config.js` |

### Archived Legacy & Build Exclusions
- Unreachable pre-rewrite legacy modules (`src/data/**`, `src/components/modules/**`, 8 legacy screens, unused `src/utils/**`) and the retired `?home=cards` experiment (`SkillSelectScreen.jsx`, `SkillCard.jsx`) live in [`archive/legacy-code/`](archive/legacy-code/README.md) — excluded from Vite builds, ESLint (`eslint.config.js`), Vitest (`vitest.config.js`), and `lint:hex`, and kept for reference until safe to delete as the product matures.
- `scripts/frozen-legacy.mjs` now holds `FROZEN_GLOBS = []` (all files inside `src/` are active and guarded) alongside `COLOR_CLASS_EXCEPTIONS`.

---

## 3. Mastery, Session & Pedagogy Engine

- **Session structure (`src/hooks/useQuizSession.js`):** 8 scored questions per session on one skill (`REPEAT_GAP = 6`), generated at a fixed working difficulty rung.
- **Remediation ladder (never punishes):** Wrong #1 → misconception-targeted hint (`src/engine/hints.js`) → Wrong #2 → warm answer reveal + advance → any revealed question is parked and followed by 1 unscored bonus question at session end.
- **Decoupled `level` and `difficulty` (`src/engine/mastery.js`, `src/config/masteryConfig.js`):**
  - `level` (`0..5`) gates prerequisite unlocks (`MASTERY_THRESHOLD = 3`) and mastery (`level 5` at `maxDifficulty`). One strong session (`>= 7/8`) promotes `level`; one weak session drops it by 1.
  - `difficulty` (`1..maxDifficulty`) promotes only after consecutive strong sessions (`DIFFICULTY_UP_STREAK`, tracked via `difficultyStreak`).
  - `strategyRungs: true` (`g2.add.2d-nocarry` in `skillMap.js`) gates the optional parent-toggleable bridge-in warm-up stage. `g2.add.2d-carry` and `g2.sub.2d-{noborrow,borrow}` apply progressive rung-1/2/3 operand shaping inside `addition2d.js` / `subtraction2d.js` without triggering bridge-in.
- **Recommendation (`src/engine/composer.js`):** Grade-scoped `recommendNext(..., { grade })` prioritizes review-due skills (rendered teal `--color-review`, never amber) and frontier unlocks.

---

## 4. Device-Local Persistence & Backup Schemas

Zero cloud persistence; all browser/WebView state lives in `localStorage`:

| Key | Owner | Shape & Notes |
|---|---|---|
| `tinku:v1:skills` | `src/services/progressStore.js` | `{ version: 1, skills: Record<skillId, SkillState> }`; backfills `difficultyStreak: 0`. |
| `tinku:v1:practiceDays` | `src/services/practiceDays.js` | `{ version: 1, days: string[] }`; local `YYYY-MM-DD` dates recorded on session completion (`MAX_DAYS = 800`), no identifiers. |
| `tinku:v1:testSettings` | `src/services/testSettings.js` | `{ version: 1, theme, grade, bridgeEnabled, gradeChosen }`; excluded from backup exports. |
| `math_kids_settings_anon` | `src/services/authSettingsStore.js` (via `AuthContext.jsx`) | Parent PIN hash (`SHA-256`, or `plain:` FNV-1a fallback on insecure HTTP); excluded from backup exports. |

- **Backup export/import (`src/services/progressBackup.js`, `src/services/fileTransfer.js`):** Exchanges a versioned `tinku-math-progress` v1 JSON envelope (`{ format, version, exportedAt, skills, practiceDays? }`). Imports validate fully against an allowlist and **replace** (not merge) behind a two-step confirm. Web downloads via `<a download>`; Android exports via Capacitor Filesystem (cache dir) + Share sheet.

---

## 5. Dual Build Targets & Privacy Pipeline

1. **Single-Source Privacy Policy (`src/config/privacyPolicy.js` → `scripts/build-privacy-page.mjs` → `public/privacy.html`):**
   - `npm run build` regenerates `public/privacy.html` from `src/config/privacyPolicy.js`; CI runs `npm run privacy:check` *before* build to fail on drift.
   - `src/config/brand.js` feeds `index.html` (`%PRODUCT_NAME%`), `vite.config.js` manifest fields, and `privacyPolicy.js` (`APP_NAME`), guarded by `brand.test.js`.
2. **Web PWA (`npm run build` → `dist/`, `vite.config.js`):**
   - `vite-plugin-pwa` (`registerType: 'autoUpdate'`) precaches JS/CSS/HTML/images, all `6` mascot `.webp` files, and self-hosted Latin variable fonts (`**/*-latin-wght-normal-*.woff2`).
   - `navigateFallbackDenylist: [/^\/privacy\.html$/]` ensures `/privacy.html` serves the static policy page rather than the SPA shell.
   - Hosted on Netlify (`netlify.toml`) at permanent origin `https://tinku.stringus.com`.
3. **Android Capacitor 8 (`npm run build:android` → `dist-android/`, `capacitor.config.json`, `android/`):**
   - `vite build --mode android` disables `VitePWA` (no service worker, manifest, or `registerSW.js`).
   - `capacitor.config.json`: `appId: "com.stringus.tinku"`, `webDir: "dist-android"`, `allowMixedContent: false`, no `server.url`.
   - `android/variables.gradle`: `minSdkVersion = 24`, `compileSdkVersion = 36`, `targetSdkVersion = 36`.
   - `AndroidManifest.xml`: `portrait` lock, `usesCleartextTraffic="false"`, `allowBackup="true"` (disclosed in `privacyPolicy.js`), cache-only `FileProvider`, **zero `<uses-permission>` tags**. Only `@capacitor/{core,app,filesystem,share}` are permitted (guarded by `androidProject.test.js`).

---

## 6. Design Tokens, Layout Budgets & Assets

- **Design tokens (`src/index.css`, `tailwind.config.js`):** CSS custom properties under `:root` (`wonder`) and `.theme-{sunset,bubblegum}`. Guarded by `npm run lint:hex`, `designTokens.test.js`, and `themeContrast.test.js` (WCAG AA contrast).
- **Semantic colour grammar (locked):** `accent`/amber = rewards only; `success` (`#16a34a`) = correct; `encourage`/coral = wrong; `learn`/sky = hints; `review`/teal = review-due.
- **Illustration palette:** drawn art (`SkillIcon.jsx`, `WonderBackdrop.jsx`) fills only from `--color-illo-*` (theme-independent, `sun` is apricot, never amber) and structural surface/primary tokens — never a locked semantic token (guarded by `SkillIcon.test.jsx` and `WonderBackdrop.test.jsx`).
- **Viewport-fit layout (`src/config/quizLayout.js`, `src/index.css`):** `.quiz-stage` and `.picker-hero` use CSS container-query sizing budgets (`container-type: size`) so questions, visual trays, mascot, and answer tiles fit on `360×640` through `412×915` without scrolling (checked via `npm run layout:check`). Bottom nav hides during active quizzes and cold-open Hero, returning on the summary screen and once Home settles.
- **Images & animations:** Hero waving pose (`src/assets/mascot/svg/Tinku_Wave.svg`) preserves the clean vector trace of the waving original with non-destructive GPU-safe sway, blink, brow, and star-glow animations (`Mascot` `vector`), framed by side-margin Grade 1–2 maths illustrations in `WonderBackdrop.jsx` on `GradePickerScreen` and cold-open `SkillPathScreen`. The other Mascot poses in `src/assets/mascot/webp/` are built from `branding/mascot-originals/` by `scripts/build-mascot.sh` as `1024×1024` WebPs (guarded by `mascotAssets.test.js`). Skill medallions render via inline token-coloured SVGs in `src/components/SkillIcon.jsx` (`36/36` ready skills). PWA icons are generated by `scripts/build-icons.py` (`distLean.test.js`). Animations use GPU-composited `transform` and `opacity` only. Desktop phone-mockup bezel/notch chrome in `Layout.jsx` is scoped to fine-pointer desktop viewports (`>= 640px`, `hover: hover`, `pointer: fine`) so touch tablets render a centred full-height canvas.

---

## 7. Active Architectural Principles (Condensed)

- **No stored questions:** Every question is generated deterministically from a recipe + seeded RNG (`RECIPE_TEMPLATE.md`).
- **One plausible distractor budget:** `src/recipes/_plausibility.js` (`selectDistractors()`) limits implausible options while preserving misconception tags.
- **Zero-network MVP boundary:** Layer 2 (accounts, cloud sync, analytics, paywall) is deliberately excluded until retention signal justifies legal and infrastructure work (`ROADMAP.md`).
- **Guards over memory:** Every privacy, brand, token, permission, and recipe invariant is backed by an automated Vitest or CI script check.
