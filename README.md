# Tinku Math 🐘

A maths practice app for Indian children in **Grades 1–2** (Grade 3 is planned), built around
**Tinku**, a friendly blue-grey elephant with a glowing math star. A child practises
procedurally generated questions, gets a gentle hint when they slip, and comes back over the
following days as the app schedules revision. Parents get a calm progress view behind a PIN.

**Live:** <https://tinku.stringus.com> · **Contact:** tinku@stringus.com · built solo, targeting
India, run from Dubai.

> **For contributors and AI agents:** start with [`AGENTS.md`](AGENTS.md). It lists the reading
> order, the locked decisions and the guards. This README is only an overview.

## What it is, and what it is not

- **Private by design.** Progress lives in the browser's `localStorage` on the child's own
  device. There are **no accounts, no cloud, no analytics, no ads and no payments**, and the
  built app makes no network calls. A CI guard keeps it that way, and the published privacy
  policy ([`public/privacy.html`](public/privacy.html), generated from
  [`src/config/privacyPolicy.js`](src/config/privacyPolicy.js)) depends on it.
- **Offline-first PWA.** Installable, and it works with no connection.
- **Never punishes.** A wrong answer gets a hint from Tinku, then the answer revealed
  warmly, never a red cross, and a session never ends on a failure.
- **Content is still partial.** 17 of the 35 planned Grade 1–2 skills are built (Grade 1: 7,
  Grade 2: 10), all in number and arithmetic: counting, comparing, addition and subtraction
  (including 2-digit with carry and borrow), 3-digit numbers, and the 2, 5 and 10 times tables.
  **Shapes, measurement, time, money, data and patterns are not built yet.** The source of truth
  is the `status` field in [`src/recipes/skillMap.js`](src/recipes/skillMap.js) (count as of
  2026-10-13). This is **not** a full-syllabus app.

## How it works

Questions are never stored. Each skill has a **recipe** (a function) that generates unlimited
questions from a difficulty and a seeded random number generator, following the contract in
[`RECIPE_TEMPLATE.md`](RECIPE_TEMPLATE.md). Every wrong option is a deliberate, known
misconception ([`misconceptions-reference.md`](misconceptions-reference.md)), so hints can be
targeted. A session is 8 questions on one skill; mastery, spaced-repetition review and the
"Tinku suggests" recommendation are computed from the results.

The parent zone (behind a 4-digit PIN) shows progress, and can export and import it as a file so
a family can move devices. There is also a test panel for themes and grade, which children
cannot reach.

## Tech stack

React 18 · Vite · Tailwind CSS **v4** · Vitest + React Testing Library · `vite-plugin-pwa` ·
Lucide icons · fonts self-hosted via Fontsource (Nunito, Baloo 2). Hosted on Netlify. No backend.

## Getting started

Needs **Node 22** (what CI uses).

```bash
git clone https://github.com/ShanmuganandK/studyapp.git
cd studyapp
npm ci
npm run dev        # dev server, reachable on your LAN (vite --host)
```

No `.env` file or environment variables are needed.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Regenerate `public/privacy.html`, then build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run test:run` | Run the full test suite once (`npm test` watches) |
| `npm run lint` | ESLint (new code only; frozen legacy is excluded) |
| `npm run lint:hex` | Fail on raw colour values in components (use theme tokens) |
| `npm run privacy:check` | Fail if `public/privacy.html` is out of sync with its source |
| `npm run privacy:build` | Regenerate `public/privacy.html` |
| `npm run visual:capture -- <label>` | Screenshot key screens for before/after comparison |

CI (`.github/workflows/ci.yml`) runs lint → lint:hex → privacy:check → tests → build on every
push and pull request. Run the same before you push.

## Where things are

```
src/
├── recipes/      # question generators, one per skill, plus skillMap.js (the curriculum map)
├── engine/       # pure logic: mastery, spaced repetition, session composer, hints
├── hooks/        # session flow and test-settings orchestration
├── services/     # device-local storage, progress export/import, sound; no network
├── config/       # brand name, privacy policy text, mastery and composer tunables
├── components/   # screens and presentational UI
├── index.css     # design tokens (CSS variables) and animations
├── utils/, data/ # FROZEN legacy question path; never edited, will be deleted
public/           # PWA icons and the generated privacy.html
scripts/          # guards (raw-hex, frozen paths), privacy page generator, simulators
claude-chat/      # tracker, specs and archive
design-handoff/   # brief, screenshots and tokens for a redesign (reference only)
design-system/    # design-system recommendations DS-1…DS-8 (proposals, not adopted)
documents/        # early planning records, kept as history; not current
```

[`ARCHITECTURE.md`](ARCHITECTURE.md) is the detailed, maintained map of the code.

## Deployment

Netlify builds with `npm run build` and publishes `dist/` (see `netlify.toml`). Production is
served from `https://tinku.stringus.com`; every pull request also gets a deploy preview. After a
deploy, check that the published commit matches `master`, in an incognito window first, because a
stale service-worker cache looks identical to a stale deploy (see `AGENTS.md`).

> The address is permanent on purpose. Progress is stored per origin, so changing the domain would
> wipe every user's progress.

## Documentation map

| Read this | For |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Orientation, rules and guards (start here) |
| [`DECISIONS.md`](DECISIONS.md) | Locked product and technical decisions |
| [`claude-chat/TRACKER.md`](claude-chat/TRACKER.md) | The only status document: what is done and next |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | How the code fits together |
| [`STANDARDS.md`](STANDARDS.md) | Code, testing and layout standards |
| [`DOCMAP.md`](DOCMAP.md) | What every other document is, and who may edit it |
| [`GLOSSARY.md`](GLOSSARY.md) | Project vocabulary |

## Security

Report vulnerabilities by email, as described in [`SECURITY.md`](SECURITY.md). Please don't open
public issues for security reports.

## License

No license has been chosen yet and the repository has no `LICENSE` file, so nothing here is
offered for reuse. (An earlier version of this README claimed the MIT License; no license file
backed that claim.)
