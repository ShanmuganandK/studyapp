# Misconceptions Reference — Computable Rules (Grades 1–2)

**Purpose:** The build input for recipe distractors and remediation hints. Every entry has a **computable rule** (so a recipe can generate the wrong answer) OR is marked **hint-only** (a real misconception that doesn't reduce to "answer ± X" — usable by the remediation system but not as a generated distractor).

**How recipes use this:**
- `tag` → goes in the recipe's `misconceptions[]` array (kebab-case, must match exactly).
- `rule` → the recipe's distractor function applies this to produce the wrong option.
- `hint` → the remediation ladder shows this when a child picks that distractor (`src/engine/hints.js` holds the 85 emitted tags in 1:1 parity with live recipes).
- `condition` → when the distractor is valid (e.g. only when a carry is required).

**Notation:** for a question with operands `a`, `b`, correct answer `ans`. `tens(n)`/`ones(n)` = digit extraction. `swapDigits(n)` = swap tens/ones of a 2-digit number.

> **Current status:** All **36 / 36** Grade 1–2 skills are `status: 'ready'` (`src/recipes/skillMap.js`) and guarded by `validateSessionVariety` (`>= 8` distinct prompts per rung). Money skills (`g1.money.coins`, `g2.money.amounts`) and `src/engine/hints.js` use currency-neutral `🪙` coins/notes with zero `₹`/rupee strings.
> **Teacher review:** Open primary-math teacher sign-off items (`☐ 1–☐ 17`) are tracked in [`ROADMAP.md`](ROADMAP.md) (historical review logs live in `archive/claude-chat/llm-review.md` and `archive/reviews/TEACHER-REVIEW.md`). Tags marked `*(not currently emitted in code)*` are preserved in this reference awaiting teacher confirmation or removal.

---

## Tag Glossary (shared vocabulary — reuse across skills)

Recurring tags (same error type, multiple skills) — keep these stable:

| tag | general meaning | general rule |
|---|---|---|
| `off-by-one` | miscount by exactly 1 | `ans ± 1` |
| `operator-mixup` | applied the wrong operation | compute with the other operator |
| `smaller-from-larger-force` | subtract smaller digit from larger ignoring column order | per-column `|tens(a)-tens(b)| · 10 + |ones(a)-ones(b)|` — **2-digit/borrow only; never emit on single-digit subtraction where `|a-b|` equals the answer** |
| `column-alignment-shift` | misaligned a single digit to the wrong column | treat single digit as tens (×10) |
| `place-value-swap` / `digit-reversal` | swapped tens & ones | `swapDigits(value)` — **guard: only when `value % 11 != 0` (skip palindromes)** |
| `identity-error-zero` / `zero-identity-error` | mishandled 0 (×0, +0, −0) | see per-skill — **guard: result must differ from the correct answer (e.g. mult-by-zero requires `a != 0 || b != 0`)** |
| `forgot-carry` | dropped the carried ten | `ans - 10` |

> **Collision guard (applies to ALL distractor rules):** a distractor must never equal the correct answer. Any rule that *can* collide (digit-swaps/reverses on palindromes, abs-differences that resolve to the answer, zero-identities) must carry an explicit condition so it is skipped when it would produce the correct value. The recipe validator enforces this (no-duplicate-options / correct-answer-present), but rules should be collision-proof by construction so the validator never has to reject them.

Skill-specific tags are listed per skill below.

---

## GRADE 1

### Pre-number — big/small, more/less, tall/short — skill: `g1.prenum.compare`, recipe: `compare`, format `mcq` *(added 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `opposite-attribute-confusion` | picks the minimum/smaller group when asked for more/bigger/taller (or vice versa) | asked "Which has MORE?" (6 vs 3) → picks 3 | "Check the question word carefully: MORE means the bigger count, FEWER means the smaller count!" | always |
| `quantity-size-illusion` | picks the group with physically larger objects over the group with a larger count | 3 big elephants vs 5 small ants → picks elephants | "Big animals take up space, but count how MANY there are in each group!" | contrasting object sizes |
| `off-by-one` | `ans ± 1` on close group counts | 5 vs 6 → miscount by 1 | "Touch and count each group slowly, one by one!" | `|countA - countB| == 1` |

### Pre-number — sorting & classification — skill: `g1.prenum.sort`, recipe: `sorting`, format `mcq` *(added 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `odd-one-out-inversion` | picks one of the 3 matching category items when asked "Which does NOT belong?" | 🍎 🍌 🍇 🚗 → picks 🍎 | "Three of these belong to the same family — find the ONE that is different!" | odd-one-out prompt |
| `surface-feature-distraction` | matches by surface colour/size instead of functional category | "What goes with 🍎 🍓?" → picks red car 🚗 over 🍌 | "Think about what these things ARE (fruits!), not just their colour!" | category-match prompt |

### Pre-number — simple patterns (AB, AAB) — skill: `g1.prenum.patterns`, recipe: `patterns`, format `mcq` *(added 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `last-item-echo` | repeats the immediately preceding symbol when the cycle switches (`seq.at(-1)`) — **guard: only when `seq.at(-1) != ans`** | `🍎 🍌 🍎 🍌 ?` → `🍌` | "Look at the whole pattern from the start — does the same one repeat, or does it take turns?" | `seq.at(-1) != ans` |
| `ab-assumed-on-aab` | alternates `AB` on an `AAB` or `ABB` pattern (picks `B` at index 4 of `A, A, B, A, ?`) | `🔴 🔴 🔵 🔴 ?` → `🔵` | "Count how many of the first kind appear together before the pattern switches!" | `AAB` / `ABB` pattern |
| `first-item-restart` | picks `seq[0]` when the next slot in the cycle is not `seq[0]` — **guard: only when `seq[0] != ans`** | `🍎 🍌 🍇 🍎 ?` → `🍎` | "Say the pattern out loud from the beginning to hear what comes next!" | `seq[0] != ans` |

### Shapes — 2D shapes (circle, square, triangle, rectangle) — skill: `g1.shapes.2d`, recipe: `shapes2d`, format `shape-mcq` *(promoted & expanded 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `rotation-blindness` | fails to identify a square rotated 45° (calls it a "diamond" / picks non-square) | rotated square → not square | "Turn your head! A square is still a square even when it's tilted — count the 4 equal sides." | square shown rotated |
| `square-rectangle-confusion` | picks `rectangle` for `square` (or `square` for `rectangle`) because both have 4 sides and 4 corners | rectangle → "square" | "A square has all 4 sides the EXACT same length; a rectangle has 2 long sides and 2 short sides!" | target is square or rectangle |
| `side-corner-count-slip` | `sides ± 1` on side/corner counting prompts | triangle corners (3) → 4 | "Touch each corner one by one as you count!" | side/corner count asked |
| `curved-straight-mixup` | answers `1` instead of `0` for straight sides of a circle | circle straight sides → 1 | "A circle goes round and round — it has 0 straight sides and 0 corners!" | circle side/corner count |
| `orientation-dependent-naming` *(hint-only)* | names a shape only in its standard horizontal orientation | — | "Shapes keep their name no matter which way they turn!" | rotated shapes |

### Shapes — spatial (inside/outside, near/far, top/bottom) — skill: `g1.shapes.space`, recipe: `spatial`, format `spatial-mcq` *(added 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `opposite-spatial-term` | picks the antonym of the target spatial relation (`inside`↔`outside`, `top`↔`bottom`, `near`↔`far`) | cat inside box → "outside" | "Inside means surrounded by the box walls; outside means out in the open!" | always |
| `vertical-horizontal-confusion` | picks a vertical relation (`top`/`bottom`) for a containment/distance prompt (`inside`/`near`), or vice versa | near the tree → "on top" | "Check whether the question asks about high/low (top/bottom) or close/far (near/far)!" | always |
| `reference-anchor-swap` *(not currently emitted in code)* | judges position relative to the distractor object instead of the named landmark | — | "Find the landmark named in the question first, then look from there!" | two landmarks shown |

### Counting & number sense (1–20) — recipe: `counting`, format `count-objects`
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `skip-count-sequence` | `ans - 1` (skips one number word) | count 8 → 7 | "Let's count slowly together! What comes right after 5?" | count ≥ 6 |
| `double-count-object` | `ans + 1` (counts one object twice) | count 5 → 6 | "Touch each one once as you say the number. No rushing!" | always |
| `count-from-zero` | `ans - 1` (starts at 0) | count 3 → 2 | "Always start counting real things with 1!" | always |
| `teen-reversal` *(hint-only for count; codeable in number-writing)* | `swapDigits(n)` | fourteen(14)→41 | "Fourteen has one ten and four ones. Write the ten (1) first!" | n 11–19 |

*Distractors for counting: use `skip-count-sequence`, `double-count-object`, `count-from-zero` (all ±1 variants — pick distinct values, dedupe).*

### Comparing numbers — recipe: `compareNumbers`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `alligator-confusion` | output the reversed operator (`<`↔`>`) | 15 ? 9 → "<" | "The hungry crocodile's open mouth always eats the BIGGER number!" | always |
| `ones-digit-bias` | decide by `ones(a)` vs `ones(b)`, ignore tens | 12 ? 9 → "9 bigger" | "12 has a bundle of 10 plus 2 ones! 9 has only 9. Which is more?" | two-digit vs any |
| `digit-length-bias` | pick the number with higher first digit | 15 ? 8 → "8 bigger" | "15 is two digits — it has a ten! 8 has zero tens." | two-digit vs single |
| `equals-as-operator` *(hint-only)* | treats `=` as "compute" | — | "The equals sign is a balance scale — both sides match!" | equations only |

### Addition within 10 — recipe: `addition`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `operator-mixup` | `a - b` (subtracts instead) | 5+3 → 2 | "Look at the plus (+) sign — we put the groups together!" | a>b |
| `off-by-one` | `ans ± 1` | 4+3 → 6 or 8 | "Count on from 4: 5, 6, 7. What's the last jump?" | always |
| `identity-error-zero` *(not currently emitted in code)* | if `b==0`: `a + 1` | 7+0 → 8 | "Adding zero means adding nothing! 7 stays 7." | b==0 (or a==0) |
| `count-all-instead-of-on` *(hint-only)* | tracking slip (`ans ± 1`) | — | "Put 5 in your head and count forward 3: 6, 7, 8!" | always |

### Addition within 20 — recipe: `addition`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `crossing-ten-misstep` | `ones(ans)` (drops the ten) → `ans - 10` | 8+5=13 → 3 | "8 needs 2 to make a ten. 3 ones left over → 13!" | sum crosses 10 |
| `add-tens-to-ones` | for `teen + c`: add `c` to tens digit → `value + 10*c` style; practically `ans + 9*(c-?)` — **use:** `tens-shifted` = `(tens(teen)+c)*10 + ones(teen)` | 12+5 → 62 | "The 5 adds to the 2 ones, not the 1 ten!" | teen + single |
| `operator-mixup` | `|a - b|` (subtracts addends) | 8+5 → 3 | "Plus means add! Put them together." | always |
| `off-by-one` | `ans ± 1` | — | "Recount your last hop." | always |
| `double-count-bridge` *(hint-only)* | counts 10 twice (`ans - 1`) | — | "Don't land on 10 twice! 10, 11, 12, 13." | crosses 10 |

### Subtraction within 10 — recipe: `subtraction`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `operator-mixup` | `a + b` (adds instead) | 7-3 → 10 | "Minus (−) means take away! Cross out 3." | always |
| `smaller-from-larger-force` | `10 + |ones(a)-b|` (teen minuend borrow case ONLY; **do NOT emit on single-digit within-10 where `|a-b|` = the answer**) | 13-5 → 12 | "Can't do 2−7 — regroup a ten first!" | teen minuend, borrow needed |
| `off-by-one` | `ans ± 1` | — | "Count backward 3 from 7: 6, 5, 4." | always |
| `subtract-zero-error` *(not currently emitted in code)* | if `b==0`: `a - 1` (or 0) | 7-0 → 6 | "Subtracting zero takes away nothing! Stays the same." | b==0 |

### Subtraction within 20 — recipe: `subtraction`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `tens-ignored` | `ones(a) - b` (drops the ten) | 15-4 → 1 | "Don't forget the ten! 15 is 10 and 5." | a teen |
| `regroup-ignored` *(not currently emitted in code — formula collides with correct answer; see `ROADMAP.md` ☐ 1)* | `10 + (ones(a) - b)` when borrow needed | 13-5 → 18-ish err | "Regroup properly across the ten." | borrow needed |
| `operator-mixup` | `a + b` | 15-4 → 19 | "Minus means take away, not add!" | always |
| `off-by-one` | `ans ± 1` | — | "Recount backward past ten carefully." | crosses 10 |

### Numbers 21–99 (read, write, count) — skill: `g1.num.21-99`, recipe: `numbers21to99`, format `mcq` *(added 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `decade-transition-stall` | `tens(n) * 10` (resets ones to 0 after 9, but forgets to increment tens) | after 29 → 20 | "After 9 ones comes a brand new ten! 29 jumps up to 30." | `n % 10 == 9` |
| `decade-ten-overshoot` | `n + 10` (increments tens digit at decade boundary but keeps the 9 ones) | after 29 → 39 | "When 29 rolls over to the next ten, the 9 ones reset to 0 → 30!" | `n % 10 == 9` |
| `before-instead-of-after` | `n - 1` (gives the number before `n` instead of after `n`) | after 34 → 33 | "We are counting forward! What number comes NEXT after this one?" | always |
| `place-value-swap` | `swapDigits(ans)` (swaps tens and ones of the target number) — **guard: only when `ans % 11 != 0 && ans % 10 != 0`** | after 24 (25) → 52 | "Tens go on the left, ones go on the right!" | `ans % 11 != 0 && ans % 10 != 0` |
| `off-by-one` | `ans + 1` (skips the target number) | after 34 → 36 | "Go one step at a time — don't skip a number!" | always |

### Place value intro — tens & ones — recipe: `placeValue`, format `mcq` *(updated 2026-11-16)*
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `separate-digit-reading` | concatenate `tens·10` written-out, e.g. 4 tens 2 ones → 402 (`t * 100 + o`) | → 402 | "4 tens makes 40. When the 2 ones join, they take the zero's place to make 42!" | always |
| `digit-reversal` | `swapDigits(value)` (3 tens 5 ones → 53) — **guard (2026-11-16): only when `t != o && o != 0` (skip palindromes like 33, and skip `o == 0` where `swapDigits(40) = 4` collides with `expanded-addition`)** | 35 → 53 | "Tens on the left, ones on the right!" | `t != o && o != 0` |
| `expanded-addition` | `tensDigit + onesDigit` (face values) — **guard (2026-11-16): `o != 0`** | 3 tens 4 ones → 7 | "3 tens is 30, 4 ones is 4 → 34!" | value-asked, `o != 0` |
| `tens-only-counted` *(added 2026-11-16)* | `tensDigit * 10` (counts the tens bundles as `t * 10` but forgets to add the ones; or `t` when `o == 0`) | 3 tens 4 ones → 30 | "You got the tens right! Now add the ones too." | `o != 0` (or `o == 0` → `t`) |
| `unit-counting-only` *(not currently emitted in code — visual block representation only; shares `t + o` formula with `expanded-addition`; see `ROADMAP.md` ☐ 5)* | count bundles as 1 each → `tensDigit + onesDigit` | 3 rods 4 cubes → 7 | "Each rod is 10! Count by tens: 10, 20, 30." | block representation |

### Ordinal numbers (1st–10th) — recipe: `ordinal`, format `mcq` *(updated 2026-11-16)*
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `cardinal-confusion` | output total count `N` instead of position `p` — **guard (2026-11-16): only when `position < N` (otherwise `N == position` collides with the correct answer)** | → total | "We want the position — is it 3rd or 4th?" | `position < N` |
| `right-to-left-start` | `(N+1) - position` (counts from other end) — **guard (2026-11-16): only when `2 * position != N + 1` (skip the middle item where left and right positions are equal)** | 5 items, 2nd→4th | "Start counting from the front of the line!" | `2 * position != N + 1` |
| `off-by-one` | `position ± 1` | 4th → 3rd/5th | "Tap and count: 1st, 2nd, 3rd, 4th. Stop!" | always |
| `irregular-ordinal-naming` *(hint-only)* | appends "-th" to 1/2/3 | 2→"twoth" | "1st, 2nd, 3rd are special words!" | position ≤ 3 |

### Measurement — length (longer/shorter, non-standard units) — skill: `g1.measure.length`, recipe: `measureLength`, format `unit-length` *(added 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `count-marks-not-units` | `ans + 1` (counts block edges/corners from 0 instead of the blocks themselves) | 5 blocks → 6 | "Count the blocks themselves, one by one!" | always |
| `skip-count-sequence` | `ans - 1` (skips one unit block while counting) | 6 blocks → 5 | "Touch each block along the object as you count!" | `ans >= 3` |
| `operator-mixup` | `a + b` when asked "How many blocks longer is A than B?" (`a - b`) | 7 vs 4 blocks → 11 | "To find how many blocks LONGER, compare and take away the smaller length!" | comparison prompt |

### Measurement — weight (heavy/light) — skill: `g1.measure.weight`, recipe: `measureWeight`, format `balance-mcq` *(added 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `up-pan-is-heavier` | picks the item on the *higher* pan of the balance scale as heavier | pan A down, pan B up → picks B | "On a seesaw or balance scale, the HEAVIER side pushes DOWN!" | pan-balance prompt |
| `size-weight-illusion` | picks a large light object (🎈) as heavier than a smaller dense object (🍎/🔒) | balloon vs apple → balloon | "A balloon is big, but it is filled with air — so it is very light!" | contrasting size/density |
| `opposite-attribute-confusion` | picks the lighter item when asked for heavier (or vice versa) | — | "Check whether the question asks for HEAVIER or LIGHTER!" | always |

### Time — day/night, days of week, sequence — recipe: `timeBasic`, format `mcq` *(expanded 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `before-after-reversal` *(added 2026-11-16)* | picks the preceding day/stage (`index - 1`) when asked for *after*, or `index + 1` when asked for *before* | "After Tuesday?" → Monday | "After means moving FORWARD to the next day; before means the day that came earlier!" | always |
| `sequence-off-by-one` | skips one day/stage in the direction asked (`(index ± 2 + N) % N`) | "After Monday?" → Wednesday | "Say the days in order slowly — what comes right after Monday?" | always |
| `cycle-wrap-error` *(added 2026-11-16)* | fails Sunday→Monday or Night→Morning wrap-around (picks start/end of list instead of wrapping) | "After Sunday?" → Saturday | "After Sunday, a brand new week starts with Monday!" | boundary item |

### Money — coins (🪙1, 🪙2, 🪙5, 🪙10) — recipe: `moneyCoins`, format `coins-mcq`
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `size-value-bias` | pick coin by larger diameter not value (or read 🪙5 as 🪙2) | 🪙2 over 🪙5 | "Coin size doesn't tell value — read the printed number!" | always |
| `coin-count-as-value` | outputs the number of coins `coins.length` instead of summing their coin values — **guard: only when `coins.length != ans`** | two 🪙5 coins → 🪙2 | "Look at the number printed on each coin — two 🪙5 coins make 5 + 5 = 🪙10!" | `coins.length >= 2 && coins.length != ans` |
| `sum-as-concatenation` | concatenates two coin values as digits (`c1 * 10 + c2`) | 🪙1 and 🪙2 → 🪙12 | "Add the numbers on the coins together: 1 + 2 = 🪙3!" | 2 single-digit coins |
| `off-by-one` | `ans ± 1` | 🪙7 → 🪙6 or 🪙8 | "Count the coin values carefully!" | always |

---

## GRADE 2

### Numbers up to 999 — recipe: `counting3digit`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `expanded-concatenation` | write literal terms w/ extra zeros (309→3009) | → 3009 | "Watch out — 3009 is in the thousands family! Put the 3 in the hundreds house, 0 in the tens house, 9 in the ones house → 309." | has zero column |
| `zero-placeholder-ignored` | drop middle zero (309→39) | 309 → 39 | "Keep the zero in the tens place: 309." | has zero column |
| `digit-value-blindness` | face value not place value (3 in 372 → 3) | → 3 | "The 3 is in the hundreds house → 300!" | value-asked |
| `reverse-period-reading` | `reverseDigits(n)` (235→532) — **guard: only when first digit ≠ last digit (skip palindromes like 353)** | 235 → 532 | "Read left to right, hundreds first!" | first≠last digit |

### Place value — hundreds, tens, ones (expanded form) — skill: `g2.place.hundreds`, recipe: `placeValue3`, format `mcq` *(added 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `zero-placeholder-ignored` | drops a zero tens or ones column when combining expanded form (`h * 10 + o` for `h*100 + o`) | `300 + 8 → 38` | "300 has three digits! Keep a 0 in the tens house so the 8 stays in the ones house → 308." | `t == 0 && o > 0` |
| `digit-value-blindness` | sums only the non-zero leading face digits (`h + t + o`) | `300 + 40 + 5 → 12` | "Those are hundreds and tens! Put each digit into its own house: hundreds, tens, ones." | always |
| `reverse-period-reading` | `o * 100 + t * 10 + h` — **guard: only when `h != o && o > 0`** | `300 + 40 + 5 → 543` | "Hundreds go on the left, tens in the middle, ones on the right!" | `h != o && o > 0` |
| `place-column-shift` | swaps tens and ones houses (`h * 100 + o * 10 + t`) — **guard: only when `t != o`** | `300 + 40 + 5 → 354` | "Check the tens and ones houses — 40 means 4 in the tens place!" | `t != o` |

### 2-digit addition without carry — recipe: `addition2d`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `column-alignment-shift` | single digit aligned to tens → add `10×digit` | 24+5 → 74 | "Ones under ones! Put the 5 under the 4." | one operand single-digit |
| `add-across-columns` | sum all digits → `tens(a)+ones(a)+tens(b)+ones(b)` | 23+14 → 10 | "Add ones first, then tens — separately!" | always |
| `operator-mixup` | `a - b` | → diff | "Plus means add!" | always |
| `place-value-swap` | `swapDigits(ans)` (46→64) | → 64 | "Add ones first → write 6 in the ones place on the right!" | always |
| `ones-addition-ignored` | tens added correctly, but ones copied from operand `a` only instead of adding both — `(tens(a)+tens(b))*10 + ones(a)` | 34+24 → 54 | "You got the tens right! Now add the ones from BOTH numbers together too." | **`tens(b) != 0`** (rung 3 only — with `tens(b)==0` the rule degenerates to `ans − ones(b) → a` itself, which isn't this misconception) — **guard: only when `ones(b) != 0` (otherwise it equals the correct answer)** |

### 2-digit addition WITH carry — recipe: `addition2d`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `forgot-carry` | `ans - 10` | 47+38=85 → 75 | "Look at the ones: 7+8 is more than 9 — where does the extra ten go?" | carry required |
| `write-full-sum-in-column` | put 2-digit ones-sum in ones place → concat | 47+38 → 715-ish | "Can't write two digits in ones! Carry the ten." | carry required |
| `double-carry` | add carry to both columns → `ans + 10` | → +10 | "You made a new ten! Add it only to the tens column, not the ones." | carry required |
| `carry-subtraction-instead` | subtract carry from tens → `ans - 20` | → −20 | "Carrying means ADD the ten to the tens column!" | carry required |

### 2-digit subtraction without borrow — recipe: `subtraction2d`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `operator-mixup` | `a + b` | → sum | "Minus means take away!" | always |
| `column-alignment-shift` | single subtrahend digit under tens | 54−3 → mis | "Line the 3 under the ones (under the 4)!" | one operand single-digit |
| `digit-subtraction-isolation` | `swapDigits(ans)` (reversed columns) — **guard: only when `ans % 11 != 0` (skip palindromes like 44)** | → swapped | "Tens answer in tens, ones in ones." | always, ans not palindrome |
| `ones-subtraction-ignored` | subtract only tens, copy ones of `a` | 54−23 → mis | "Subtract the ones column first!" | always |

### 2-digit subtraction WITH borrow — recipe: `subtraction2d`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `smaller-from-larger-force` | per column `|ones(a)-ones(b)|` + correct tens | 52−27 → 35 | "Can't do 2−7 — regroup a ten first!" | borrow required |
| `borrow-without-reducing-tens` | borrow ones but don't reduce tens → `ans + 10` | → +10 | "You borrowed — so 5 tens becomes 4 tens!" | borrow required |
| `regroup-ten-ones-shortchange` | set ones to 10 not ones+10 | → mis | "Add the ten to the ones already there: 2+10=12!" | borrow required |
| `borrow-from-nowhere` | reduce tens but don't add 10 to ones → `ans - 10` | → −10 | "Give those 10 ones to the ones column!" | borrow required |

### Multiplication as repeated addition — recipe: `mulIntro`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `multiplication-as-addition` | `a + b` (adds factors) | 4×3 → 7 | "4×3 means 4 groups of 3: 3+3+3+3 = 12!" | always |
| `skip-count-misstep` | `ans ± a` (lost track of skip count — covers the old "16 for 4×3" case, which is a skip-count slip, NOT squaring) | 4×3 → 16 | "Skip count carefully: 3, 6, 9, 12!" | a≠b |
| `multiplication-by-zero-identity` | if exactly one factor is 0: returns the OTHER factor (**guard: only when the other factor `!= 0`; never on 0×0**) | 5×0 → 5 | "5 groups of zero is zero!" | one factor 0, other ≠ 0 |
| `count-factor-swap` *(hint-only — same product)* | swaps group/size meaning | — | "3×5 means 3 groups of 5: 5+5+5." | a≠b |

### Multiplication tables (2,5,10) — recipe: `mulTable`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `skip-count-misstep` | `ans ± table` (one group off) | 5×6 → 25 or 35 | "Skip count by 5 six times: 5,10,15,20,25,30!" | always |
| `add-instead-of-multiply` | `a + b` | 10×2 → 12 | "10×2 means 10 groups of 2. Count by 10s twice!" | always |
| `multiplication-by-one-identity` | if factor 1: `other + 1` | 7×1 → 8 | "×1 means one group — it stays the same!" | a==1 or b==1 |
| `zero-identity-error` | if factor 0: returns other factor | 7×0 → 7 | "Any number times zero is zero!" | a==0 or b==0 |

### Measurement — length in standard units (cm, m) — skill: `g2.measure.length-std`, recipe: `measureLength`, format `mcq` *(added 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `ruler-one-start-error` | `ans + 1` (counts ruler marks starting at 1 instead of 0 cm jumps) | 0 cm to 8 cm → 9 cm | "Start measuring at the 0 cm mark and count the centimetre jumps!" | always |
| `end-mark-only-read` | outputs `end` instead of `end - start` when object starts at `start > 0` | 2 cm to 9 cm → 9 cm | "The object starts at {start} cm, not 0 cm! Subtract the starting mark from the end mark." | `start > 0` |
| `operator-mixup` | `end + start` on offset ruler, or `|a - b|` when adding two lengths | 2 cm to 9 cm → 11 cm | "Subtract the start mark to find the length between two points, or add when joining two lengths!" | two numbers in prompt |
| `off-by-one` | `ans - 1` | 7 cm → 6 cm | "Count the centimetre spaces carefully!" | `ans >= 2` |

### Measurement — capacity (litres) — skill: `g2.measure.capacity`, recipe: `measureCapacity`, format `mcq` *(added 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `container-count-confusion` | outputs `m` or `k + m` instead of `k * m` when filling `m` jugs of `k` cups/litres each | 3 jugs × 2 L → 3 or 5 | "Each jug holds the same amount — add {k} for every jug!" | multi-vessel prompt |
| `tall-thin-illusion` *(hint-only / visual vessel comparison)* | picks tall narrow vessel over wide vessel of greater litre capacity | — | "Read the litre numbers! A wide bucket can hold more than a tall thin glass." | vessel comparison |
| `operator-mixup` | `a + b` when asked "how many more litres", or `|a - b|` when combining | 15 L vs 6 L → 21 L | "Check whether we are pouring together (add) or finding how much more (subtract)!" | two-vessel arithmetic |
| `off-by-one` | `ans ± 1` | 12 L → 11 L | "Recount the litres carefully!" | always |

### Money — amounts & change (🪙) — recipe: `moneyAmounts`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `smaller-from-larger-force-money` | per-column abs subtraction across zero (`(tens(a)-tens(b))*10 + ones(b)` or for `100 - b`, `(10 - tens(b))*10 + ones(b)`) | 🪙100−🪙75 → 🪙35 | "Can't do 0−5 — borrow from hundreds!" | minuend has zeros (`ones(a) == 0 && ones(b) > 0`) |
| `ten-across-zero-borrow` | `ans + 10` (borrows 10 for the ones column but forgets to reduce the tens column) | 🪙50−🪙18 → 🪙42 | "When you exchange one 10-coin note for ten 1-coins, you have one less ten!" | subtraction with borrow |
| `operator-mixup` | `a + b` on change subtraction, or `|a - b|` on coin addition | 🪙50−🪙20 → 🪙70 | "Spending coins takes money away — subtract the price to find the change!" | `a != b` |
| `off-by-one` | `ans ± 1` | 🪙25 → 🪙24 | "Count the coin values carefully!" | always |
| `rupee-paise-mismatch` *(hint-only — legacy sub-unit formatting)* | adds whole units to sub-units as ints | 5 + 50 cents → 55 | "100 small units make 1 whole unit — don't add them directly!" | mixed units |
| `decimal-place-error` *(hint-only — legacy sub-unit formatting)* | mis-places decimal hundredths | 5 hundredths → 5.5 | "5 hundredths is .05; .5 means 50!" | decimals present |

### Time — reading the clock — recipe: `timeClock`, format `clock` *(updated 2026-11-16)*
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `hand-size-reversal` | swap hour/minute hand reading — **guard (2026-11-16): skip at `12:00` (both hands on 12) and `6:30` (both hands at 6), where swapping produces the correct time** | 3:00 → 12:15 | "Short hand = hour, read it first!" | `!(hour == 12 && minutes == 0) && !(hour == 6 && minutes == 30)` |
| `hour-hand-proximity` | round hour up to nearest → `(hour % 12) + 1` | 4:30 → 5:30 | "Hour hand is past 4 but not at 5 — still 4!" | minutes=30 |
| `minute-numeric-literal` | read minute hand's clock number as literal minutes (`:12` for `:00`, `:06` for `:30`) | hand at 6 → "4:06" | "For minutes, count by 5s around the clock!" | always |
| `half-hour-as-fifty` | half → :50 not :30 | half past 3 → 3:50 | "An hour is 60 min — half is 30, not 50!" | half-hour (minutes=30) |
| `off-by-one-hour` *(added 2026-11-16)* | reads hour hand off by 1 hour (`(hour % 12) + 1` at `:00`, or `((hour + 10) % 12) + 1`) | 3:00 → 4:00 | "Look closely at the short hour hand — which number is it pointing right at?" | always |

### Data handling — simple pictographs — skill: `g2.data.pictograph`, recipe: `pictograph`, format `pictograph` *(added 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `adjacent-row-read` | returns the value of a different row in the pictograph — **guard: only when that row's count `!= ans`** | asked Apples (4), reads Mangoes (6) → 6 | "Follow the row for the picture asked in the question across with your finger!" | adjacent row count `!= ans` |
| `total-instead-of-difference` | `countA + countB` when asked "How many MORE A than B?" (`countA - countB`) | 6 vs 4 → 10 | "To find 'how many more', subtract the smaller row from the bigger row!" | comparison prompt |
| `scale-factor-ignored` | returns raw symbol count `c` instead of `c * scale` when `scale == 2` | 4 symbols (×2 = 8) → 4 | "Check the key: each picture stands for 2, so count by twos!" | `scale > 1` |
| `off-by-one` | `ans ± 1` | 5 → 4 or 6 | "Count each picture in the row carefully!" | always |

### Fractions — basic halves & quarters (1/2, 1/4, 3/4) — skill: `g2.frac.halves-quarters`, recipe: `fractionsBasic`, format `fraction-mcq` *(promoted from PARKED & expanded 2026-11-16)*
| tag | rule (computable) | example | hint | condition |
|---|---|---|---|---|
| `denominator-magnitude-bias` | picks the fraction with the larger denominator as "bigger" (thinks `1/4 > 1/2` because `4 > 2`), or confuses `1/2` and `1/4` | 1/2 vs 1/4 → "1/4" | "More pieces means each piece is SMALLER! Half a roti (1/2) is bigger than a quarter (1/4)." | comparing unit fractions or naming `1/2` vs `1/4` |
| `shaded-to-unshaded-ratio` *(added 2026-11-16)* | writes `shaded / unshaded` instead of `shaded / totalParts` (e.g. 1 shaded, 3 unshaded → `1/3` instead of `1/4`) | 1 of 4 shaded → `1/3` | "The bottom number counts ALL the equal parts in the whole shape, including the shaded one!" | `totalParts == 4 && shadedParts == 1` |
| `unshaded-complement-picked` *(added 2026-11-16)* | picks `(totalParts - shadedParts) / totalParts` (counts unshaded parts instead of shaded parts) — **guard: only when `shadedParts * 2 != totalParts`** | 1 of 4 shaded → `3/4` | "Count the SHADED parts for the top number!" | `shadedParts * 2 != totalParts` |
| `double-instead-of-half` *(added 2026-11-16)* | outputs `2 * n` instead of `n / 2` on "What is half of {n}?" prompts | half of 6 → 12 | "Half means sharing equally into 2 groups, not doubling!" | half-of-number prompt |
| `numerator-only-focus` *(hint-only)* | compares only numerators, ignores denominator | — | "Look at the whole picture — how big is each piece?" | comparing fractions |

---

## PARKED — for future grades (Grade 3+, not in the Grade 1–2 map)

*(As of the 2026-11-16 second update, both previously parked entries — `g1.shapes.2d` shape orientation and `g2.frac.halves-quarters` basic fractions — have been promoted into the active Grade 1 and Grade 2 sections above.)*

---



1. **Match tags exactly** — the `misconceptions[]` array in each recipe uses these kebab-case tags verbatim. The remediation ladder keys hints off them.
2. **Distractor selection per question:** pick the misconceptions whose `condition` is satisfied by the generated operands (e.g. `forgot-carry` only when a carry occurs), apply their rules to get wrong values, then dedupe + fill to OPTION_COUNT with a safe `random-slip` fallback (a nearby plausible value not equal to any other option).
3. **hint-only entries** are NOT used as distractors — they're available to the remediation system for conceptual guidance. Recipes skip them when building options.
4. **Always validate**: every generated distractor set must still pass the recipe validator (distinct options, correct answer present, misconceptions index-aligned).
5. **Reconstructed rules flagged** above where the source formula was lost — these are my reconstructions from the prose; the teacher review should confirm them.
