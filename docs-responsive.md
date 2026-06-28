# docs/responsive.md — Fit-One-Viewport & Responsive Sizing (detailed reference)

> Referenced from STANDARDS §5. Read when building or fixing screen layouts. STANDARDS holds the principle (core interaction fits one viewport; scroll is a fallback); this holds the technique.

## The principle (restated)
The essential interaction of a screen — for the quiz, the **question + its answer options** — must fit ONE viewport on a standard phone, no scroll, by default. Decorative elements yield space first. Scroll is a fallback for exceptional content only, and never hides the primary action.

## Techniques

**1. Size the screen to the dynamic viewport.**
- Use `100dvh` (dynamic viewport height) for the screen container, NOT `100vh` — `dvh` accounts for mobile browser bars that appear/disappear, so content doesn't get cut off or jump.
- The quiz screen is one screen tall; its children are distributed within that height.

**2. Distribute, don't stack-and-overflow.**
- Use flexbox column with the screen as the flex container. Give regions sensible flex behavior:
  - Mascot region: `flex-shrink` (yields space when tight), capped max size.
  - Question region: takes natural height; can scroll INTERNALLY only if a question is exceptionally long.
  - Answer region: `flex-shrink: 0` — never compresses away; always visible, anchored (e.g. toward the bottom above the nav).

**3. Fluid sizing with `clamp()`.**
- Font sizes: `clamp(min, preferred-vw-based, max)` so text scales with screen size but stays readable (not too small on tiny phones, not huge on big ones). E.g. question text `clamp(1.1rem, 4.5vw, 1.6rem)`.
- Answer buttons / tap targets: scale similarly but keep a MINIMUM tap-target size (kids' fingers — don't shrink below ~44–48px tappable height).
- Mascot size: responsive, shrinks on short screens; define a min and max.

**4. Decorative yields first.**
- The mascot is decorative; the answers are essential. Priority order when space is tight: keep answers full-size and visible → shrink mascot → reduce vertical spacing → (last resort) allow the QUESTION text area to scroll internally. Never let the mascot push answers off-screen.

**5. Scroll only as fallback, scoped.**
- The screen itself does not scroll by default. If a question is genuinely too long to fit even after the above, only the question-text area gets an internal scroll — the answers stay fixed and visible.

## Testing
- Test across a range of phone heights: small budget Android (short viewport), typical phone, large phone. The critical check: on a standard phone, question + 4 answers + mascot fit with NO scroll, and the answer options are ALWAYS visible.
- Test the longest real content (long compare/word questions) to confirm the fallback behaves (question scrolls internally, answers stay put) rather than the whole screen overflowing.
- `100dvh` behavior: check with the mobile browser address bar both visible and hidden.

## Scope note
This is about the CORE interaction fitting. Broader visual prettiness / full responsive desktop layouts are separate (deferred polish / post-launch web work). This doc is specifically: the essential interaction always fits and is reachable without scrolling.
