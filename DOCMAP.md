# DOCMAP.md — what every document in this repo is for

> **Purpose.** This repo has ~20 markdown files. Without a map, an agent starting a fresh
> session either reads all of them (wasteful) or guesses (wrong). This file says what each
> one is, **who is allowed to write it**, and **whether it describes the present or the past**.
>
> **You do not need to read most of these.** `CLAUDE.md` tells you the four to always read.
> Come here when you need detail on a specific area, or before creating a new document.
>
> **Layout (2026-08-16).** Root holds only what is read often or read first. Everything else moved
> under `claude-chat/`, split by whether it still describes intended work:
> **`claude-chat/specs/`** = live — read before working in that area.
> **`claude-chat/archive/`** = shipped or out of scope — read for the *reasoning*, never as a
> to-do list. Moved with `git mv`, so `git log --follow` still works on every one.
>
> ✅ The four **[verify]** entries were read end-to-end on 2026-08-16 and corrected. Two were
> wrong: `SECURITY.md` is unfilled GitHub boilerplate, not a policy, and `llm-review.md` was filed
> under "deferred" when it is a completed review whose findings are already applied.

---

## The ownership rule

> **Claude Code owns what the code IS. Claude Chat owns what we DECIDED.
> The human owns what happens outside the repo.**

Both agents READ everything. Write authority is what's constrained, because two writers on one
file with no rule is how five diverging trackers happened.

**Before Claude Chat writes any repo document, it checks recent commits first** — Claude Code
may have unpushed local work, and writing status that describes a state the remote isn't in
creates exactly the drift this map exists to prevent.

---

## Always read — start of every session

| File | What it is | Writes |
|---|---|---|
| `CLAUDE.md` | Project orientation + the rules. The bootstrap. | Chat |
| `DECISIONS.md` | Locked decisions, dated, **append-only**. If a task contradicts one, stop and ask. | Chat proposes; Code may append verified facts with human approval |
| `STANDARDS.md` | Code standards. §0 discipline, §8 scope. | Chat |
| `ARCHITECTURE.md` | Living map of the codebase — folder map, modules, contracts. Read to orient without scanning every file. | **Code**, same commit as the change |

## Status and planning

| File | What it is | Writes |
|---|---|---|
| `claude-chat/TRACKER.md` | **The only status document.** What is done, what is next, what is out of scope. Nothing else in this repo records status. | **Code** when reporting landed work; **Chat** when changing the plan |
| `claude-chat/TASK-INDEX.md` | The T-number dictionary (T1–T115) + the MVP scope line. **Holds no status.** Look here when a doc says "T109" and you need to know what that means. | Chat, rarely |

## Contracts and reference — read when working in that area

| File | What it is | Status |
|---|---|---|
| `RECIPE_TEMPLATE.md` | **The recipe contract.** Every recipe conforms to it. Protect it. | Live |
| `misconceptions-reference.md` | Canonical source for misconception tags + distractor rules (~68 rows). **When a recipe and this doc disagree, the doc wins.** | Live — pending one-time teacher review |
| `claude-chat/specs/skill-map-spec.md` | Skill map: prerequisites, curriculum ceilings, ordering (T61). | Live |
| `TEACHER-REVIEW.md` | Running list of items needing a primary-maths teacher's eye (T95). | Live, accumulating |
| `SECURITY.md` | ⚠️ **NOT a security policy — unfilled GitHub template.** Still contains the placeholder prose ("Use this section to tell people…") and an invented support table for versions 5.1.x / 4.0.x, which this project has never had (it is at 0.0.0). It is public on GitHub and currently tells a reporter nothing. **Either fill it in with a real disclosure route (the contact address in the privacy policy is the obvious one) or delete it** — an empty template is worse than no file, because it looks answered. | ❗ Placeholder |

## Design and UI

| File | What it is | Status |
|---|---|---|
| `claude-chat/specs/ui-overhaul-design-direction.md` | The Wonder visual language — tokens, colour semantics, type. Locked decisions live in `DECISIONS.md`; this is the fuller reasoning (T110). | Live — read before any UI work |
| `claude-chat/archive/ui-overhaul-screen-plan.md` | Per-screen plan for the overhaul (T111–T115). | Historical — all five screens shipped |
| `docs-responsive.md` | Responsive rules, test widths (360/320), motion + `prefers-reduced-motion`. | Live |
| `docs-images.md` | The image-asset recipe, referenced from STANDARDS §5. **Resize to display-size × 3 FIRST, then WebP at Q85–90** — resolution is the bigger saving, not format (the 6 Tinku poses went 3.5 MB → 193 KB this way). Also the loading discipline for frequently-shown art: preload all variants, reserve the container size so layout never shifts, cross-fade on opacity only. | Live |

## Feature specs — written by Chat, consumed by Code

These describe intended behaviour. `TRACKER.md` says what is actually built.

**Live — in `claude-chat/specs/`:**

| File | Covers | Status |
|---|---|---|
| `claude-chat/specs/spec-practice-composer.md` | Session composer, frontier-first, embedded reviews (T64) | **Spec settled, NOT built** — TRACKER Now |

**Shipped — in `claude-chat/archive/`.** Read for the *reasoning*, never as a to-do list:

| File | Covers | Status |
|---|---|---|
| `claude-chat/archive/spec-mastery-spaced-rep.md` | Mastery + spaced repetition (T63) | Shipped |
| `claude-chat/archive/spec-parent-dashboard-v1.md` | Parent dashboard v1 (T4) | Shipped, reskinned in T114 |
| `claude-chat/archive/spec-wire-engine-to-screen.md` | Wiring the engine to the quiz screen (T89) | Shipped |
| `claude-chat/archive/spec-wire-mastery-persistence.md` | Persisting mastery state | Shipped |
| `claude-chat/archive/task-standards-alignment.md` | The one-time STANDARDS §8 cleanup pass — a **bounded** scope list, not a refactor brief: it names exactly which new folders were cleaned (`recipes/`, `engine/`, `hooks/`, new `services/`, new `components/`, `config/`) and which FROZEN paths were explicitly out. That in/out split is still the shape the ESLint guard enforces today. | Historical — completed |

## Out of MVP scope

Read only if the revisit trigger fires (see `DECISIONS.md` 2026-08-14). Describes a tier that is
**deliberately not being built**, so not a backlog.

| File | Covers |
|---|---|
| `claude-chat/archive/analytics-plan.md` | Analytics event schema (T92). Analytics is out of MVP entirely — DECISIONS 2026-07-16. |

## Completed reviews

| File | What it is |
|---|---|
| `claude-chat/archive/llm-review.md` | **Corrected 2026-08-16 — this was filed under "deferred", which was wrong.** It is a completed cross-LLM review log of `misconceptions-reference.md` (T93), and its findings are **already applied to that doc**: four distractor rules could collide with the correct answer (`|a-b|` for 8−3, `swapDigits(44)`, `reverseDigits(353)`, `0×0`), each got a skip condition, and a global no-collision rule was added. Nothing here is pending. Kept as the trace of what changed and why — `TEACHER-REVIEW.md` draws on it, because these were an LLM's calls and a teacher must still confirm them. |

## Legal and compliance

| File | What it is |
|---|---|
| `claude-chat/questionnaire-lawyer-dpdp.md` | DPDP counsel questionnaire, **v1**. A v2 exists as a chat draft only. `A4` is annotated in place as closed. Consult is deferred. |
| `claude-chat/questionnaire-ca-tax-uae-india.md` | CA / tax questionnaire. **Still live — not deferred.** Section D1 (India day-count) is time-sensitive. |
| `claude-chat/dpdp-lawyer-conversation-guide.md` | How to run the DPDP consult when it happens. |
| `claude-chat/play-data-safety-form.md` | Verbatim Play Data Safety wizard answers + the basis for each. **Answers a different question than the privacy policy — do not reconcile them into each other.** |

## Historical — frozen, do not edit

| Path | What it is |
|---|---|
| `documents/` | Early planning records. **True when written.** Rewriting them falsifies the record. Excluded from the brand-name guard by an explicit commented rule. Also carries stale `f:/AI Programming/CBSC App/` Windows paths — its own cleanup, deliberately not done. |

## Not in this repo

| Where | What |
|---|---|
| Google Drive | `ARCHIVE (do not edit) — Tinku_Math_Tracker` — the original workbook, superseded 2026-08-15. Everything of value was moved into `TASK-INDEX.md` and `TRACKER.md`. Kept only as a 30-day safety net. |
| Google Drive | Strategy material used by the human + Claude Chat: roadmap decision gates, kid-test evidence log, research briefs A–J, work split, parked ideas. **Claude Code cannot read Drive and does not need to.** |

---

## Before you create a new markdown file

Ask, in order:

1. **Is it status?** → It goes in `TRACKER.md`. Do not create a file.
2. **Is it a decision?** → It goes in `DECISIONS.md` as a dated entry. Do not create a file.
3. **Is it a description of the code as it is now?** → `ARCHITECTURE.md`.
4. **Is it a spec for work not yet built?** → A new `claude-chat/specs/spec-*.md`, **and add a row
   to this map in the same commit.** When that work ships, `git mv` it to `claude-chat/archive/`
   and move its row — the file stops being a plan and becomes a record of reasoning.

Seventeen loose markdown files at repo root is how this project got here. A file nobody can
place is worse than no file. **Root is now reserved** for what is read often or read first;
if a new document is not in that class, it belongs under `claude-chat/`.
