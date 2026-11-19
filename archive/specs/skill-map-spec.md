# Skill Map Specification — Grades 1–2 Math (T61)

> **Third Update (2026-11-18 — All 36 Skills `ready`, Archetype UI, Global Currency & Variety/Parity):**
> 1. **All 36 of 36 skills are now `status: 'ready'` (`PR #76` `a3203a1`):** Every Grade 1 (19 skills) and Grade 2 (17 skills) recipe is built, wired into `sessionLite.js`, and validated by `validator.test.js` (`135/135` tests green).
> 2. **Skill-Level Spacing Profiles & 4 `QuestionView` Archetypes (`PR #79` `6cdc002`):** Each skill in `src/recipes/skillMap.js` declares `layoutProfile: 'roomy' | 'story' | 'stage'`, pairing with the 4 visual archetypes (`equation`, `strip`, `story`, `stage`) in `src/components/QuestionView.jsx`.
> 3. **Global Currency-Neutral Money (`🪙`) & Dual `Grade N (Class N)` Labels (`PR #80` `f4cbcd2`):** `g1.money.coins` (`Count the Coins`) and `g2.money.amounts` (`Shopping Maths`) use currency-neutral `🪙` coin/money values rather than `₹`/rupees so the Android app works worldwide without regional bias.
> 4. **8-Question Session Variety Guard (`validateSessionVariety`) & Cross-Skill Difficulty Parity (`PR #81` `622d37e`):** Every skill and difficulty rung is guarded to generate `>= 8` distinct question prompts (in practice `13–60+` per rung). `subtraction2d.js` and `addition2d.js` (`g2.add.2d-carry`) use progressive strategy rungs (`2d ± 1d` → `2d ± 10s/teens` → `2d ± 2d`), and both Grade 1 (`10..52`) and Grade 2 (`100..160`) follow the cleaned-up pedagogical progression below.
>
> **Second Update (2026-11-16):**
> 1. **Basic Fractions added to Grade 2:** `g2.frac.halves-quarters` (*"Fractions: halves & quarters (1/2, 1/4)"*, strand `fractions`, order `135`, `maxDifficulty: 2`, prereqs `['g1.shapes.2d', 'g2.mul.intro']`, recipe `fractionsBasic`) promoted from `misconceptions-reference.md`'s parked section into the active Grade 2 curriculum per founder decision (DECISIONS 2026-11-16). Total Grade 1–2 curriculum is **36 skills** (**19 Grade 1, 17 Grade 2**).
> 2. **`g1.num.21-99` recipe module separated from `counting.js`:** `g1.num.21-99` maps to `numbers21to99` (format `mcq`) rather than `counting` (`count-objects`, which caps at 15 objects).
> 3. **Complete Second-Pass Syllabus & Recipe Agendas (Tiers 1–3):** Added full question formats, difficulty rungs, curriculum ceilings, validator checks, and canonical misconception tag mappings for all 19 skills below (paired with `misconceptions-reference.md` and `TEACHER-REVIEW.md`).

The curriculum backbone. Defines every **skill** as an atomic unit with a difficulty ceiling, prerequisites, and the recipe that powers it. This is what the session composer reads to decide what to teach, and what the "recipe factory" reads to know which recipes to build.

Mirrors the Learning Path already in the app (Pre-number → Shapes → Numbers 1-9 → Addition → Subtraction → Numbers 10-20 → 21-99 → Measurement → Time & Money) and extends to Grade 2.

---

## What Claude Code should build

Create `src/recipes/skillMap.js` (pure data + small helpers, no UI/Firebase). It exports:

1. **`SKILLS`** — an object keyed by `skillId`, each entry:
```js
{
  id: 'g1.add.within20',
  name: 'Addition within 20',
  grade: 1,
  strand: 'addition',          // grouping for the Adventure Map / Learning Path
  order: 40,                   // sort order within the learning path
  maxDifficulty: 3,            // the ceiling (matches the recipe)
  prereqs: ['g1.add.within10'],// skillIds that must be mastered first
  recipe: 'addition',          // which recipe file powers it (some skills share a recipe with different params later)
  status: 'ready' | 'planned', // 'ready' = recipe exists; 'planned' = recipe to be built
}
```

2. **Helper functions** (pure, tested):
   - `getSkill(id)` → the skill or throws
   - `prereqsMet(id, masteryMap)` → boolean (all prereqs at mastery level ≥ threshold)
   - `unlockedSkills(masteryMap)` → skills whose prereqs are met and not yet mastered
   - `frontierSkill(masteryMap, grade)` → the lowest-order unlocked, not-mastered skill for that grade
   - `nextSkills(id)` → skills that list `id` as a prereq (for "what's next" UI)

3. A tiny test (`skillMap.test.js`): the graph is valid — every `prereqs` entry exists in SKILLS, no cycles, every `recipe` referenced is either an existing recipe file or marked `status:'planned'`, orders are unique within a grade.

> Note: only `addition` and `counting` recipes exist today. Mark every other skill `status: 'planned'` so the map is complete but honest about what's built. The recipe factory then fills the planned ones.

---

## The skills — Grade 1 (All 19 `status: 'ready'`)

Ordered as a smooth pedagogical progression (`orders 10..52`). `maxDifficulty` is the curriculum ceiling for that skill; `profile` is its quiz spacing profile (`roomy`, `story`, `stage`).

| order | id | name | displayName | strand | maxDiff | profile | prereqs | recipe |
|---|---|---|---|---|---|---|---|---|
| 10 | g1.count.1-9 | Counting & numbers 1–9 | Number Party | numbers | 3 | roomy | — | counting |
| 11 | g1.count.1-20 | Counting & numbers up to 20 | Big Number Party | numbers | 3 | roomy | g1.count.1-9 | counting |
| 12 | g1.prenum.compare | Big/small, more/less, tall/short | Bigger or Smaller? | prenumber | 2 | stage | g1.count.1-9 | compare |
| 13 | g1.num.compare20 | Compare numbers up to 20 (>, <, =) | Big or Small? | numbers | 3 | roomy | g1.count.1-20 | compareNumbers |
| 14 | g1.num.ordinal | Ordinal numbers (1st–10th) | First to Tenth! | numbers | 2 | story | g1.count.1-9 | ordinal |
| 20 | g1.add.within10 | Addition within 10 | Add a Little | addition | 3 | roomy | g1.count.1-9 | addition |
| 21 | g1.add.within20 | Addition within 20 | Add it Up! | addition | 3 | roomy | g1.add.within10 | addition |
| 22 | g1.sub.within10 | Subtraction within 10 | Pop the Balloons! | subtraction | 3 | roomy | g1.count.1-9 | subtraction |
| 23 | g1.sub.within20 | Subtraction within 20 | Pop More Balloons! | subtraction | 3 | roomy | g1.sub.within10 | subtraction |
| 30 | g1.num.21-99 | Numbers 21–99 (read, write, count) | Big Numbers 21–99 | numbers | 3 | story | g1.count.1-20 | numbers21to99 |
| 31 | g1.place.tens-ones | Tens & ones (place value intro) | Tens and Ones | placevalue | 3 | story | g1.num.21-99 | placeValue |
| 32 | g1.money.coins | Coins recognition & values (1, 2, 5, 10) | Count the Coins | money | 2 | stage | g1.count.1-20 | moneyCoins |
| 40 | g1.prenum.patterns | Simple patterns (AB, AAB) | What Comes Next? | prenumber | 2 | story | g1.count.1-9 | patterns |
| 41 | g1.prenum.sort | Sorting & classification | Sort & Group | prenumber | 2 | story | g1.count.1-9 | sorting |
| 42 | g1.shapes.2d | 2D shapes (circle, square, triangle, rectangle) | Meet the Shapes | shapes | 2 | stage | g1.count.1-9 | shapes2d |
| 43 | g1.shapes.space | Spatial: inside/outside, near/far, top/bottom | Where Is It? | shapes | 2 | stage | g1.shapes.2d | spatial |
| 50 | g1.measure.length | Length: longer/shorter, non-standard units | How Many Blocks Long? | measurement | 2 | stage | g1.prenum.compare | measureLength |
| 51 | g1.measure.weight | Heavy/light | Heavy or Light? | measurement | 2 | stage | g1.prenum.compare | measureWeight |
| 52 | g1.time.daynight | Day/night, days of week, sequence | Days & Daily Time | time | 2 | story | g1.count.1-9 | timeBasic |

## The skills — Grade 2 (All 17 `status: 'ready'`)

| order | id | name | displayName | strand | maxDiff | profile | prereqs | recipe |
|---|---|---|---|---|---|---|---|---|
| 100 | g2.num.3digit | Numbers up to 999 (read, write, place value) | Hundreds Club | numbers | 3 | story | g1.place.tens-ones | counting3digit |
| 101 | g2.place.hundreds | Hundreds, tens, ones | Hundreds, Tens, Ones | placevalue | 3 | roomy | g2.num.3digit | placeValue3 |
| 102 | g2.num.compare999 | Compare/order numbers to 999 | Which is Bigger? | numbers | 3 | roomy | g2.num.3digit | compareNumbers |
| 110 | g2.add.2d-nocarry | 2-digit addition, no carry | Two-Digit Adds | addition | 3 | roomy | g1.add.within20, g1.place.tens-ones | addition2d |
| 111 | g2.add.2d-carry | 2-digit addition with carry | Carry the Ten | addition | 3 | roomy | g2.add.2d-nocarry | addition2d |
| 120 | g2.sub.2d-noborrow | 2-digit subtraction, no borrow | Two-Digit Take-Away | subtraction | 3 | roomy | g1.sub.within20, g1.place.tens-ones | subtraction2d |
| 121 | g2.sub.2d-borrow | 2-digit subtraction with borrow | Borrow a Ten | subtraction | 3 | roomy | g2.sub.2d-noborrow | subtraction2d |
| 125 | g2.money.amounts | Money: making amounts, simple change | Shopping Maths | money | 3 | story | g1.money.coins, g2.add.2d-carry | moneyAmounts |
| 130 | g2.mul.intro | Multiplication as repeated addition | Groups of Things | multiplication | 2 | roomy | g1.add.within20 | mulIntro |
| 131 | g2.mul.table2 | Table of 2 | Table of 2 | multiplication | 3 | roomy | g2.mul.intro | mulTable |
| 132 | g2.mul.table5 | Table of 5 | Table of 5 | multiplication | 3 | roomy | g2.mul.intro | mulTable |
| 133 | g2.mul.table10 | Table of 10 | Table of 10 | multiplication | 3 | roomy | g2.mul.intro | mulTable |
| 135 | g2.frac.halves-quarters | Fractions: halves & quarters (1/2, 1/4) | Halves and Quarters | fractions | 2 | stage | g1.shapes.2d, g2.mul.intro | fractionsBasic |
| 140 | g2.measure.length-std | Length in standard units (cm, m) | Centimetres & Metres | measurement | 3 | story | g1.measure.length | measureLength |
| 141 | g2.measure.capacity | Capacity (litres) | Jugs and Mugs | measurement | 2 | story | g1.prenum.compare | measureCapacity |
| 150 | g2.time.clock | Reading clock (hour, half-hour) | Read the Clock | time | 3 | stage | g1.time.daynight | timeClock |
| 160 | g2.data.pictograph | Data handling: simple pictographs | Picture Charts | data | 2 | stage | g1.count.1-20 | pictograph |

---

## Notes for implementation

- **Strands** group skills for the Adventure Map / Learning Path UI (e.g. all `addition` skills form one themed track). The app already shows this structure; the `strand` field feeds it.
- **`maxDifficulty` is per-skill** and matches what its recipe must respect. The validator already enforces the ceiling per recipe; the map just declares it.
- **Recipe reuse:** several skills point at the same recipe name (e.g. `counting` serves 1-9 and 1-20; `addition2d` serves no-carry and carry; `measureLength` serves `g1.measure.length` and `g2.measure.length-std`). The recipe factory should build a recipe that handles the skill's range, parameterised — NOT a separate file per skill where one parameterised recipe suffices. Document which skills share a recipe.
- **17 of 36 skills are `status:'ready'` as of 2026-11-16** (Grade 1: 7, Grade 2: 10). The remaining 19 skills (Grade 1: 12, Grade 2: 7) are `status:'planned'` and specified in the Second-Pass Syllabus below.
- **Prerequisite threshold:** "mastered" for unlocking = mastery level ≥ 3 (from the spaced-rep design). A planned skill is locked in the UI until its prereqs are mastered AND its recipe is ready (while the composer skips `planned` prerequisites per DECISIONS 2026-10-19 until those prerequisites are built).
- Keep `skillMap.js` pure data + helpers. No React, no Firebase. Fully testable.

## Build order this enables

1. This skill map — the curriculum blueprint.
2. The **recipe factory**: for each `status:'planned'` skill, build its recipe following `RECIPE_TEMPLATE.md` + `addition.js`, run the validator, flip to `status:'ready'` when green. (This is the bounded, verifiable, repetitive step — ideal for Antigravity or a validator-gated loop.)
3. Then the session composer can read the map + mastery to compose real sessions.

---

## Second Update (2026-11-16) — Complete Syllabus & Recipe Agendas for the 19 Pending Skills

This section specifies the exact question format, difficulty rungs (`1..maxDifficulty`), curriculum ceilings, display metadata, validator answer-derivation rules, and canonical misconception tags (cross-referenced with `misconceptions-reference.md` and `TEACHER-REVIEW.md`) for all **19 pending skills** across Grades 1 and 2.

### Readiness Tier Summary

| Tier | Skills | Count | UI / Format Requirement |
|---|---|---|---|
| **Tier 1 — Immediate Numeric `mcq` Build** | `g1.num.21-99`, `g1.place.tens-ones`, `g2.place.hundreds`, `g2.money.amounts` | **4** | Uses existing 4-option numeric `mcq` in `QuestionView.jsx` + `_plausibility.js`. Zero UI or format changes needed. Retires the DECISIONS 2026-10-19 interim composer patch. |
| **Tier 2 — Text / Sequence / Standard-Measurement `mcq`** | `g1.num.ordinal`, `g1.time.daynight`, `g1.prenum.patterns`, `g1.prenum.sort`, `g2.measure.length-std` | **5** | Uses `mcq` (extending `FORMAT_SPEC.mcq` in `validator.test.js` to accept homogeneous `number[]` or `string[]` options). No custom SVG art required. |
| **Tier 3 — Visual / SVG Tray Skills** | `g1.prenum.compare`, `g1.shapes.2d`, `g1.shapes.space`, `g1.measure.length`, `g1.measure.weight`, `g1.money.coins`, `g2.measure.capacity`, `g2.time.clock`, `g2.data.pictograph`, `g2.frac.halves-quarters` | **10** | Uses compact, deterministic SVG/emoji `render` trays in `QuestionView.jsx` sized via `.quiz-stage` CSS variables. |

---

### TIER 1: Immediate Numeric `mcq` Skills (4 skills)

#### 1. `g1.num.21-99` — Numbers 21–99 (read, write, count)
- **Grade / Strand / Order / MaxDiff:** Grade 1 · `numbers` · `60` · `maxDifficulty: 3` · Prereqs: `['g1.count.1-20']`
- **Recipe Module:** `src/recipes/numbers21to99.js` (`recipe: 'numbers21to99'`)
- **Display Extras:** `{ displayName: 'Big Numbers 21–99', subtitle: 'Count and read to 99', icon: '💯' }`
- **Format:** `mcq` (4 numeric options)
- **Rungs & Ceilings:**
  - Prompt: `"Count on: {n - 1}, {n}, ?"` (or `"What comes right after {n}?"`), `correctAnswer = n + 1`.
  - **Rung 1 (cap 50):** `n` in `20..48` (`n % 10 !== 9`, within-decade counting).
  - **Rung 2 (cap 80):** `n` in `20..79` (50% chance of decade boundary `n % 10 === 9`, e.g. `29 → 30`, `49 → 50`).
  - **Rung 3 (cap 99):** `n` in `20..98` (60% chance of decade boundary `n % 10 === 9`, e.g. `59 → 60`, `89 → 90`).
- **Canonical Tags (`misconceptions-reference.md`):** `decade-transition-stall`, `decade-ten-overshoot`, `before-instead-of-after`, `place-value-swap`, `off-by-one`, `random-slip`.
- **Validator `expectedAnswerFor`:** `numbersIn(q.questionText).at(-1) + 1`.

#### 2. `g1.place.tens-ones` — Tens & ones (place value intro)
- **Grade / Strand / Order / MaxDiff:** Grade 1 · `placevalue` · `61` · `maxDifficulty: 3` · Prereqs: `['g1.num.21-99']`
- **Recipe Module:** `src/recipes/placeValue.js` (`recipe: 'placeValue'`)
- **Display Extras:** `{ displayName: 'Tens and Ones', subtitle: 'Bundles of ten', icon: '🧱' }`
- **Format:** `mcq` (4 numeric options)
- **Rungs & Ceilings:**
  - Prompt: `"{t} ten(s) and {o} one(s) make ?"`, `correctAnswer = t * 10 + o`.
  - **Rung 1 (cap 39):** `t` in `1..3`, `o` in `1..9`.
  - **Rung 2 (cap 69):** `t` in `1..6`, `o` in `0..9`.
  - **Rung 3 (cap 99):** `t` in `2..9`, `o` in `0..9` (30% chance `o === 0` for exact decades).
- **Canonical Tags (`misconceptions-reference.md`):** `separate-digit-reading`, `digit-reversal`, `expanded-addition`, `tens-only-counted`, `random-slip`.
- **Validator `expectedAnswerFor`:** `const [t, o] = numbersIn(q.questionText); return t * 10 + o;`.

#### 3. `g2.place.hundreds` — Hundreds, tens, ones
- **Grade / Strand / Order / MaxDiff:** Grade 2 · `placevalue` · `101` · `maxDifficulty: 3` · Prereqs: `['g2.num.3digit']`
- **Recipe Module:** `src/recipes/placeValue3.js` (`recipe: 'placeValue3'`)
- **Display Extras:** `{ displayName: 'Hundreds, Tens, Ones', subtitle: 'Expanded form to 999', icon: '🏛️' }`
- **Format:** `mcq` (4 numeric options)
- **Rungs & Ceilings:**
  - Prompt: Expanded-form composition `"What is {h * 100} + {t * 10} + {o}?"` (or `"What is {h * 100} + {o}?"` when `t === 0`), `correctAnswer = h * 100 + t * 10 + o` (distinct from `g2.num.3digit`'s word-place prompt).
  - **Rung 1 (cap 299):** `h` in `1..2`, `t` in `1..9`, `o` in `1..9` (all 3 columns non-zero).
  - **Rung 2 (cap 599):** `h` in `1..5`, 40% chance of a zero tens or ones column (`300 + 8 = ?` or `300 + 40 = ?`).
  - **Rung 3 (cap 999):** `h` in `2..9`, 50% chance of a zero column (`700 + 6 = ?`).
- **Canonical Tags (`misconceptions-reference.md`):** `zero-placeholder-ignored`, `digit-value-blindness`, `reverse-period-reading`, `place-column-shift`, `random-slip`.
- **Validator `expectedAnswerFor`:** `numbersIn(q.questionText).reduce((sum, n) => sum + n, 0)`.

#### 4. `g2.money.amounts` — Money: making amounts, simple change
- **Grade / Strand / Order / MaxDiff:** Grade 2 · `money` · `160` · `maxDifficulty: 3` · Prereqs: `['g1.money.coins', 'g2.add.2d-carry']`
- **Recipe Module:** `src/recipes/moneyAmounts.js` (`recipe: 'moneyAmounts'`)
- **Display Extras:** `{ displayName: 'Shopping Maths', subtitle: 'Add ₹ and find change', icon: '🛍️' }`
- **Format:** `mcq` (4 numeric options, whole rupees)
- **Rungs & Ceilings:**
  - **Rung 1 (cap 50):** Combining rupee notes/coins: `"₹{a} + ₹{b} = ₹?"` (`a` in `{10, 20, 30}`, `b` in `{5, 10, 15, 20}`).
  - **Rung 2 (cap 50):** Change from ₹20/₹50: `"Have ₹{paid}, spend ₹{cost}. ₹ left = ?"` (`paid` in `{20, 30, 50}`, `cost` with non-zero ones).
  - **Rung 3 (cap 100):** Change from ₹100: `"Have ₹100, spend ₹{cost}. ₹ left = ?"` (`cost` in `15..85`, `cost % 10 !== 0`).
- **Canonical Tags (`misconceptions-reference.md`):** `smaller-from-larger-force-money`, `ten-across-zero-borrow`, `operator-mixup`, `off-by-one`, `random-slip`.
- **Validator `expectedAnswerFor`:** `const [a, b] = numbersIn(q.questionText); return q.questionText.includes('+') ? a + b : a - b;`.

---

### TIER 2: Text / Sequence / Standard-Measurement `mcq` Skills (5 skills)

#### 5. `g1.num.ordinal` — Ordinal numbers (1st–10th)
- **Grade / Strand / Order / MaxDiff:** Grade 1 · `numbers` · `33` · `maxDifficulty: 2` · Prereqs: `['g1.count.1-9']`
- **Recipe Module:** `src/recipes/ordinal.js` (`recipe: 'ordinal'`)
- **Display Extras:** `{ displayName: 'First to Tenth!', subtitle: 'Positions in a line', icon: '🏅' }`
- **Format:** `mcq` (4 ordinal string options `'1st'..'10th'` or numeric `1..10`, plus `render: { items: string[], target: string }` or inline emoji row)
- **Rungs & Ceilings:**
  - **Rung 1 (cap 5):** Line of `N = 5` distinct items; asks position `1st–5th` from the left.
  - **Rung 2 (cap 10):** Line of `N = 7..10` distinct items; asks position `1st–10th` from the left.
- **Canonical Tags (`misconceptions-reference.md`):** `cardinal-confusion` (guard `p < N`), `right-to-left-start` (guard `2 * p !== N + 1`), `off-by-one`, `random-slip`.

#### 6. `g1.time.daynight` — Day/night, days of week, sequence
- **Grade / Strand / Order / MaxDiff:** Grade 1 · `time` · `80` · `maxDifficulty: 2` · Prereqs: `[]`
- **Recipe Module:** `src/recipes/timeBasic.js` (`recipe: 'timeBasic'`)
- **Display Extras:** `{ displayName: 'Days & Daily Time', subtitle: 'Days of the week', icon: '🌤️' }`
- **Format:** `mcq` (4 string options)
- **Rungs & Ceilings:**
  - **Rung 1:** Daily cycle (`Morning` → `Afternoon` → `Evening` → `Night`) and `"What day comes right AFTER {Day}?"` (Monday–Friday).
  - **Rung 2:** `"What day comes right BEFORE {Day}?"` and weekend wrap-around (`Sunday` ↔ `Monday`).
- **Canonical Tags (`misconceptions-reference.md`):** `before-after-reversal`, `sequence-off-by-one`, `cycle-wrap-error`, `random-slip`.

#### 7. `g1.prenum.patterns` — Simple patterns (AB, AAB)
- **Grade / Strand / Order / MaxDiff:** Grade 1 · `prenumber` · `12` · `maxDifficulty: 2` · Prereqs: `[]`
- **Recipe Module:** `src/recipes/patterns.js` (`recipe: 'patterns'`)
- **Display Extras:** `{ displayName: 'What Comes Next?', subtitle: 'Fun patterns', icon: '🎨' }`
- **Format:** `mcq` (4 glyph/string options)
- **Rungs & Ceilings:**
  - **Rung 1:** 2-element alternating `ABAB?` and `ABABA?` patterns.
  - **Rung 2:** 3-step `AABAAB?`, `ABBABB?`, and `ABCABC?` patterns.
- **Canonical Tags (`misconceptions-reference.md`):** `last-item-echo`, `ab-assumed-on-aab`, `first-item-restart`, `random-slip`.

#### 8. `g1.prenum.sort` — Sorting & classification
- **Grade / Strand / Order / MaxDiff:** Grade 1 · `prenumber` · `11` · `maxDifficulty: 2` · Prereqs: `[]`
- **Recipe Module:** `src/recipes/sorting.js` (`recipe: 'sorting'`)
- **Display Extras:** `{ displayName: 'Sort & Group', subtitle: 'Find what belongs', icon: '🧺' }`
- **Format:** `mcq` (4 glyph/word options)
- **Rungs & Ceilings:**
  - **Rung 1:** *"Which one does NOT belong?"* (3 items from one category + 1 odd item out across fruits, animals, vehicles, shapes).
  - **Rung 2:** *"Which one belongs in the same group as {A, B, C}?"* (category matching with surface-colour distractors).
- **Canonical Tags (`misconceptions-reference.md`):** `odd-one-out-inversion`, `surface-feature-distraction`, `random-slip`.

#### 9. `g2.measure.length-std` — Length in standard units (cm, m)
- **Grade / Strand / Order / MaxDiff:** Grade 2 · `measurement` · `140` · `maxDifficulty: 3` · Prereqs: `['g1.measure.length']`
- **Recipe Module:** `src/recipes/measureLength.js` (`skillIds: ['g1.measure.length', 'g2.measure.length-std']`)
- **Display Extras:** `{ displayName: 'Centimetres & Metres', subtitle: 'Measure with a ruler', icon: '📏' }`
- **Format:** `mcq` (4 numeric options)
- **Rungs & Ceilings:**
  - **Rung 1 (cap 15):** Zero-aligned ruler reading (`"Starts at 0 cm, ends at {L} cm. Length = ? cm"` → `L`).
  - **Rung 2 (cap 30):** Offset ruler reading (`"Starts at {s} cm, ends at {e} cm. Length = ? cm"` → `e - s`, `s > 0`).
  - **Rung 3 (cap 99):** Standard length addition (`"{a} cm + {b} cm = ? cm"` or `"{a} m + {b} m = ? m"`).
- **Canonical Tags (`misconceptions-reference.md`):** `ruler-one-start-error`, `end-mark-only-read`, `operator-mixup`, `off-by-one`, `random-slip`.

---

### TIER 3: Visual / SVG Tray Skills (10 skills)

#### 10. `g1.prenum.compare` — Big/small, more/less, tall/short
- **Grade / Strand / Order / MaxDiff:** Grade 1 · `prenumber` · `10` · `maxDifficulty: 2` · Prereqs: `[]`
- **Recipe Module:** `src/recipes/prenumCompare.js` (`recipe: 'compare'`)
- **Display Extras:** `{ displayName: 'Bigger or Smaller?', subtitle: 'More, less, tall, short', icon: '🐘' }`
- **Format & Visual:** `mcq` or `group-compare` (`render: { leftGroup, rightGroup, attribute: 'more'|'fewer'|'taller'|'shorter' }`).
- **Rungs:** Rung 1: large count/size gap (`2 vs 6`); Rung 2: gap of 1 (`5 vs 6`) or size-vs-count conservation (`3 big elephants vs 5 small ants`).
- **Canonical Tags (`misconceptions-reference.md`):** `opposite-attribute-confusion`, `quantity-size-illusion`, `off-by-one`, `random-slip`.

#### 11. `g1.shapes.2d` — 2D shapes (circle, square, triangle, rectangle)
- **Grade / Strand / Order / MaxDiff:** Grade 1 · `shapes` · `20` · `maxDifficulty: 2` · Prereqs: `[]`
- **Recipe Module:** `src/recipes/shapes2d.js` (`recipe: 'shapes2d'`)
- **Display Extras:** `{ displayName: 'Meet the Shapes', subtitle: 'Circle, square, triangle, rectangle', icon: '🔺' }`
- **Format & Visual:** `shape-mcq` (`render: { shape: 'circle'|'square'|'triangle'|'rectangle', rotated: boolean }`).
- **Rungs:** Rung 1: standard-orientation shape naming and side/corner counts; Rung 2: rotated shapes (45°-tilted square/triangle) and equal-side properties.
- **Canonical Tags (`misconceptions-reference.md`):** `rotation-blindness`, `square-rectangle-confusion`, `side-corner-count-slip`, `curved-straight-mixup`, `random-slip`.

#### 12. `g1.shapes.space` — Spatial: inside/outside, near/far, top/bottom
- **Grade / Strand / Order / MaxDiff:** Grade 1 · `shapes` · `21` · `maxDifficulty: 2` · Prereqs: `[]`
- **Recipe Module:** `src/recipes/spatial.js` (`recipe: 'spatial'`)
- **Display Extras:** `{ displayName: 'Where Is It?', subtitle: 'Inside, outside, top, bottom', icon: '📦' }`
- **Format & Visual:** `spatial-mcq` (`render: { relation: 'inside'|'outside'|'top'|'bottom'|'near'|'far', itemGlyph, anchorGlyph }`).
- **Rungs:** Rung 1: `inside/outside` and `top/bottom`; Rung 2: `near/far` and `above/below` with 2 candidate items.
- **Canonical Tags (`misconceptions-reference.md`):** `opposite-spatial-term`, `vertical-horizontal-confusion`, `reference-anchor-swap`, `random-slip`.

#### 13. `g1.measure.length` — Length: longer/shorter, non-standard units
- **Grade / Strand / Order / MaxDiff:** Grade 1 · `measurement` · `70` · `maxDifficulty: 2` · Prereqs: `['g1.prenum.compare']`
- **Recipe Module:** `src/recipes/measureLength.js` (`skillIds: ['g1.measure.length', 'g2.measure.length-std']`)
- **Display Extras:** `{ displayName: 'How Many Blocks Long?', subtitle: 'Measure with blocks & spans', icon: '📏' }`
- **Format & Visual:** `unit-length` (`render: { objectLabel, unitGlyph: '🟦', count: L }`), 4 numeric options.
- **Rungs:** Rung 1 (cap 5): `2..5` unit blocks; Rung 2 (cap 9): `4..9` unit blocks or difference between two block-measured items.
- **Canonical Tags (`misconceptions-reference.md`):** `count-marks-not-units`, `skip-count-sequence`, `operator-mixup`, `random-slip`.

#### 14. `g1.measure.weight` — Heavy/light
- **Grade / Strand / Order / MaxDiff:** Grade 1 · `measurement` · `71` · `maxDifficulty: 2` · Prereqs: `['g1.prenum.compare']`
- **Recipe Module:** `src/recipes/measureWeight.js` (`recipe: 'measureWeight'`)
- **Display Extras:** `{ displayName: 'Heavy or Light?', subtitle: 'Balance scale fun', icon: '⚖️' }`
- **Format & Visual:** `balance-mcq` (`render: { leftItem, rightItem, heavier: 'left'|'right', unitCount?: number }`).
- **Rungs:** Rung 1: direct pan-balance reading (which side is heavier/lighter); Rung 2: non-standard block weight on a balance (`"1 mango balances {N} blocks"`).
- **Canonical Tags (`misconceptions-reference.md`):** `up-pan-is-heavier`, `size-weight-illusion`, `opposite-attribute-confusion`, `off-by-one`, `random-slip`.

#### 15. `g1.money.coins` — Indian coins recognition (₹1, ₹2, ₹5, ₹10)
- **Grade / Strand / Order / MaxDiff:** Grade 1 · `money` · `81` · `maxDifficulty: 2` · Prereqs: `['g1.count.1-20']`
- **Recipe Module:** `src/recipes/moneyCoins.js` (`recipe: 'moneyCoins'`)
- **Display Extras:** `{ displayName: 'Indian Coins', subtitle: '₹1, ₹2, ₹5 and ₹10 coins', icon: '🪙' }`
- **Format & Visual:** `coins-mcq` (`render: { coins: (1|2|5|10)[] }`), 4 numeric options.
- **Rungs:** Rung 1 (cap 10): single coin recognition or 2–3 identical `₹1`/`₹2` coins; Rung 2 (cap 20): summing 2–3 mixed coins (`₹5 + ₹2 + ₹1 = ₹8`).
- **Canonical Tags (`misconceptions-reference.md`):** `size-value-bias`, `coin-count-as-value`, `sum-as-concatenation`, `off-by-one`, `random-slip`.

#### 16. `g2.measure.capacity` — Capacity (litres)
- **Grade / Strand / Order / MaxDiff:** Grade 2 · `measurement` · `141` · `maxDifficulty: 2` · Prereqs: `['g1.prenum.compare']`
- **Recipe Module:** `src/recipes/measureCapacity.js` (`recipe: 'measureCapacity'`)
- **Display Extras:** `{ displayName: 'Jugs and Mugs', subtitle: 'Litres and capacity', icon: '🫗' }`
- **Format:** `mcq` (4 numeric options, with optional vessel `render` payload).
- **Rungs:** Rung 1 (cap 20): combining vessels in litres or filling `m` jugs of `k` cups each; Rung 2 (cap 50): comparing two tanks/buckets in litres (`a - b`).
- **Canonical Tags (`misconceptions-reference.md`):** `container-count-confusion`, `tall-thin-illusion`, `operator-mixup`, `off-by-one`, `random-slip`.

#### 17. `g2.time.clock` — Reading clock (hour, half-hour)
- **Grade / Strand / Order / MaxDiff:** Grade 2 · `time` · `150` · `maxDifficulty: 3` · Prereqs: `['g1.time.daynight']`
- **Recipe Module:** `src/recipes/timeClock.js` (`recipe: 'timeClock'`)
- **Display Extras:** `{ displayName: 'Read the Clock', subtitle: 'Hours and half-hours', icon: '🕒' }`
- **Format & Visual:** `clock` (`render: { hours: 1..12, minutes: 0 | 30 }`), 4 string options (`"3:00"`, `"3:30"`).
- **Rungs:** Rung 1: full hours (`:00`); Rung 2: half-hours (`:30`); Rung 3: mixed `:00`/`:30` + `"What time will it be 1 hour later?"`.
- **Canonical Tags (`misconceptions-reference.md`):** `hand-size-reversal` (guard: skip `12:00` and `6:30`), `hour-hand-proximity`, `minute-numeric-literal`, `half-hour-as-fifty`, `off-by-one-hour`, `random-slip`.

#### 18. `g2.data.pictograph` — Data handling: simple pictographs
- **Grade / Strand / Order / MaxDiff:** Grade 2 · `data` · `170` · `maxDifficulty: 2` · Prereqs: `['g1.count.1-20']`
- **Recipe Module:** `src/recipes/pictograph.js` (`recipe: 'pictograph'`)
- **Display Extras:** `{ displayName: 'Picture Charts', subtitle: 'Read fun pictographs', icon: '📊' }`
- **Format & Visual:** `pictograph` (`render: { rows: { label: string, glyph: string, count: number }[], scale: 1 | 2 }`), 4 numeric options.
- **Rungs:** Rung 1 (cap 12): scale `1 symbol = 1 item`, direct row count and two-row sum; Rung 2 (cap 20): `"How many more {A} than {B}?"` and scale `1 symbol = 2 items`.
- **Canonical Tags (`misconceptions-reference.md`):** `adjacent-row-read`, `total-instead-of-difference`, `scale-factor-ignored`, `off-by-one`, `random-slip`.

#### 19. `g2.frac.halves-quarters` — Fractions: halves & quarters (1/2, 1/4) *(added 2026-11-16)*
- **Grade / Strand / Order / MaxDiff:** Grade 2 · `fractions` · `175` · `maxDifficulty: 2` · Prereqs: `['g1.shapes.2d']`
- **Recipe Module:** `src/recipes/fractionsBasic.js` (`recipe: 'fractionsBasic'`)
- **Display Extras:** `{ displayName: 'Halves and Quarters', subtitle: 'Equal parts: 1/2 and 1/4', icon: '🍕' }`
- **Format & Visual:** `fraction-mcq` (`render: { totalParts: 2 | 4, shadedParts: 1 | 2 | 3, equalParts: boolean }` or comparing unit fractions `'1/2'` vs `'1/4'`), 4 string options (`'1/2'`, `'1/4'`, `'3/4'`, `'1/3'` or `'2/4'`).
- **Rungs & Ceilings:**
  - **Rung 1:** Identifying `1/2` (1 of 2 equal parts) and `1/4` (1 of 4 equal parts) of a shape/roti/pizza, and counting how many halves (`2`) or quarters (`4`) make 1 whole.
  - **Rung 2:** Identifying `3/4` (3 of 4 equal parts), comparing unit fractions (`"Which piece of roti is BIGGER: 1/2 or 1/4?"` → `'1/2'`), and half of a small even count (`"What is half of {2n}?"` for `2n` in `2..12`).
- **Canonical Tags (`misconceptions-reference.md`):** `denominator-magnitude-bias`, `shaded-to-unshaded-ratio`, `unshaded-complement-picked`, `double-instead-of-half`, `random-slip`.

