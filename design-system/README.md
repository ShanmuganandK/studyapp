# design-system/ — Tinku Math design system + recommendations

> **Status: RECOMMENDATIONS for the Study app. Not adopted.** Nothing in this folder is imported
> by the app or changes it. **`src/index.css` + `tailwind.config.js` remain the source of truth**
> for every token. This folder holds a written-down copy of the current system and proposed
> changes for the human to accept, change or drop. Tracked in `claude-chat/TRACKER.md` →
> "Design-system recommendations" (DS-1 … DS-8).

## What's here

| File | What it is |
|---|---|
| `RECOMMENDATIONS.md` | **Start here.** DS-1 … DS-8: what is recommended, the evidence (contrast ratios per palette), the exact change, the files it touches, the benefit, effort and suggested priority. Also lists what was considered and rejected. |
| `tokens.recommended.css` | The proposed token changes as CSS blocks, one per recommendation. A proposal only: to adopt one, copy its lines into `src/index.css`. |
| `previews/index.html` | Current next to recommended for DS-1 … DS-5, in all four palettes, with live contrast ratios. |
| `previews/components.html` | The current components (answer tile states, CTA, hint bubble, path states, pips, nav, colour swatches), with a palette switcher and an "apply recommendations" toggle. |
| `previews/tokens.css`, `previews/preview.css` | Preview-only styling, generated from `src/index.css` plus the recommendations. Not app code. |
| `tokens.current.json` | The current tokens (19 colours × 4 palettes, type, spacing, radii, shadows, motion) in the Claude design-system format, synced 2026-10-03 from `1eb5d4a`. A mirror, never a source (see DS-8). |
| `brand-book.md` | Usage rules for the current system: locked colour grammar, hard constraints, voice, type, shape, motion, mascot, iconography, components. |
| `screens.md` | Screen inventory with the `design-handoff/screenshots/` files, gaps, and known weaknesses. |

## Viewing the previews

Open `design-system/previews/index.html` in a browser straight from the checkout. It needs no
server and makes no network requests. Fonts load from
`node_modules/@fontsource-variable/*` after `npm install`; without that, system fonts are used,
and only the type looks different.

## Relationship to other folders

- `design-handoff/` (PR #23) is the pack for redesigning **screens** in Claude Design.
- This folder is about the **token system** itself, and what to fix in it.
- The same current system is also kept as a Claude design system named "Tinku Math" (synced from
  GitHub, owned by the repo owner). It mirrors `tokens.current.json`.

## Rules these recommendations respect

These rules come from `CLAUDE.md` and DECISIONS, and no recommendation breaks them:

- The colour grammar is locked: amber = reward only, green = correct, soft coral = wrong, sky =
  hint, teal = review.
- No network assets.
- Animate only `transform` and `opacity`, and honour reduced motion.
- Tap targets are at least 48px.
- No raw hex in components.
- Presentation only.
