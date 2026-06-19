# CLAUDE.md — Project Orientation for AI Coding Agents

> Read this file, `DECISIONS.md`, and `STANDARDS.md` at the start of every session before writing any code.
> (Also read `ARCHITECTURE.md` if it exists, to understand current structure.)
> This applies to Claude Code AND Antigravity. If anything here conflicts with a task instruction, ask before proceeding.

---

## What this project is

**Tinku Math** — a CBSE-aligned math learning app for Indian children, **Grades 1–3** at launch (the "Wonder" band). Mascot is **Tinku**, a friendly flat 2D blue-grey elephant with a glowing math star. Built solo, targeting the Indian market, run from Dubai.

The product's heart is a **learning loop**: a child practices procedurally-generated math, gets safe remediation on mistakes, and improves over days via spaced repetition. A parent dashboard shows progress and is the paid hook (freemium).

**Success is measured by retention (D7), not revenue.** Build for kids returning tomorrow.

---

## Tech stack (do not change without a decision)

- **React 18 + Vite** (SPA), **Tailwind CSS**
- **PWA** (offline-capable, installable) — primary delivery; **Capacitor** wraps it for Play Store later
- **Firebase**: Auth (anonymous-first), Firestore (child state + offline persistence), Analytics
- **Deployment**: Netlify (web/PWA), Google Play later
- Target devices: **low-end Android**. Performance matters. Animate only `transform`/`opacity`.

---

## Core architecture: "logic, not questions"

We **never store questions**. We store **recipes** (a.k.a. templates) — functions that *generate* questions. One recipe = infinite questions.

Every recipe conforms to ONE fixed contract (see `RECIPE_TEMPLATE.md`). Input: `difficulty (1-3)` + RNG. Output: a fixed shape `{ questionText, correctAnswer, options, format, misconceptions }`.

- **Difficulty is capped** at the curriculum ceiling for each skill (defined in the skill map). It does NOT climb forever — a harder range = a *different skill*.
- **Practice stops when mastery is proven** (≈80% correct at hard level across sessions on different days), then the skill enters spaced-repetition review and the child moves to the next skill.
- **Wrong answers are deliberate**: each distractor encodes a known misconception (e.g. "forgot-carry"), so the app can give targeted hints and the dashboard can explain *why* a child struggles.

This architecture is why content is "solved forever" and why new grades/boards are cheap later. **Protect the contract.** Screens, mastery, and dashboard only ever see the contract output — never recipe internals.

---

## How work is split (two AIs, one repo)

- **Claude Code** = architecture-critical: the recipe contract, reference recipes, skill map, remediation ladder, adaptive difficulty, spaced repetition, mastery tracker, session composer, auth (anonymous→Google linking), Firestore data model, Play Billing, analytics schema, Capacitor build.
- **Antigravity** = well-defined replication: the remaining ~36 recipes (copying Claude's examples), UI components/screens, CSS animations, sound hooks, theme tokens, config. **Always given a Claude-built example to copy.**
- **The human** reviews every diff before merge, and owns Play Console / Families Policy / tax / ASO / kid-testing.

Rule of thumb: **Claude builds the first of a kind; Antigravity replicates the rest.**

---

## Stitch screens — how to handle

Stitch (Google's design tool) produced screen mockups. They are **layout/structure references only**, NOT code to import verbatim. The mockups contain decisions we have OVERRIDDEN (see DECISIONS.md): they show a robot mascot (we use Tinku elephant), a dark theme (we use light for Wonder band), $ pricing (we use ₹), and placeholder non-math questions (we use the generator). When translating any Stitch layout to React, apply the locked decisions — do not reproduce the mockup's mascot/theme/pricing/content.

---

## Conventions

- Components: functional React, hooks. One component per file, PascalCase.
- Keep components **presentational where possible**; logic lives in hooks/services Claude owns.
- Recipes live in `/recipes`, one file per skill, all matching `RECIPE_TEMPLATE.md`.
- Every recipe must pass the shared validator test before merge.
- No hardcoded questions anywhere. No secrets in code. No browser `localStorage` for app state (use React state + Firestore).
- Tailwind: use the theme tokens (CSS variables), not hardcoded colors, so band theming works.
- Tests: Vitest + React Testing Library. The QuizEngine and recipes must have tests.

## Git discipline

- One branch per task. Small commits. Descriptive messages.
- The human reviews and merges. Don't assume a prior session's uncommitted work exists.

## Build order (current focus)

1. Recipe contract + `RECIPE_TEMPLATE.md` + validator test + 2 reference recipes (addition, counting)
2. Skill map (Grades 1–2) with prerequisites + ceilings
3. Remaining recipes (Antigravity, from examples)
4. Remediation ladder, adaptive difficulty
5. Anonymous auth + Firestore data model + child profiles
6. Mastery tracker + spaced repetition + session composer
7. Daily limit + paywall + parent dashboard
8. Tinku integration across screens, feel layer (animation/haptics/sound)
9. Capacitor wrap + Play Console + analytics

See the project tracker (Excel) for the full task list and the learning-loop spec for engine detail.

## Keep ARCHITECTURE.md current (standing instruction)

Maintain an `ARCHITECTURE.md` at repo root as a living map of the codebase. This is the cheap "code view" that saves tokens in future sessions — read it first to orient, update it whenever you add or significantly change a module.

- **Read it** at the start of a session (after CLAUDE.md + DECISIONS.md) to understand current structure without scanning every file.
- **Update it** whenever you create a new module, move things, or change how pieces connect — in the SAME commit as the code change.
- Keep entries SHORT: a few lines per major module — what it does, key files/exports, what depends on it. Not exhaustive docs; a navigation aid.
- Suggested sections: Folder map (one line per top-level folder), Modules (recipes, quiz engine, auth, mastery/spaced-rep, session composer, dashboard, billing, feel layer), Data model (Firestore shapes), Key contracts (the recipe contract, component data shapes).
- If `ARCHITECTURE.md` does not exist yet, create it the first time you add a module worth recording.

This file is for both AIs and the human. Treat it as the project's table of contents.

## When unsure

Stop and ask the human. Do not invent product decisions — check DECISIONS.md first; if it's not there, ask and then record the answer there.
