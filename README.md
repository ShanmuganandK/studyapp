# Tinku Math 🐘

An offline-first maths practice app for **Grades 1–2** (Grade 3 planned), built around **Tinku**, a friendly blue-grey elephant with a glowing math star. Children practise procedurally generated questions with targeted misconception hints and spaced-repetition revision, while parents get a calm, PIN-gated progress view with local backup export/import.

**Live Web PWA:** <https://tinku.stringus.com> · **Android App ID:** `com.stringus.tinku` · **Contact:** `tinku@stringus.com`

> **Contributors & AI agents:** start with [`AGENTS.md`](AGENTS.md) for invariants, rules, and verified commands.

---

## What It Is — and Is Not

- **Private by design:** Progress stays on the child's device in `localStorage`. There are **no accounts, no cloud sync, no analytics, no ads, no payments, no off-origin network calls, and zero Android OS permissions**. CI guards enforce this so the published privacy policy ([`public/privacy.html`](public/privacy.html), generated from [`src/config/privacyPolicy.js`](src/config/privacyPolicy.js)) stays true.
- **Offline-first Web PWA + Android Capacitor 8 app:** Ships both as an installable PWA (`dist/`) and a bundled Capacitor 8 Android app (`dist-android/` → `android/`).
- **Never punishes:** Wrong answers get a gentle misconception-targeted hint from Tinku, then a warm reveal and an unscored bonus question at session end — never harsh failure screens.
- **Full Grade 1–2 curriculum (`36 / 36` skills ready):** Covers counting, pre-number comparisons/sorting/patterns, place value, comparing numbers, addition and subtraction (within 10/20 and 2-digit with/without carry & borrow), multiplication intro & 2/5/10 tables, 2D shapes & spatial sense, length/weight/capacity measurement, currency-neutral coins & money (`🪙`), time & clocks, pictographs, and basic halves & quarters. Source of truth: [`src/recipes/skillMap.js`](src/recipes/skillMap.js).

---

## Tech Stack

React 18 · Vite 8 · Tailwind CSS **v4** · Capacitor 8 (Android API 36 / JDK 21) · Vitest + React Testing Library · Playwright · `vite-plugin-pwa` · Lucide icons · self-hosted Fontsource variable fonts (`Baloo 2`, `Nunito`). Hosted on Netlify (`netlify.toml`). No backend.

---

## Getting Started

Requires **Node 22** (matching CI). No `.env` file is required.

```bash
git clone https://github.com/ShanmuganandK/studyapp.git
cd studyapp
npm ci
npm run dev        # local dev server (vite --host)
```

| Command | What It Does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Regenerate `public/privacy.html`, then build web PWA to `dist/` |
| `npm run build:android` | Build Android web assets (`dist-android/`) and run `cap sync android` |
| `npm run preview` | Serve built `dist/` locally |
| `npm run test:run` | Run the full Vitest suite once (`npm test` watches) |
| `npm run lint` | ESLint 9 across active code |
| `npm run lint:hex` | Guard against raw colours outside CSS design tokens |
| `npm run privacy:check` | Verify `public/privacy.html` matches `src/config/privacyPolicy.js` |
| `npm run privacy:build` | Regenerate `public/privacy.html` |
| `npm run layout:check` | Check quiz viewport fit across 6 mobile sizes (requires `dist/`) |
| `npm run visual:capture -- <label>` | Capture Playwright screenshots for before/after comparison |

CI (`.github/workflows/ci.yml`) runs `lint` → `lint:hex` → `privacy:check` → `test:run` → `build` → post-`dist` bundle guards on every push and PR.

---

## Repository Layout

```text
src/
├── recipes/       # 27 pure question generators + skillMap.js (36 G1–2 skills)
├── engine/        # Pure mastery, spaced repetition, composer, 85-tag hints & parent coaching
├── hooks/         # Session loop, test settings, backup & Android back button
├── services/      # localStorage persistence, JSON export/import, audio, Capacitor seams
├── config/        # Brand, privacy policy source, mastery/composer/layout tunables
├── components/    # Screens (GradePicker, SkillPath, Quiz, ParentDashboard), SkillIcon & UI
├── index.css      # Design tokens, theme palettes, .quiz-stage container-query layout
└── data/, utils/  # Frozen legacy path (except src/utils/logger.js) — never edited
android/           # Capacitor 8 Android project (com.stringus.tinku)
branding/          # Master mascot art & 512px Play Store icon
public/            # Generated privacy.html and PWA icons
scripts/           # Build/privacy generators, raw-hex/frozen guards, layout & visual checks
archive/           # Historical ~1-year docs, trackers, specs & design snapshots (read-only)
```

---

## Deployment

Netlify builds with `npm run build` and publishes `dist/` to `https://tinku.stringus.com`. The origin is permanent because web progress lives in origin-scoped `localStorage`. Android debug APKs build automatically on `master` pushes and signed release AABs build via manual workflow dispatch in `.github/workflows/android.yml` (see [`CURRENT_STATE.md`](CURRENT_STATE.md)).

---

## Documentation Map

| Read This | For |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Orientation, invariants, engineering rules & commands (start here) |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | High-level system design, layers, storage & build architecture |
| [`RECIPE_TEMPLATE.md`](RECIPE_TEMPLATE.md) | Pure recipe contract, 11 formats & recipe PR checklist |
| [`misconceptions-reference.md`](misconceptions-reference.md) | Canonical 36-skill misconception tags, rules & hints |
| [`GLOSSARY.md`](GLOSSARY.md) | Project vocabulary disambiguation |
| [`CURRENT_STATE.md`](CURRENT_STATE.md) | Live release status, Play Data Safety & closed-test protocol |
| [`ROADMAP.md`](ROADMAP.md) | Future product, curriculum, design & teacher-review direction |
| [`IMPROVEMENT_PLAN.md`](IMPROVEMENT_PLAN.md) | Post-L9 product, UI/UX, brand, audience-growth, IAP & Age Signals plan |
| [`TECH_DEBT.md`](TECH_DEBT.md) | Identified code, stale-flag, boundary, lint & test gaps |
| [`SECURITY.md`](SECURITY.md) | Vulnerability disclosure policy |

---

## Security & License

- **Security:** Report vulnerabilities by email as described in [`SECURITY.md`](SECURITY.md); do not open public issues.
- **License:** No license has been chosen yet and the repository has no `LICENSE` file, so nothing here is offered for reuse.
