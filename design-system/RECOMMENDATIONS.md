# Design-system recommendations for the Study app (Tinku Math)

> **Status: RECOMMENDATIONS — not adopted, not decided.** Nothing here changes the app.
> `src/index.css` and `tailwind.config.js` remain the source of truth. Each item is tracked in
> `claude-chat/TRACKER.md` → "Design-system recommendations" as **DS-1 … DS-8**, for the human
> to accept, change or drop.

**Where these came from.** On 2026-10-03 the current tokens were synced from `src/index.css`
(branch `claude/intelligent-fermat-1ygylo` @ `1eb5d4a`, the PR #23 hand-off pack) into a Claude
design system. While the tokens were being written down, every text/fill pair was checked for
contrast in all four palettes. That check produced DS-1 to DS-4, and the transcription produced
DS-5. DS-6 to DS-8 come from the hand-off pack's own "Known weaknesses" list.

**Contrast rule used:** WCAG 2.1 AA. That means 4.5:1 for normal text, and 3:1 for large text
(24px and up, or bold 19px and up) and for borders and icons that carry meaning. Kid-facing
answer tiles are 28–36px extrabold, so they count as large text. Ratios are computed from the
hex values, not measured from screenshots.

**See it:** open `design-system/previews/index.html` in a browser. It shows current next to
recommended for every item, in all four palettes. It works offline: fonts come from
`node_modules` after `npm install`, and otherwise fall back to system fonts.

## Summary

| ID | Recommendation | Problem today | Benefit | Effort | Suggested priority |
|---|---|---|---|---|---|
| DS-1 | Add `--color-on-primary` and `--color-on-success` text tokens | CTA and correct-tile labels are a literal `text-white`, which can't re-theme. In Deep Sea it reads at 2.06:1 (CTA) and 1.74:1 (correct tile) | Every palette's buttons and correct tiles are readable, and all six `text-white` colour-guard exceptions go away | S | P1, before the closed test (L9) |
| DS-2 | Deepen correct green to `#16a34a` in Wonder and Bubblegum | White on `#22c55e` is 2.28:1, below even the 3:1 large-text floor | The correct answer's number is readable at a glance by early readers. This is the moment the app rewards | XS | P1 |
| DS-3 | Darken `--color-muted` slightly in the three light palettes | Subtitles on the sky background are 4.12–4.46:1 | Path subtitles and parent text pass AA everywhere, not only on white cards | XS | P2 |
| DS-4 | Give Deep Sea its own `--color-primary-tint` | Idle tiles fade from navy to near-white, so the label drops to 1.84:1 at the bottom of the tile | The dark palette's tiles look and read as intended, which matters because Deep Sea is the "test first" palette (TRACKER #10) | XS | P1 if Deep Sea stays in testing |
| DS-5 | Turn motion durations, easing and the 48px tap size into tokens | Durations are hard-coded in each `@keyframes` rule. 48px is repeated by hand | Tuning from kid testing ("hint pops too slowly") becomes a one-line token change, in line with design-direction rule 3. No visual change on adoption | S | P3, post-launch |
| DS-6 | Replace emoji medallions and nav cues with a bundled SVG icon set | System emoji render differently on each Android maker's phones | The same look on every phone, closer to the mascot's flat style, and themeable | M–L (needs art) | P3, post-launch |
| DS-7 | Bespoke Tinku states for loading, empty and error screens | Only the offline banner has Tinku | No screen ever looks broken or unhosted, which fits the "Tinku hosts every screen" rule | M (needs art) | P3 |
| DS-8 | Keep the Claude design system in sync with `src/index.css` | The synced copy (`tokens.current.json`) can drift silently | Claude Design and any redesign start from current values | S (process) | P2 |

---

## DS-1 — `on-primary` / `on-success` text tokens

**What.** Add two text tokens for text that sits on a coloured fill. Use them instead of the
literal `text-white`.

**Why.**

- `text-white` is a fixed colour, so it can't re-theme. That breaks the rule in `src/index.css`
  that a theme only overrides variables, and the rule in `CLAUDE.md` that components never
  hard-code colours.
- It works in the light palettes only because their primaries are dark. Deep Sea inverts
  `primary` to a light `#93b4ff`, so white text drops to **2.06:1** on every CTA ("Play again",
  the parent gate's "Check", the dashboard actions). On the correct tile it drops to **1.74:1** on
  `#4ade80`.

**Change** (see `tokens.recommended.css`):

- Add `--color-on-primary` and `--color-on-success` to `:root` and each palette. They stay white
  in the light palettes. Deep Sea gets dark navy `#0f2740` (7.38:1) and dark green `#052e16`
  (8.55:1).
- Add `'on-primary'` and `'on-success'` to `tailwind.config.js` colors.
- Swap `text-white` → `text-on-primary` on every `bg-primary` button: `App.jsx`,
  `SessionPlayer.jsx`, `CelebrationScreen.jsx`, `ParentDashboard.jsx` and `ParentGateModal.jsx`.
- Swap `text-white` → `text-on-success` in `KidButton.jsx` (`correct` state).
- Remove the six matching `text-white` entries from `COLOR_CLASS_EXCEPTIONS` in
  `scripts/frozen-legacy.mjs`. Their own reasons say "white text on a saturated bg-primary
  button", which is true only for the light palettes.

**Benefit.**

- Buttons and the correct answer are readable in every palette, now and in the planned dark
  Explorer band.
- Six fewer exceptions to the colour guard.
- The colour grammar stays intact.

**Guards.** `lint:hex` should pass with the six exceptions removed (prove it red first by leaving one `text-white` in place). Add one assertion to
`designTokens.test.js` that each palette declares both `on-*` tokens.

## DS-2 — correct green one step deeper

**What.** Change `--color-success` from `#22c55e` to `#16a34a` in `:root` (Wonder) and in
`.theme-bubblegum`.

**Why.** White on `#22c55e` is **2.28:1**, below the 3:1 floor even for large text. `#16a34a`
gives **3.30:1**, which passes AA for the large, extrabold answer label. Sunset already ships
`#16a34a`, so the value has already been tested in this app.

**Not a semantic change.** It is still green, and it still means *correct*. The locked grammar
(DECISIONS 2026-07-04 / 07-05) is about meaning, and that meaning is unchanged. It still needs
the human's approval, because it changes how the reward moment looks.

**Alternative.** `#15803d` reaches 5.02:1 (full AA at any size), but it is noticeably darker and
less celebratory. Use it only if kid testing finds the label still hard to read.

**Benefit.** On a correct answer the child sees their own number, clearly, on the colour that
says "right".

## DS-3 — muted text that passes on the sky background

**What.**

| Palette | Current | Recommended | On screen background |
|---|---|---|---|
| Wonder | `#64748b` | `#617188` | 4.46:1 → 4.66:1 |
| Sunset | `#8a7280` | `#826a78` | 4.12:1 → 4.62:1 |
| Bubblegum | `#7c6f8a` | `#786b86` | 4.35:1 → 4.61:1 |

Each new value is the old one moved 4–12% toward that palette's own `ink`, so the hue doesn't
change. Deep Sea already passes (6.80:1).

**Why.** `muted` is used directly on `color-bg` for path node subtitles ("Numbers up to 20"),
the home subtitle and parent meta lines. It passes only on white cards today.

**Benefit.** Parents and older siblings read secondary text without effort, and the system
meets AA without exceptions. The difference is too small for most people to notice.

## DS-4 — Deep Sea tile-gradient endpoint

**What.** Add `--color-primary-tint: #234466` to `.theme-deepsea`.

**Why.** `.kid-tile-idle` draws a gradient from `--color-bg-card` to `--color-primary-tint`.
Deep Sea doesn't override the tint, so its tiles fade from `#1c3d5c` to Wonder's `#eef2ff`.
The light primary label then sits at **1.84:1** on the bottom of the tile. `src/index.css`
already warns that a palette which wants the tile gradient to shift must set the tint directly.
Deep Sea simply didn't.

**Benefit.** The dark palette's answer tiles look like raised dark tiles, and the label reads
at ≥4.89:1. Deep Sea is the palette TRACKER #10 says to test first, so its result is only
meaningful if its tiles render as designed.

## DS-5 — motion and size tokens

**What.** Add `--dur-*`, `--ease-spring` and `--size-tap-min` as variables, then point each
`@keyframes` user in `src/index.css` at them. Example:
`.animate-hint-pop { animation: hint-pop var(--dur-hint) var(--ease-spring) both; }`.

**Why.** Rule 3 of `docs/ui-overhaul-design-direction.md` says "future kid-feedback tuning [is]
a token change, not a screen hunt". Colours, type and radii follow that rule. Motion, which kid
testing is most likely to tune, does not: about 15 durations and one spring curve are written inline.

**Benefit.**

- A single place to tune motion after the closed test.
- A future Explorer band (G4–5) can feel calmer by overriding a few variables.
- The values are today's, so adopting it changes nothing visually. That makes it safe to do any
  time.

## DS-6 — bundled SVG icon set

**What.** Replace emoji in path medallions and similar markers with a small, bundled,
token-coloured SVG set (one per skill family), in Tinku's flat 2D style. Keep the emoji for
countable objects in count questions until a matching object set exists.

**Why.** The hand-off pack records this as a known weakness: emoji render differently on each
Android maker's phones, and low-end Android is the target device. Emoji also can't take theme
colours.

**Benefit.**

- The same look on every phone.
- Icons can use `primary`, `review` and `accent` correctly.
- Closer to the mascot's art style.

**Constraints that still apply:** self-hosted (no icon CDN), WebP or inline SVG sized for
display, no stars for countable things.

**Needs:** art direction and a decision before any code.

## DS-7 — Tinku for loading, empty and error states

**What.** Map the existing poses to the states that have none today:

- `Tinku_Sleeping` for empty and "nothing to review".
- `Tinku_Think3` for loading.
- `Tinku_Encourage_2` for "something went wrong, let's try again".

Commission new art only if those poses aren't enough.

**Why.** "Tinku is the host of every kid-facing screen" (design direction), but only the
offline banner follows that rule.

**Benefit.** No kid-facing screen looks broken or empty. This supports D7 retention, because a
child who hits an error sees a friend rather than a blank screen.

## DS-8 — keep the Claude design system in sync

**What.** Treat `design-system/tokens.current.json` and the Claude design system ("Tinku Math",
synced from GitHub) as **mirrors** of `src/index.css`, never as sources. When a token in
`index.css` changes, re-sync both in the same PR and note it in `claude-chat/TRACKER.md`.

**Why.** Without a rule, the copy drifts and the next redesign starts from stale values. This is
the same failure the claims rule exists for.

**Benefit.** Claude Design, previews and hand-off packs always show the shipped app.

**Optional later step:** a test that compares `tokens.current.json` colour values against
`src/index.css`.

---

## Not recommended (considered and rejected)

- **Changing any semantic colour's hue** (for example a "more accessible" red for wrong
  answers). The grammar is locked, and coral already passes as text with `encourage-ink`
  (4.56:1).
- **A high-contrast palette now.** It can be useful later, but it is a new theme, not a fix, and
  it would add a fourth test variable during the closed test.
- **Shipping the Latin-Extended or Devanagari font subsets differently.** Fontsource already
  loads them on demand by `unicode-range`, so there is nothing to change.
