# Skill Map Specification — Grades 1–2 CBSE Math (T61)

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

## The skills — Grade 1

Ordered as a learning path. `maxDifficulty` is the curriculum ceiling for that skill (harder = a different, later skill).

| order | id | name | strand | maxDiff | prereqs | recipe |
|---|---|---|---|---|---|---|
| 10 | g1.prenum.compare | Big/small, more/less, tall/short | prenumber | 2 | — | compare |
| 11 | g1.prenum.sort | Sorting & classification | prenumber | 2 | — | sorting |
| 12 | g1.prenum.patterns | Simple patterns (AB, AAB) | prenumber | 2 | — | patterns |
| 20 | g1.shapes.2d | 2D shapes (circle, square, triangle, rectangle) | shapes | 2 | — | shapes2d |
| 21 | g1.shapes.space | Spatial: inside/outside, near/far, top/bottom | shapes | 2 | — | spatial |
| 30 | g1.count.1-9 | Counting & numbers 1–9 | numbers | 3 | — | counting |
| 31 | g1.count.1-20 | Counting & numbers up to 20 | numbers | 3 | g1.count.1-9 | counting |
| 32 | g1.num.compare20 | Compare numbers up to 20 (>, <, =) | numbers | 3 | g1.count.1-20 | compareNumbers |
| 33 | g1.num.ordinal | Ordinal numbers (1st–10th) | numbers | 2 | g1.count.1-9 | ordinal |
| 40 | g1.add.within10 | Addition within 10 | addition | 3 | g1.count.1-9 | addition |
| 41 | g1.add.within20 | Addition within 20 | addition | 3 | g1.add.within10 | addition |
| 50 | g1.sub.within10 | Subtraction within 10 | subtraction | 3 | g1.count.1-9 | subtraction |
| 51 | g1.sub.within20 | Subtraction within 20 | subtraction | 3 | g1.sub.within10 | subtraction |
| 60 | g1.num.21-99 | Numbers 21–99 (read, write, count) | numbers | 3 | g1.count.1-20 | counting |
| 61 | g1.place.tens-ones | Tens & ones (place value intro) | placevalue | 3 | g1.num.21-99 | placeValue |
| 70 | g1.measure.length | Length: longer/shorter, non-standard units | measurement | 2 | g1.prenum.compare | measureLength |
| 71 | g1.measure.weight | Heavy/light | measurement | 2 | g1.prenum.compare | measureWeight |
| 80 | g1.time.daynight | Day/night, days of week, sequence | time | 2 | — | timeBasic |
| 81 | g1.money.coins | Indian coins recognition (₹1, ₹2, ₹5, ₹10) | money | 2 | g1.count.1-20 | moneyCoins |

## The skills — Grade 2

| order | id | name | strand | maxDiff | prereqs | recipe |
|---|---|---|---|---|---|---|
| 100 | g2.num.3digit | Numbers up to 999 (read, write, place value) | numbers | 3 | g1.place.tens-ones | counting3digit |
| 101 | g2.place.hundreds | Hundreds, tens, ones | placevalue | 3 | g2.num.3digit | placeValue3 |
| 102 | g2.num.compare999 | Compare/order numbers to 999 | numbers | 3 | g2.num.3digit | compareNumbers |
| 110 | g2.add.2d-nocarry | 2-digit addition, no carry | addition | 3 | g1.add.within20, g1.place.tens-ones | addition2d |
| 111 | g2.add.2d-carry | 2-digit addition with carry | addition | 3 | g2.add.2d-nocarry | addition2d |
| 120 | g2.sub.2d-noborrow | 2-digit subtraction, no borrow | subtraction | 3 | g1.sub.within20, g1.place.tens-ones | subtraction2d |
| 121 | g2.sub.2d-borrow | 2-digit subtraction with borrow | subtraction | 3 | g2.sub.2d-noborrow | subtraction2d |
| 130 | g2.mul.intro | Multiplication as repeated addition | multiplication | 2 | g1.add.within20 | mulIntro |
| 131 | g2.mul.table2 | Table of 2 | multiplication | 3 | g2.mul.intro | mulTable |
| 132 | g2.mul.table5 | Table of 5 | multiplication | 3 | g2.mul.intro | mulTable |
| 133 | g2.mul.table10 | Table of 10 | multiplication | 3 | g2.mul.intro | mulTable |
| 140 | g2.measure.length-std | Length in standard units (cm, m) | measurement | 3 | g1.measure.length | measureLength |
| 141 | g2.measure.capacity | Capacity (litres) | measurement | 2 | g1.prenum.compare | measureCapacity |
| 150 | g2.time.clock | Reading clock (hour, half-hour) | time | 3 | g1.time.daynight | timeClock |
| 160 | g2.money.amounts | Money: making amounts, simple change | money | 3 | g1.money.coins, g2.add.2d-carry | moneyAmounts |
| 170 | g2.data.pictograph | Data handling: simple pictographs | data | 2 | g1.count.1-20 | pictograph |

---

## Notes for implementation

- **Strands** group skills for the Adventure Map / Learning Path UI (e.g. all `addition` skills form one themed track). The app already shows this structure; the `strand` field feeds it.
- **`maxDifficulty` is per-skill** and matches what its recipe must respect. The validator already enforces the ceiling per recipe; the map just declares it.
- **Recipe reuse:** several skills point at the same recipe name (e.g. `counting` serves 1-9, 1-20, 21-99 via difficulty/params; `addition2d` serves no-carry and carry). The recipe factory should build a recipe that handles the skill's range, parameterised — NOT a separate file per skill where one parameterised recipe suffices. Document which skills share a recipe.
- **Only `counting` and `addition` are `status:'ready'`** today. Everything else is `status:'planned'`. This makes the map complete (the whole curriculum is visible) while honest (the app only serves ready skills until the factory fills the rest).
- **Prerequisite threshold:** "mastered" for unlocking = mastery level ≥ 3 (from the spaced-rep design). A planned skill is locked in the UI until its prereqs are mastered AND its recipe is ready.
- Keep `skillMap.js` pure data + helpers. No React, no Firebase. Fully testable.

## Build order this enables

1. This skill map (now) — the curriculum blueprint.
2. The **recipe factory**: for each `status:'planned'` skill, build its recipe following `RECIPE_TEMPLATE.md` + `addition.js`, run the validator, flip to `status:'ready'` when green. (This is the bounded, verifiable, repetitive step — ideal for Antigravity or a validator-gated loop.)
3. Then the session composer can read the map + mastery to compose real sessions.
