# AGENTS.md — Contributor & Agent Orientation

> **Single entry point** for any human contributor or AI coding session starting on **Tinku Math** (`tinku-math`, `com.stringus.tinku`).
> Keep this file lean, tool-agnostic, and free of mutable status snapshots — read `src/` and tests directly for ground truth, using Graphify (when indexed locally in `graphify-out/`) as an exploration aid, never as the sole source of truth.

---

## 1. Documentation Map & Reading Order

Every retained topic has **one** owner. Do not duplicate content across files.

| File | Exclusive Role |
|---|---|
| `AGENTS.md` *(this file)* | Orientation, non-negotiable invariants, engineering rules, verified commands, and workflow |
| `README.md` | Human project overview, privacy posture, quick-start setup, and deployment summary |
| `SECURITY.md` | Vulnerability disclosure policy (`tinku@stringus.com`) |
| `ARCHITECTURE.md` | Concise present-tense system design, layers, storage schemas, dual builds, layout & asset rules |
| `RECIPE_TEMPLATE.md` | Pure recipe interface contract, all 11 formats + `render.kind` payloads, and recipe PR checklist |
| `misconceptions-reference.md` | Canonical 36-skill misconception tags, distractor rules, and kid-friendly hints |
| `GLOSSARY.md` | Disambiguation of overloaded project vocabulary (`rung`, `bridge`, `level`, `format`, etc.) |
| `CURRENT_STATE.md` | Live release status, web/Android deploy ops, Play Data Safety answers, and closed-test protocol |
| `ROADMAP.md` | Future product, curriculum, design-system, teacher-review, and post-launch direction |
| `IMPROVEMENT_PLAN.md` | Strategic post-L9 product, UI/UX, brand, audience-growth, ethical IAP, and pre-2027 Age Signals compliance blueprint |
| `TECH_DEBT.md` | Identified code issues, stale flags, boundary breaches, lint warnings, and test blind spots |

- **Start here:** `AGENTS.md` → `ARCHITECTURE.md` → `CURRENT_STATE.md` → `ROADMAP.md` / `TECH_DEBT.md`.
- **Curriculum / recipe tasks:** also read `RECIPE_TEMPLATE.md`, `misconceptions-reference.md`, `GLOSSARY.md`, and `src/recipes/skillMap.js`.
- **Historical records:** Archived in `archive/` (read-only context; do not revive as current truth).

---

## 2. Non-Negotiable Product Invariants

1. **Average-learner bar & never punish:** Wrong answers follow the warm remediation ladder (`hint → reveal + advance → park + 1 unscored bonus question`) with a mascot mood floor. Never use harsh red failure UI or end a session on failure.
2. **100% device-local, zero-network MVP:**
   - All state stays on-device in `localStorage` (`tinku:v1:skills`, `tinku:v1:practiceDays`, `tinku:v1:testSettings`, `math_kids_settings_anon`).
   - **Zero** accounts, cloud sync, analytics, ads, payments, off-origin network calls, or Android OS `<uses-permission>` entries.
   - Guarded by `noFirebaseAuth.test.js`, `distLean.test.js`, `analytics.test.js`, and `androidProject.test.js`.
3. **Parent trust & single-source privacy pipeline:**
   - Parent tools sit behind `ParentGateModal`.
   - `src/config/privacyPolicy.js` is the sole source for both the in-app policy and generated `public/privacy.html` (`npm run privacy:build` / `npm run privacy:check`).
   - Permanent web origin: `https://tinku.stringus.com` (changing origin wipes `localStorage`); operator: `"Stringus"`; contact: `tinku@stringus.com`.
4. **Honest brand & curriculum claims:**
   - `src/config/brand.js` defines `PRODUCT_NAME = 'Tinku Math'`, `SHORT_NAME = 'Tinku Math'`, and `DESCRIPTION` (Grades 1–2, region-neutral — **never** put `"CBSE"` or retired names into live product surfaces; guarded by `src/config/__tests__/brand.test.js`).
   - Money content uses currency-neutral `🪙` coins/notes (`zero` `₹`/rupee strings in active `src/`).
   - Derive skill/curriculum facts directly from `src/recipes/skillMap.js`, never from memory.

---

## 3. Tech Stack & Dual Build Targets

- **Stack:** React 18 · Vite 8 · Tailwind CSS **v4** (`src/index.css` loads `@config "../tailwind.config.js"` — avoid v3-only utilities) · Node 22 · Vitest · React Testing Library · ESLint 9 · Playwright · Fontsource (`Baloo 2`, `Nunito`).
- **Web PWA (`npm run build` → `dist/`):** `vite.config.js` regenerates `public/privacy.html`, bundles self-hosted Latin `.woff2` fonts and `.webp` mascots into Workbox `precacheAndRoute`, and excludes `/privacy.html` from SPA navigation fallback.
- **Android Capacitor 8 (`npm run build:android` → `dist-android/`):** `vite build --mode android && cap sync android` disables `VitePWA`, targets `com.stringus.tinku` (`minSdk 24`, `targetSdk 36`, JDK 21, portrait lock, `allowBackup="true"`, zero `<uses-permission>` tags).

---

## 4. Engineering, Layout & Boundary Rules

- **Layer boundaries:**
  - `src/recipes/` & `src/engine/` — pure, deterministic logic (seeded RNG from `src/recipes/_rng.js`; no React, DOM, `localStorage`, or `Math.random()`).
  - `src/hooks/` — session, settings, backup, and navigation orchestration.
  - `src/services/` — device-local storage, JSON export/import, audio, and native Capacitor seams.
  - `src/components/` — presentational screens and UI primitives.
  - *Known tech-debt exceptions (tracked in `TECH_DEBT.md`):* `src/contexts/AuthContext.jsx` is live in production despite `'src/contexts/**'` being in `FROZEN_DIRS`, and `src/hooks/useAndroidBackButton.js` dynamically imports `@capacitor/app`. Do not add new breaches.
- **Token & colour grammar (`npm run lint:hex` + `designTokens.test.js` + `themeContrast.test.js`):**
  - Never hardcode raw hex/RGB/Tailwind palette colours in components; consume named tokens from `src/index.css` / `tailwind.config.js`.
  - Locked semantic meanings: `accent`/amber = **rewards only**, `success` = correct, `encourage`/coral = wrong, `learn`/sky = hints, `review`/teal = review-due. `KidButton` is for answer tiles only.
- **Layout & assets:**
  - Quiz and picker screens fit one mobile viewport without scrolling via `.quiz-stage` / `.picker-hero` CSS container-query budgets (`src/config/quizLayout.js`, `src/index.css`).
  - Animate `transform` / `opacity` only (GPU-composited; never animate box-shadows or layout properties).
  - Mascot art ships as `1024×1024` WebPs (`scripts/build-mascot.sh`, guarded by `mascotAssets.test.js`). Never use stars (`⭐`) as countable objects.
- **Frozen legacy (`scripts/frozen-legacy.mjs`):**
  - Never edit or import `src/utils/**` (except `src/utils/logger.js`), `src/data/**`, `src/components/modules/**`, or the 8 unreachable legacy screens.
- **Logging & error handling:**
  - Use `src/utils/logger.js` (`no-console` is enforced by ESLint). Never leave empty `catch` blocks, always handle async rejections, and never expose raw errors to children.

---

## 5. Verified Commands & CI Guards

| Command | Purpose |
|---|---|
| `npm run dev` | Local Vite dev server (`vite --host`) |
| `npm run test` / `npm run test:run` | Watch / single-pass Vitest suite |
| `npm run lint` | ESLint 9 across active code (`archive/**` & frozen legacy excluded) |
| `npm run lint:hex` | Raw colour / Tailwind palette guard |
| `npm run privacy:build` / `npm run privacy:check` | Regenerate / verify `public/privacy.html` sync |
| `npm run build` / `npm run preview` | Regenerate privacy page + build/serve web PWA (`dist/`) |
| `npm run build:android` | Build Android web assets (`dist-android/`) and `cap sync android` |
| `npm run layout:check` | Playwright viewport fit check across 6 phone sizes (requires `dist/`) |
| `npm run visual:capture -- <label>` / `visual:diff` / `visual:list` | On-demand Playwright visual regression captures |

- **Full web CI chain (`.github/workflows/ci.yml`):**
  ```bash
  npm run lint && npm run lint:hex && npm run privacy:check && npm run test:run && npm run build && npx vitest run src/services/__tests__/noFirebaseAuth.test.js src/services/__tests__/distLean.test.js
  ```
- **Android CI (`.github/workflows/android.yml`):** Push to `master` builds the debug APK (`VITE_TESTER_TOOLS=true`) and checks merged manifest permissions via `aapt2`; manual `workflow_dispatch` (`build_type: release`) builds the signed Play AAB without `VITE_TESTER_TOOLS`.

---

## 6. Change & Verification Workflow

1. **Branching:** Work on a feature/fix/docs branch targeting `master`. Before pushing or merging into `master`, check both local `master` and `origin/master` `HEAD` and flag any mismatch first.
2. **Evidence before claims:** Verify new guards fail **RED** before trusting **GREEN**. Run the full web CI chain above before claiming completion, and cite only verified files, symbols, and command outputs.
3. **Secrets & artifacts:** Never commit `.env`, keystores (`*.jks`, `*.keystore`), `dist/`, `dist-android/`, or `graphify-out/`.
4. **Stop & escalate:** If a request conflicts with any locked product invariant (Section 2) or would require altering published privacy/Data Safety claims, stop and confirm with the project owner first.
