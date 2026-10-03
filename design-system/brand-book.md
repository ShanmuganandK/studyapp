# Tinku Math — Brand book (current system, as synced)

Tinku Math is a maths practice app for Indian children aged about 5–8 (CBSE/NCERT Grades 1–2), built as a phone-first PWA for low-end Android. Its look is called **Tinku's Wonder World**: a bright, airy place hosted by Tinku the elephant, where maths feels like play. Parent screens use the same palette, but more calmly.

Check every screen against these five words: **Warm. Playful. Encouraging. Clear. Alive.** Avoid anything that feels corporate, dense, cluttered and babyish, dark (in the Wonder band) or competitive.

## Non-negotiables

- **Colour meanings are locked.** Each meaning has exactly one colour family, and every theme keeps the same meanings:
  - `color-accent` (amber) means **reward only**: mastered rings and pips, celebration stars, and the "N skills mastered" card.
  - `color-success` (green) means **correct**.
  - `color-encourage` (soft coral) means **wrong**. Never use red for this, and never amber.
  - `color-learn` (sky) means **hint or learning**, including "Tinku suggests".
  - `color-review` (teal) means **review is due**. Any future "needs attention" state also uses teal, never amber.
- **Never punish.** Don't use red, a harsh shake, or a "wrong!" tone. Tinku never scolds. The end of a session is always a celebration.
- **The question fits one screen.** On a quiz screen, the question and answers fit without scrolling at 360×640 and at 320×568. Decorative items such as Tinku shrink first, and the answers never leave the screen.
- **Animate only `transform` and `opacity`**, for 150–300ms (see the `dur-*` tokens), and respect `prefers-reduced-motion`.
- **Tap targets are at least `tap-min` (48px).** Kid-facing type is big.
- **No network assets.** Fonts and images are bundled with the app. Never use a CDN font link, analytics, ads, accounts, payments or sharing.
- **Use tokens, never raw hex.** Components use `bg-primary`, `text-ink`, `rounded-card` and so on. A theme changes the same variables. The app's `lint:hex` check enforces this.
- Countable objects (🍎 🌸 🍪) are **never stars**, because stars are rewards.

## Content fundamentals

- Talk to the child warmly and briefly, in the first person plural or with Tinku as the speaker: "What shall we practise?", "Follow the path with Tinku!", "Great job!", "Tinku suggests!", "↻ Review time!".
- Use Indian English spelling: *practise* (verb), *maths*, *colour*. Use "Class 1 / Class 2" for grades on kid-facing and parent-facing screens.
- Hints come from Tinku in a speech bubble and suggest a way to try, for example "Count each one slowly!". They never pass judgement.
- Use as few words as possible on kid screens. Parent screens can be informational, like a calm, premium product.
- Emoji currently stand in for icons (path medallions, countable objects). See Iconography.
- Take the product name from `src/config/brand.js` (**Tinku Math**). Never put "CBSE" in the name; "CBSE-aligned" is allowed in descriptions only.

## Colour

- Put screens on `color-bg`. Put cards, idle tiles, the bottom nav and modals on `color-bg-card`.
- Use `color-primary-ink` for headings and big numbers, `color-ink` for body and question sentences, and `color-muted` for subtitles and secondary text. Use `color-muted` on `color-bg-card` where you can: on `color-bg` it reaches only 4.46:1.
- Use `color-primary` for structure: the CTA fill with white text, idle tile text, active nav, and in-progress pips. Use `color-primary-soft` for borders, the nav pill, empty pips and the path line.
- On a wrong answer, use a `color-encourage-soft` fill with a `color-encourage` border and `color-encourage-ink` text. For hints, use the same pattern with `color-learn-soft`, `color-learn` and `color-learn-ink`.
- The alternate palettes (**sunset**, **bubblegum** and the dark **deepsea**) are a **test tool in the parent zone, not a feature for kids**. A new palette must override `color-primary`, `color-primary-ink` and `color-ink` together with their `-rgb` channel triples, which the app's effect layer needs. Its `primary` must not clash with a feedback colour, so it can't be green, coral or teal. In deepsea, the `-ink` and `-soft` slots are inverted on purpose.

## Type

- **Baloo 2 Variable** (`display`) is for big kid-facing text: `question` equations, `option` tile labels, and `title`. Use it extrabold (800). Big numbers also get `.kid-num-3d`, a soft text shadow.
- **Nunito Variable** (`body`) is for everything else: the `prompt` question sentence (extrabold or bold), `body`, `hint` (semibold), and all parent screens.
- Kid-facing sizes are fluid `clamp()` values. The token stores the largest size and its usage note gives the full clamp. A question longer than 20 characters drops from `question` to `prompt` so it still fits on one screen.

## Shape, depth and spacing

- Everything is soft. Answer tiles and CTAs use `radius-button`, cards, bubbles and modals use `radius-card`, and pills, pips and medallions use `radius-full`.
- Tappable things look raised. Answer tiles and CTAs get `shadow-button`, a layered "pillow" shadow. Idle tiles also get `.kid-tile-idle`, a gradient from `color-bg-card` to `color-primary-tint`, and a 4px `color-primary-soft` border. Cards and bubbles use `shadow-card`, and the bottom nav uses `shadow-nav`. Shadows never animate.
- A pressed tile or CTA squishes to `scale(0.95)`. On hover, a tile scales to 1.03.
- Spacing follows Tailwind's 4px scale, with side margins of `gutter` or `gutter-wide`. On phones the app fills the screen. At 640px and wider it sits in a phone frame 85% of the screen height, up to 800px.

## Motion

- **Question:** the question slides in (`dur-screen`) and the answer tiles appear one after another (`dur-option-in`, 45ms apart). A **correct** answer pops (`dur-correct`) and plays a chime. A **wrong** answer gets a gentle sway (`dur-wrong`). The hint bubble springs in (`dur-hint`, `ease-spring`).
- **Celebration:** Tinku pops in, then confetti, then the stars count up, then "Great job!", then the mastery beat, then the buttons rise in.
- **Ambient:** Tinku breathes in a slow loop (`dur-breathe`) and the suggested path node pulses (`dur-path-pulse`). When reduced motion is on, everything appears at once with no animation.

## Tinku, the mascot

- Tinku is the only mascot. He is a flat 2D blue-grey elephant with peach inner ears, rosy cheeks and a glowing amber star. Don't use robots or replacements, and never redraw him. Use the six poses in `src/assets/mascot/webp/` (copies in `design-handoff/mascot/`).
- Tinku hosts every kid screen. A pose change cross-fades over `dur-mascot-swap`. Sit him on `.tinku-ground`, a soft ellipse tinted with `color-primary`.
- Map poses to moments: `Tinku_Mascot` for calm or happy, `Tinku_Happy_2` for celebrating, `Tinku_Encourage_2` for wrong answers and hints, `Tinku_Think3` while a question is open, `Tinku_Bye` for home and the grade picker, and `Tinku_Sleeping` for idle or empty states.

## Iconography

- **Navigation:** Lucide line icons (Home, Lock), with a `color-primary-soft` pill behind the active item.
- **Path medallions and countable objects:** system emoji. They render differently on each Android maker's phones, and a custom icon set is a known improvement still to make.
- **App icon:** `public/pwa-512x512.png`. It is a multicoloured illustration that doesn't use the Wonder palette, so treat it as an image and never take colours from it.

## Components (in the app's `src/components`)

- `KidButton` is **only for answer tiles**: 2 per row, `clamp(3rem, 11vh, 5rem)` tall, with idle, correct and wrong states. Never use it for navigation.
- The **CTA** pattern is `color-primary` fill, white text, bold, `radius-button` and `shadow-button`, used on Celebration and error screens. Secondary actions are text links.
- Other components:
  - `HintBubble`: a sky bubble whose tail points at Tinku.
  - `MasteryPips`: 5 dots. `color-primary` shows the level reached, `color-accent` means mastered, and `color-primary-soft` means empty.
  - `SkillPathScreen`: the zig-zag journey path, which is the default home screen.
  - `SkillCard`: the alternative home screen.
  - `CelebrationScreen` with `Confetti`.
  - `ParentGateModal`: a 4-digit PIN pad. A wrong PIN triggers a shake, which is the one place a shake is allowed.
  - `ParentDashboard`.
  - `GradePickerScreen`.
- The order of priority for skill states: suggested-review (teal ring) > suggested-next (sky ring, "Tinku suggests!") > due but not suggested (neutral ring with a faint teal cue) > mastered (amber ring) > idle.

## Contrast notes

These values come from the app's code and are kept as they are. Fix them in the code, not here:

- White text on `color-success` (the correct tile) is only 2.28:1 in wonder and bubblegum, and 1.74:1 in deepsea.
- In deepsea, white CTA text on `color-primary` is 2.06:1. `color-primary-tint` isn't overridden there, so idle tiles fade to a light tint.
- `color-muted` on `color-bg` is between 4.12 and 4.46:1 in the three light palettes.

## Not synced (into the Claude design system)

- The `-rgb` channel variables (`color-primary-rgb`, `color-primary-ink-rgb`, `color-ink-rgb`) are not colours this system can store. They are built into each theme's shadows instead.
- Only the Latin subset of each font is included. The Latin Extended and Devanagari subsets are left out.
- The `.kid-tile-idle`, `.count-glyph`, `.kid-num-3d` and `.tinku-ground` effects and the keyframes are described above but not exported as tokens.
- No components have been built yet. They are listed above from `src/components`, and live previews can be added on request.
