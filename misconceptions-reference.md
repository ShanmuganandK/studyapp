# Misconceptions Reference — Computable Rules (Grades 1–2 CBSE)

**Purpose:** The build input for recipe distractors and remediation hints. Every entry has a **computable rule** (so a recipe can generate the wrong answer) OR is marked **hint-only** (a real misconception that doesn't reduce to "answer ± X" — usable by the remediation system but not as a generated distractor).

**How recipes use this:**
- `tag` → goes in the recipe's `misconceptions[]` array (kebab-case, must match exactly).
- `rule` → the recipe's distractor function applies this to produce the wrong option.
- `hint` → the remediation ladder shows this when a child picks that distractor.
- `condition` → when the distractor is valid (e.g. only when a carry is required).

**Notation:** for a question with operands `a`, `b`, correct answer `ans`. `tens(n)`/`ones(n)` = digit extraction. `swapDigits(n)` = swap tens/ones of a 2-digit number.

> Source: distilled from *Early Childhood Mathematics Misconception Index (CBSE/NCERT)*, 68 misconceptions across 17 skills. Math formulae lost in doc conversion were reconstructed from the intact prose descriptions. **Before shipping, have a primary-math teacher verify the ~68 rows (especially hint wording).**

---

## Tag Glossary (shared vocabulary — reuse across skills)

Recurring tags (same error type, multiple skills) — keep these stable:

| tag | general meaning | general rule |
|---|---|---|
| `off-by-one` | miscount by exactly 1 | `ans ± 1` |
| `operator-mixup` | applied the wrong operation | compute with the other operator |
| `smaller-from-larger-force` | subtract smaller digit from larger ignoring column order | per-column `|tens(a)-tens(b)| · 10 + |ones(a)-ones(b)|` |
| `column-alignment-shift` | misaligned a single digit to the wrong column | treat single digit as tens (×10) |
| `place-value-swap` / `digit-reversal` | swapped tens & ones | `swapDigits(value)` |
| `identity-error-zero` / `zero-identity-error` | mishandled 0 (×0, +0, −0) | see per-skill |
| `forgot-carry` | dropped the carried ten | `ans - 10` |

Skill-specific tags are listed per skill below.

---

## GRADE 1

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
| `identity-error-zero` | if `b==0`: `a + 1` | 7+0 → 8 | "Adding zero means adding nothing! 7 stays 7." | b==0 (or a==0) |
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
| `smaller-from-larger-force` | `|a - b|` (here same as ans unless reversed framing) — use for reversed-operand framings | 3-7 → 4 | "Start with the bigger number and take away." | a<b shown |
| `off-by-one` | `ans ± 1` | — | "Count backward 3 from 7: 6, 5, 4." | always |
| `subtract-zero-error` | if `b==0`: `a - 1` (or 0) | 7-0 → 6 | "Subtracting zero takes away nothing! Stays the same." | b==0 |

### Subtraction within 20 — recipe: `subtraction`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `tens-ignored` | `ones(a) - b` (drops the ten) | 15-4 → 1 | "Don't forget the ten! 15 is 10 and 5." | a teen |
| `regroup-ignored` | `10 + (ones(a) - b)` when borrow needed | 13-5 → 18-ish err | "Regroup properly across the ten." | borrow needed |
| `operator-mixup` | `a + b` | 15-4 → 19 | "Minus means take away, not add!" | always |
| `off-by-one` | `ans ± 1` | — | "Recount backward past ten carefully." | crosses 10 |

### Place value intro — tens & ones — recipe: `placeValue`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `separate-digit-reading` | concatenate `tens·10` written-out, e.g. 4 tens 2 ones → 402 | → 402 | "4 tens is forty — the 4 sits in the tens place, drop the extra zero!" | always |
| `digit-reversal` | `swapDigits(value)` (3 tens 5 ones → 53) | 35 → 53 | "Tens on the left, ones on the right!" | always |
| `expanded-addition` | `tensDigit + onesDigit` (face values) | 3 tens 4 ones → 7 | "3 tens is 30, 4 ones is 4 → 34!" | value-asked |
| `unit-counting-only` | count bundles as 1 each → `tensDigit + onesDigit` | 3 rods 4 cubes → 7 | "Each rod is 10! Count by tens: 10, 20, 30." | block representation |

### Ordinal numbers (1st–10th) — recipe: `ordinal`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `cardinal-confusion` | output total count instead of position | → total | "We want the position — is it 3rd or 4th?" | always |
| `right-to-left-start` | `(N+1) - position` (counts from other end) | 5 items, 2nd→4th | "Start counting from the front of the line!" | always |
| `off-by-one` | `position ± 1` | 4th → 3rd/5th | "Tap and count: 1st, 2nd, 3rd, 4th. Stop!" | always |
| `irregular-ordinal-naming` *(hint-only)* | appends "-th" to 1/2/3 | 2→"twoth" | "1st, 2nd, 3rd are special words!" | position ≤ 3 |

### Time — day/night, days of week — recipe: `timeBasic`, format `mcq` — *hint-only set* (sequence errors; use ±1 in sequence)
| tag | rule | hint |
|---|---|---|
| `sequence-off-by-one` | next/prev day or part wrong by one | "What comes right after Monday?" |

### Money — Indian coins — recipe: `moneyCoins`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `size-value-bias` | pick coin by larger diameter not value | ₹2 over ₹5 | "Coin size doesn't tell value — read the printed number!" | always |

---

## GRADE 2

### Numbers up to 999 — recipe: `counting3digit`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `expanded-concatenation` | write literal terms w/ extra zeros (309→3009) | → 3009 | "Three hundred and nine = 3 hundreds, 0 tens, 9 ones → 309!" | has zero column |
| `zero-placeholder-ignored` | drop middle zero (309→39) | 309 → 39 | "Keep the zero in the tens place: 309." | has zero column |
| `digit-value-blindness` | face value not place value (3 in 372 → 3) | → 3 | "The 3 is in the hundreds house → 300!" | value-asked |
| `reverse-period-reading` | `reverseDigits(n)` (235→532) | 235 → 532 | "Read left to right, hundreds first!" | always |

### 2-digit addition without carry — recipe: `addition2d`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `column-alignment-shift` | single digit aligned to tens → add `10×digit` | 24+5 → 74 | "Ones under ones! Put the 5 under the 4." | one operand single-digit |
| `add-across-columns` | sum all digits → `tens(a)+ones(a)+tens(b)+ones(b)` | 23+14 → 10 | "Add ones first, then tens — separately!" | always |
| `operator-mixup` | `a - b` | → diff | "Plus means add!" | always |
| `place-value-swap` | `swapDigits(ans)` (46→64) | → 64 | "Add ones first → write 6 in the ones place on the right!" | always |

### 2-digit addition WITH carry — recipe: `addition2d`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `forgot-carry` | `ans - 10` | 47+38=85 → 75 | "Look at the ones: 7+8 is more than 9 — where does the extra ten go?" | carry required |
| `write-full-sum-in-column` | put 2-digit ones-sum in ones place → concat | 47+38 → 715-ish | "Can't write two digits in ones! Carry the ten." | carry required |
| `double-carry` | add carry to both columns → `ans + 10` | → +10 | "Add the carried ten to the tens once, not the ones!" | carry required |
| `carry-subtraction-instead` | subtract carry from tens → `ans - 20` | → −20 | "Carrying means ADD the ten to the tens column!" | carry required |

### 2-digit subtraction without borrow — recipe: `subtraction2d`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `operator-mixup` | `a + b` | → sum | "Minus means take away!" | always |
| `column-alignment-shift` | single subtrahend digit under tens | 54−3 → mis | "Line the 3 under the ones (under the 4)!" | one operand single-digit |
| `digit-subtraction-isolation` | `swapDigits(ans)` (reversed columns) | → swapped | "Tens answer in tens, ones in ones." | always |
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
| `exponentiation-confusion` | `a × a` (squares one factor) | 4×3 → 16 | "Don't multiply 4 by itself! 4 groups of 3." | a≠b |
| `multiplication-by-zero-identity` | if factor 0: returns other factor | 5×0 → 5 | "5 groups of zero is zero!" | a==0 or b==0 |
| `count-factor-swap` *(hint-only — same product)* | swaps group/size meaning | — | "3×5 means 3 groups of 5: 5+5+5." | a≠b |

### Multiplication tables (2,5,10) — recipe: `mulTable`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `skip-count-misstep` | `ans ± table` (one group off) | 5×6 → 25 or 35 | "Skip count by 5 six times: 5,10,15,20,25,30!" | always |
| `add-instead-of-multiply` | `a + b` | 10×2 → 12 | "10×2 means 10 groups of 2. Count by 10s twice!" | always |
| `multiplication-by-one-identity` | if factor 1: `other + 1` | 7×1 → 8 | "×1 means one group — it stays the same!" | a==1 or b==1 |
| `zero-identity-error` | if factor 0: returns other factor | 7×0 → 7 | "Any number times zero is zero!" | a==0 or b==0 |

### Money — amounts & change (₹) — recipe: `moneyAmounts`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `smaller-from-larger-force-money` | per-column abs subtraction across zero | ₹100−₹75 → ₹35 | "Can't do 0−5 — borrow from hundreds!" | minuend has zeros |
| `rupee-paise-mismatch` *(hint-only — formatting)* | adds ₹ to paise as ints | ₹5+50p → ₹55 | "1 rupee = 100 paise — can't add directly!" | mixed units |
| `decimal-place-error` *(hint-only — formatting)* | mis-places paise decimal | 5p → ₹5.5 | "5 paise is .05; ₹5.5 means 5 rupees 50 paise!" | paise present |

### Time — reading the clock — recipe: `timeClock`, format `mcq`
| tag | rule | example | hint | condition |
|---|---|---|---|---|
| `hand-size-reversal` | swap hour/minute hand reading | 3:00 → 12:15 | "Short hand = hour, read it first!" | always |
| `hour-hand-proximity` | round hour up to nearest → `hour+1` | 4:30 → 5:30 | "Hour hand is past 4 but not at 5 — still 4!" | minutes=30 |
| `minute-numeric-literal` | read minute as literal digit not ×5 | hand at 6 → "6 min" | "For minutes, count by 5s around the clock!" | always |
| `half-hour-as-fifty` | half → :50 not :30 | half past 3 → 3:50 | "An hour is 60 min — half is 30, not 50!" | half-hour |

---

## Implementation notes for the recipe factory

1. **Match tags exactly** — the `misconceptions[]` array in each recipe uses these kebab-case tags verbatim. The remediation ladder keys hints off them.
2. **Distractor selection per question:** pick the misconceptions whose `condition` is satisfied by the generated operands (e.g. `forgot-carry` only when a carry occurs), apply their rules to get wrong values, then dedupe + fill to OPTION_COUNT with a safe `random-slip` fallback (a nearby plausible value not equal to any other option).
3. **hint-only entries** are NOT used as distractors — they're available to the remediation system for conceptual guidance. Recipes skip them when building options.
4. **Always validate**: every generated distractor set must still pass the recipe validator (distinct options, correct answer present, misconceptions index-aligned).
5. **Reconstructed rules flagged** above where the source formula was lost — these are my reconstructions from the prose; the teacher review should confirm them.
