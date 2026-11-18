# TEACHER-REVIEW.md — Items needing human primary-math teacher sign-off

The running list of curriculum/pedagogy items that need a **human** primary-math teacher to
review. `misconceptions-reference.md` is the canonical tag source, but parts
of it were reconstructed or authored by LLMs (see `claude-chat/archive/llm-review.md` and the
**2026-11-16 Second Update** below) — a teacher must confirm them.

> **Second Update (2026-11-16):** Audited all remaining 19 `status: 'planned'` skills across
> Grades 1–2 (including `g2.frac.halves-quarters`, added to Grade 2 on 2026-11-16). Added
> items **☐ 5 – ☐ 15** below covering formula collisions, unguarded correct-answer collisions,
> curriculum prompt overlaps, and newly authored misconception tables in `misconceptions-reference.md`.

> How to use: a teacher works through the open items, records the decision, and we then update
> `misconceptions-reference.md` (the source of truth) and any affected recipe + the validator's
> canonical-tag set in one change. Keep this list in sync — close items when signed off.

Legend: ☐ open · ☑ signed off

---

## Open items (First Pass)

### ☐ 1. `regroup-ignored` — invalid reconstructed rule (Subtraction within 20)
- **Problem:** the doc's rule `10 + (ones(a) − b)` for a borrow problem collapses to the
  **correct answer** (e.g. `13 − 5`: `10 + (3 − 5) = 8`, which is exactly `13 − 5`). So it can
  never be a valid distractor as written. The doc example ("13-5 → 18-ish err") doesn't match
  the formula either — the formula was reconstructed from prose and is wrong.
- **Current handling (code):** `subtraction.js` does **not** emit `regroup-ignored`; the
  borrow ones-error is covered by `smaller-from-larger-force` (`10 + |ones(a) − b|`, e.g.
  `13 − 5 → 12`). The tag is intentionally excluded from the validator's canonical-tag set for
  `g1.sub.within20`.
- **Teacher to decide:** either (a) define a *correct, non-colliding* rule for `regroup-ignored`
  (a real borrow error distinct from `smaller-from-larger-force`), or (b) confirm removal of the
  tag. Then update `misconceptions-reference.md` + (if re-added) the recipe + validator set.

### ☐ 2. `g1.num.21-99` — needs misconception tags + a number-recognition format *(drafted in Second Update, 2026-11-16)*
- **Problem:** the skill `g1.num.21-99` ("Numbers 21–99: read, write, count") is `planned`. It
  cannot reuse the `counting` recipe's `count-objects` format (drawing dozens of objects is
  unworkable), and `misconceptions-reference.md` originally had **no 21–99 counting tags**.
- **Second Update (2026-11-16):** `claude-chat/specs/skill-map-spec.md` and `misconceptions-reference.md` now specify recipe `numbers21to99` (format `mcq`, counting-on / next-number prompts across decades `21–99`) with 5 computable tags: `decade-transition-stall` (`29 → 20`), `decade-ten-overshoot` (`29 → 39`), `before-instead-of-after` (`n - 1`), `place-value-swap` (`swapDigits(ans)`), and `off-by-one` (`ans + 1`).
- **Teacher to decide:** confirm the `mcq` next-number/sequence format and the 5 drafted tags + hints in `misconceptions-reference.md` before `numbers21to99.js` is treated as teacher-signed-off.

### ☐ 3. Cross-LLM review changes still need human sign-off
The Review #1 changes in `claude-chat/archive/llm-review.md` were made by a **second LLM, not a teacher**. Each
needs human confirmation:
- **Collision guards** added to palindrome/zero-prone rules (`digit-subtraction-isolation`,
  `reverse-period-reading`, `multiplication-by-zero-identity`) + the global "no distractor equals
  the correct answer" guard. *(Already honoured by all built recipes — confirmed by audit.)*
- **`exponentiation-confusion` removed**, replaced by `skip-count-misstep` (`ans ± a`) for the
  "16 for 4×3" case (G2 multiplication — built).
- **3 place-value hints rewritten** to conceptual "houses/bundles" language
  (`expanded-concatenation`, `separate-digit-reading`, `double-carry`).
- **Parked additions:** fractions (`denominator-magnitude-bias`) and shape orientation
  (`rotation-blindness`) — promoted into Grade 2 (`g2.frac.halves-quarters`) and Grade 1 (`g1.shapes.2d`) in the 2026-11-16 Second Update.

### ☐ 4. `ones-addition-ignored` — new tag, rule not reconstructed but unconfirmed (2-digit addition without carry)
- **Added 2026-09-21**, filling the gap DECISIONS 2026-08-25 named as the top item for this
  review: "added the tens but ignored the ones" (34+24 → 54) had no doc entry despite being a
  real, plausible Grade-2 misconception — now more likely to surface in practice since rung 3
  (2-digit + 2-digit, DECISIONS 2026-08-27) is live.
- **Rule, as written:** `(tens(a)+tens(b))*10 + ones(a)` — tens added correctly, ones copied
  from operand `a` only. Collision-guarded (`ones(b) != 0`). Unlike items 1–3, this rule is
  newly authored, not reconstructed from lost source prose, but it has not been checked against
  a teacher's sense of what a child actually does at this step.
- **Teacher to decide:** does this rule match the real error, or is the more common version
  something else (e.g. copying `b`'s ones instead of `a`'s, or dropping the ones column
  entirely rather than copying either operand's)? Confirm the rule and the hint wording before
  this is trusted as the dominant tagged distractor on that skill's hardest rung.

---

## Second Update (2026-11-16) — Remaining Grades 1–2 Syllabus & Misconception Audit

### ☐ 5. `g1.place.tens-ones` (`placeValue`) — duplicate formula collision (`expanded-addition` vs `unit-counting-only`) + missing palindrome/zero guard on `digit-reversal`
- **Problem A (Formula duplicate):** In `misconceptions-reference.md`, `expanded-addition` (`tensDigit + onesDigit`, e.g. 3 tens 4 ones → 7) and `unit-counting-only` (`tensDigit + onesDigit`, e.g. 3 rods 4 cubes → 7) computed the **exact same number** (`t + o`). On a text `mcq` prompt (`"3 tens and 4 ones make ?"`), generic deduplication always drops the second tag (the same class of bug previously found in `mulIntro.js` and `mulTable.js`).
- **Problem B (Collision with correct answer / other tag):** `digit-reversal` (`swapDigits(value)`) had `condition: always`, which collides with `correctAnswer` on repdigit palindromes (`22, 33, …`) and collides with `expanded-addition` when `ones == 0` (`swapDigits(40) = 4 = 4 + 0`).
- **2026-11-16 Doc Update:** Scoped `unit-counting-only` to visual-block representation, added `tens-only-counted` (`t * 10`, e.g. 3 tens 4 ones → 30) as the 4th text-MCQ tag, and guarded `digit-reversal` with `t != o && o != 0` and `expanded-addition` with `o != 0`.
- **Teacher to decide:** confirm `tens-only-counted` (`t * 10`) and the guards for `g1.place.tens-ones`.

### ☐ 6. `g2.place.hundreds` (`placeValue3`) vs `g2.num.3digit` (`counting3digit`) — prompt differentiation & new misconception table
- **Problem:** `g2.num.3digit` (`counting3digit.js`) already uses `"H hundreds, T tens and O ones make ?"` and consumes the "Numbers up to 999" table. `g2.place.hundreds` ("Hundreds, tens, ones") had no table in `misconceptions-reference.md`.
- **2026-11-16 Doc Update:** Specified `g2.place.hundreds` as expanded-form composition (`"What is 300 + 40 + 5?"` and zero-column cases like `"What is 300 + 8?"`) with 4 computable tags in `misconceptions-reference.md`: `zero-placeholder-ignored` (`h * 10 + o`), `digit-value-blindness` (`h + t + o`), `reverse-period-reading` (`o * 100 + t * 10 + h`, guard `h != o && o > 0`), and `place-column-shift` (`h * 100 + o * 10 + t`, guard `t != o`).
- **Teacher to decide:** confirm expanded-form composition (`300 + 40 + 5 = ?`) vs single-digit value extraction (`"What is the value of 4 in 345?"`) for `g2.place.hundreds`, and sign off on `place-column-shift`.

### ☐ 7. `g1.num.ordinal` (`ordinal`) — two unguarded correct-answer collisions in `misconceptions-reference.md`
- **Problem:**
  1. `cardinal-confusion` (outputs total `N` instead of position `p`, formerly `condition: always`) equals `correctAnswer` whenever the question asks for the last item in the line (`p == N`).
  2. `right-to-left-start` (`(N + 1) - p`, formerly `condition: always`) equals `correctAnswer` whenever `N` is odd and `p` is the middle item (`2 * p == N + 1`, e.g. 3rd of 5 items).
- **2026-11-16 Doc Update:** Added explicit guards `position < N` on `cardinal-confusion` and `2 * position != N + 1` on `right-to-left-start` in `misconceptions-reference.md`.
- **Teacher to decide:** confirm the two collision guards and whether ordinal options should be ordinal strings (`1st..10th`) or numbers (`1..10`).

### ☐ 8. `g2.time.clock` (`timeClock`) — hand-swap collision at `12:00` / `6:30` & missing 3rd distractor on o'clock questions
- **Problem:**
  1. `hand-size-reversal` (swapping hour and minute hands, formerly `condition: always`) produces the **correct answer** at `12:00` (both hands at 12) and `6:30` (both hands at 6).
  2. On full-hour questions (`minutes == 0`), both `hour-hand-proximity` and `half-hour-as-fifty` require `minutes == 30`, leaving only 2 wrong options (`hand-size-reversal` and `minute-numeric-literal`) for a 4-option `mcq`.
- **2026-11-16 Doc Update:** Added guard `!(hour == 12 && minutes == 0) && !(hour == 6 && minutes == 30)` to `hand-size-reversal` and added `off-by-one-hour` (`(hour % 12) + 1`) to `misconceptions-reference.md`.
- **Teacher to decide:** confirm `off-by-one-hour` and the `12:00`/`6:30` guard.

### ☐ 9. `g2.money.amounts` (`moneyAmounts`) — expanded from 1 computable tag to full whole-rupee distractor set
- **Problem:** `misconceptions-reference.md` previously had only 1 computable tag (`smaller-from-larger-force-money`, valid only when subtracting from ₹100/₹50 with zero ones) plus 2 `hint-only` paise-formatting tags, whereas CBSE Class 2 focuses on whole-rupee totals and change.
- **2026-11-16 Doc Update:** Added `ten-across-zero-borrow` (`ans + 10` when borrowing across zero), `operator-mixup` (`a + b` on change subtraction or `|a - b|` on addition), and `off-by-one` (`ans ± 1`) in `misconceptions-reference.md`.
- **Teacher to decide:** confirm the whole-rupee scope (no decimal paise in Class 2) and the 3 added tags.

### ☐ 10. `g1.money.coins` (`moneyCoins`) & `g1.time.daynight` (`timeBasic`) — expanded from single-tag tables
- **Problem:** `g1.money.coins` had only `size-value-bias` and `g1.time.daynight` had only `sequence-off-by-one` (marked `hint-only`), insufficient for 4-option `mcq` generation.
- **2026-11-16 Doc Update:**
  - `g1.money.coins`: added `coin-count-as-value` (counts number of coins `coins.length` instead of summing ₹ values, guard `coins.length != ans`), `sum-as-concatenation` (`₹1 + ₹2 → 12`), and `off-by-one`.
  - `g1.time.daynight`: made `sequence-off-by-one` computable (`index ± 2`) and added `before-after-reversal` (`index - 1` vs `index + 1`) and `cycle-wrap-error` (Sunday→Monday / Night→Morning wrap).
- **Teacher to decide:** confirm the added coin and day/time sequence misconceptions.

### ☐ 11. `g1.shapes.2d` (`shapes2d`) & `g1.shapes.space` (`spatial`) — newly authored misconception tables
- **Problem:** `g1.shapes.2d` had only `rotation-blindness` under PARKED; `g1.shapes.space` had no table in `misconceptions-reference.md`.
- **2026-11-16 Doc Update:**
  - Promoted `g1.shapes.2d` into Grade 1 and added `square-rectangle-confusion`, `side-corner-count-slip` (`sides ± 1`), and `curved-straight-mixup` (circle straight sides → `1`).
  - Added `g1.shapes.space` table with `opposite-spatial-term` (`inside`↔`outside`, `top`↔`bottom`, `near`↔`far`), `vertical-horizontal-confusion`, and `reference-anchor-swap`.
- **Teacher to decide:** confirm the 2D-shape and spatial misconception tags and hints.

### ☐ 12. Grade 1 Pre-number strand (`g1.prenum.compare`, `g1.prenum.sort`, `g1.prenum.patterns`) — newly authored misconception tables
- **Problem:** None of the 3 Grade 1 pre-number skills had entries in `misconceptions-reference.md`.
- **2026-11-16 Doc Update:** Added tables in `misconceptions-reference.md`:
  - `g1.prenum.compare`: `opposite-attribute-confusion`, `quantity-size-illusion` (Piaget conservation: fewer large objects look like "more" than many small objects), `off-by-one`.
  - `g1.prenum.sort`: `odd-one-out-inversion`, `surface-feature-distraction` (sorting by colour instead of functional category).
  - `g1.prenum.patterns`: `last-item-echo` (guard `seq.at(-1) != ans`), `ab-assumed-on-aab`, `first-item-restart` (guard `seq[0] != ans`).
- **Teacher to decide:** confirm the pre-number misconception tags and hints.

### ☐ 13. Measurement strand (`g1.measure.length`, `g1.measure.weight`, `g2.measure.length-std`, `g2.measure.capacity`) — newly authored misconception tables
- **Problem:** None of the 4 measurement skills in Grades 1–2 had entries in `misconceptions-reference.md`.
- **2026-11-16 Doc Update:** Added tables in `misconceptions-reference.md`:
  - `g1.measure.length` (non-standard units): `count-marks-not-units` (`ans + 1`), `skip-count-sequence` (`ans - 1`), `operator-mixup`.
  - `g1.measure.weight`: `up-pan-is-heavier` (thinking the higher pan on a balance scale is heavier), `size-weight-illusion` (large balloon vs small heavy item), `opposite-attribute-confusion`.
  - `g2.measure.length-std` (cm, m): `ruler-one-start-error` (`ans + 1`), `end-mark-only-read` (reading `end` instead of `end - start` when `start > 0`), `operator-mixup`, `off-by-one`.
  - `g2.measure.capacity` (litres): `container-count-confusion` (counting jugs `m` or `k + m` instead of `k * m`), `tall-thin-illusion`, `operator-mixup`, `off-by-one`.
- **Teacher to decide:** confirm all 4 measurement tables and hints.

### ☐ 14. `g2.data.pictograph` (`pictograph`) — newly authored misconception table
- **Problem:** `g2.data.pictograph` had no entry in `misconceptions-reference.md`.
- **2026-11-16 Doc Update:** Added table in `misconceptions-reference.md` with `adjacent-row-read` (reading a neighbouring row's count, guard `rowCount != ans`), `total-instead-of-difference` (`countA + countB` when asked "how many more"), `scale-factor-ignored` (counting raw symbols `c` instead of `c * 2` on 1:2 scale charts), and `off-by-one`.
- **Teacher to decide:** confirm the pictograph tags and whether Class 2 scale should cap at `1 symbol = 2 items`.

### ☐ 15. `g2.frac.halves-quarters` (`fractionsBasic`) — promoted to Grade 2 & expanded (`2026-11-16`)
- **Context:** Per founder decision on `2026-11-16`, Basic Fractions (`1/2`, `1/4`, `3/4`) is added to Grade 2 (`g2.frac.halves-quarters`, order `175`, prereq `g1.shapes.2d`, recipe `fractionsBasic`) rather than left parked.
- **2026-11-16 Doc Update:** Promoted Fractions from `PARKED` into Grade 2 in `misconceptions-reference.md` and expanded it from 1 computable tag (`denominator-magnitude-bias`) to 4 computable tags:
  - `denominator-magnitude-bias` (thinks `1/4 > 1/2` because `4 > 2`)
  - `shaded-to-unshaded-ratio` (writes `1/3` instead of `1/4` when 1 of 4 parts is shaded — part-to-part instead of part-to-whole)
  - `unshaded-complement-picked` (picks `3/4` when 1 of 4 is shaded, guard `shaded * 2 != total`)
  - `double-instead-of-half` (outputs `2 * n` instead of `n / 2` on "half of a collection" prompts)
- **Teacher to decide:** confirm the 4 fraction tags and whether Rung 2 should include "half of an even collection (`2..12`)" alongside visual shape fractions (`1/2`, `1/4`, `3/4`).

### ☐ 16. 8-question session variety & multi-mode expansion (`2026-11-18`, `PR #81`)
- **Context:** Every session asks 8 questions (`REPEAT_GAP = 6`), so any skill with fewer than 8 distinct questions on Rung 1 repeated the same prompts multiple times per session (most starkly `g2.frac.halves-quarters`, which had only 2 questions on Rung 1).
- **2026-11-18 Update:** Added `validateSessionVariety` in `src/recipes/__tests__/validator.test.js` (`>= 8` distinct prompts per rung) and expanded:
  - `g2.frac.halves-quarters` (`fractionsBasic.js`): 3 modes — (A) visual partitioned `circle`, `2×2 grid`, and `bar` across 8 contexts testing `1/2, 1/3, 2/3, 1/4, 3/4` (both `SHADED` and `UNSHADED` on Rung 2); (B) `1/2`, `1/4`, and `3/4` of a group up to 24; (C) whole-part equivalence (*"How many quarters make N whole pizzas?"*).
  - `g1.shapes.2d` (`shapes2d.js`): added Pentagon (5 sides) on Rung 2, real-world object shape matching, and reverse property clues (*"Which 2D shape has 3 corners / 4 equal straight sides?"*).
  - `g1.money.coins` (`moneyCoins.js`) & `g2.money.amounts` (`moneyAmounts.js`): switched to currency-neutral `🪙` coin/money values (`Count the Coins` & `Shopping Maths`) and multi-coin Rung 1 combinations (`2..12`) with no single-coin text giveaway.
- **Teacher to decide:** confirm the expanded fraction modes (`1/3`, `2/3`, unshaded complement, `3/4` of a group) and Pentagon on `g1.shapes.2d` Rung 2.

### ☐ 17. Cross-skill difficulty parity & progressive strategy rungs on `subtraction2d` / `addition2d` (`2026-11-18`, `PR #81`)
- **Context:** `g2.sub.2d-noborrow`, `g2.sub.2d-borrow`, and `g2.add.2d-carry` previously drew full 2-digit operands (`43 − 28`) on Rung 1, whereas Grade 2 non-arithmetic skills (`pictograph`, `measureLength`, `measureCapacity`, `timeClock`) asked Grade 1 counting on Rung 1.
- **2026-11-18 Update:**
  - `subtraction2d.js` and `addition2d.js` (`g2.add.2d-carry`) now step by strategy rung: **Rung 1** = `2-digit ± 1-digit` (`28 − 5`, `23 − 7`, `18 + 5`), **Rung 2** = `2-digit ± 10s / teens` (`56 − 20`, `42 − 17`), **Rung 3** = full `2-digit ± 2-digit`.
  - Grade 2 `pictograph` uses scale `2` or `5` + `MORE` + `ALTOGETHER` from Rung 1; `g2.measure.length-std` uses offset ruler subtraction + 2-digit length addition from Rung 1; `g2.time.clock` tests `:00/:30` on Rung 1, `:15/:30/:45` on Rung 2, and elapsed time (`1..3 hours later`) on Rung 3.
- **Teacher to decide:** confirm the Rung 1 → 2 → 3 progression across Grade 2 skills.

---

## Signed off
_(none yet)_

---

## References
- `misconceptions-reference.md` — canonical tag source (Second Update 2026-11-16).
- `claude-chat/specs/skill-map-spec.md` — Grade 1–2 skill map & recipe agendas (Second Update 2026-11-16).
- `claude-chat/archive/llm-review.md` — the cross-LLM review log this list draws from.
- `DECISIONS.md` — "misconceptions-reference.md is canonical" decision + 2026-11-16 second syllabus update.
