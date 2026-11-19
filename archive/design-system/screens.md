# Screens

Real captures from the built app at 390×844, with reduced motion on. They are in `design-handoff/screenshots/`. Use them as a reference for the current design, and improve on them rather than copying them exactly.

| Screenshot | Screen | What it shows |
|---|---|---|
| `01-grade-picker` | First-run grade picker | Class 1, Class 2, and Class 3 (coming soon, disabled). **Known bug:** the content stops halfway and white fills the bottom. This is the top target for a redesign. |
| `02-home-path-fresh` | Home: the journey path | Nothing played yet. "Tinku suggests!" is on the first node, with Tinku standing beside it. |
| `03-home-path-progress` | Home with some progress | An amber mastered ring and pips, an indigo 3-pip skill in progress, and a sky ring on the suggested skill. |
| `04-home-cards-progress` | Home: the card list | The alternative home layout (`/?home=cards`), currently being tested with children. |
| `05-home-path-320x568` | Home on the smallest supported phone | |
| `06-quiz-count-question` | Quiz: counting objects | Tinku thinking, the prompt, a tray of emoji objects, and 4 answer tiles. |
| `06-quiz-compare-question` | Quiz: comparing | `6 ? 16` with a dashed blank and three answers: <, = and >. |
| `06-quiz-add-question` | Quiz: multiple choice (addition) | The equation in the `question` style. |
| `07-quiz-after-first-tap`, `08-quiz-hint-or-reveal` | A wrong answer, then a hint | A coral tile, Tinku shrinking into the encourage pose, and a sky speech bubble. |
| `09-celebration` | End of session | 8 stars (filled ones are correct answers), a "Play again" CTA, and "Pick another skill" as a link. |
| `10-parent-dashboard-top`, `11-parent-dashboard-full` | Parent dashboard | The gold mastered card, a sky "working on" strip, the grouped skill list, and the test panel. |
| `12-parent-gate-set-passcode` | Parent gate, set-PIN mode | |
| `13-theme-sunset-home`, `13-theme-bubblegum-home`, `13-theme-deepsea-home` | The alternate palettes on Home | |
| `14-privacy-page` | Static privacy policy page | |

**Not captured, described only:**

- The parent gate's verify and forgot-passcode modes.
- The Warm-up and Bonus quiz stages, where a label replaces "n / 8" in the top bar.
- The offline banner: a sky strip with a small Tinku.
- The amber mastery-up beat on the celebration screen.
- The green correct-tile state.
- A hint on a compare question.

**Navigation:** Grade picker (once) → Home → Quiz (8 questions) → Celebration → Home. From Home, the Parent tab opens the PIN gate and then the dashboard. The bottom nav has only Home and Parent.

**Weaknesses a redesign could fix:**

- On tall phones there is a gap between the prompt and the answer tiles.
- Emoji look different on different phones.
- The celebration screen gives no context and no "next up".
- The parent dashboard is one long column that mixes parent content with test controls.
- There are no Tinku illustrations for loading or error states.
- The dark **Explorer** theme for Grades 4–5 hasn't been designed yet.

**Out of scope:** accounts, paywalls, subscriptions, profiles, sharing, leaderboards, streaks and XP. Progress is shown only by mastery pips, by design.
