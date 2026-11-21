/**
 * hints — tag → kid-friendly remediation hint, for the tags the READY recipes actually emit.
 *
 * Seeded from misconceptions-reference.md (the canonical source), generalised so the string
 * works for any question of that type (the doc's hints are often example-specific). Only the
 * reachable tags are included now (the 4 ready recipes: counting, addition, subtraction,
 * compare) — not all 68. More land as the recipe factory builds more skills.
 *
 * `operator-mixup` and `off-by-one` are shared across addition/subtraction, so their hints are
 * phrased to fit both operations.
 */

const HINTS = {
  // counting (count-objects)
  'double-count-object': 'Touch each one just once as you count!',
  'skip-count-sequence': 'Count slowly together so we don’t skip a number.',
  'count-from-zero': 'Start counting from 1, not 0!',

  // addition (within 20)
  'crossing-ten-misstep': 'When ones make ten or more, carry one ten!',
  'add-tens-to-ones': 'Add the small number to the ones place!',

  // shared add / subtract
  'operator-mixup': 'Check the sign: + puts together, − takes away!',
  'off-by-one': 'So close, recount carefully. You’re off by one!',

  // addition (2-digit, no-carry & carry) — misconceptions-reference.md
  'ones-addition-ignored': 'Nice tens! Now add both ones digits too.',
  'column-alignment-shift': 'Line up ones under ones before you add!',
  'add-across-columns': 'Add the ones first, then add the tens!',
  'forgot-carry': 'When ones pass nine, carry one ten over!',
  'write-full-sum-in-column': 'Only one digit fits in ones. Carry the ten!',
  'double-carry': 'Carry that extra ten once, to the tens only!',
  'carry-subtraction-instead': 'Carrying means adding one ten to the tens!',

  // subtraction (within 20 & 2-digit)
  'tens-ignored': 'Don’t forget the ten in a teen number!',
  'smaller-from-larger-force': 'Not enough ones? Borrow one ten first!',
  'digit-subtraction-isolation': 'Keep tens in the tens place, ones in ones!',
  'ones-subtraction-ignored': 'Don’t forget to subtract the ones column too!',
  'borrow-without-reducing-tens': 'When you borrow a ten, tens drop by one!',
  'regroup-ten-ones-shortchange': 'Add the borrowed ten to the ones already there!',
  'borrow-from-nowhere': 'Borrow one ten, and add ten to the ones!',

  // multiplication (mulIntro, mulTable)
  'multiplication-as-addition': '× means equal groups! Add the same group size.',
  'skip-count-misstep': 'Skip count carefully, one equal step at a time!',
  'multiplication-by-zero-identity': 'Any number of groups of zero is zero!',
  'add-instead-of-multiply': 'Look at ×, count equal groups instead of adding!',
  'multiplication-by-one-identity': 'Times 1 is one group, so the number stays!',
  'zero-identity-error': 'Any number times zero is always zero!',

  // comparing numbers
  'alligator-confusion': 'The hungry crocodile opens wide toward the BIGGER number!',
  'ones-digit-bias': 'Look at the whole number. Tens beat ones!',
  'digit-length-bias': 'More digits means bigger. Two digits beat one!',

  // numbers 21–99 (numbers21to99)
  'decade-transition-stall': 'After 9 ones, roll up to the next ten!',
  'decade-ten-overshoot': 'After 9, the next ten always ends in 0!',
  'before-instead-of-after': 'Count forward! What number comes right AFTER this?',
  'place-value-swap': 'Tens go on the left, ones on the right!',

  // place value: tens & ones (placeValue) and hundreds, tens, ones (counting3digit, placeValue3)
  'separate-digit-reading': 'Ones take the zero’s spot next to the tens!',
  'digit-reversal': 'Tens go on the left, ones on the right!',
  'expanded-addition': 'Count each ten as 10, then add the ones!',
  'tens-only-counted': 'You got the tens! Now add the ones too.',
  'expanded-concatenation': 'Put each digit in its house: hundreds, tens, ones!',
  'zero-placeholder-ignored': 'Keep 0 in an empty house as a placeholder!',
  'digit-value-blindness': 'Put each part into hundreds, tens, or ones!',
  'reverse-period-reading': 'Read left to right: hundreds, then tens, then ones!',
  'place-column-shift': 'Check the tens and ones houses before joining them!',

  // money: amounts & change (moneyAmounts)
  'smaller-from-larger-force-money': 'Need more ones? Trade one 10-note for ten 1-coins!',
  'ten-across-zero-borrow': 'Trading one 10-note leaves you one fewer 10-note!',

  // ordinal numbers (ordinal)
  'cardinal-confusion': 'Find the place in line, not the total!',
  'right-to-left-start': 'Start counting positions from the LEFT end!',

  // time: days & daily sequence (timeBasic)
  'before-after-reversal': 'Check the word: AFTER goes forward, BEFORE goes back!',
  'sequence-off-by-one': 'Say the order slowly. Don’t skip a step!',
  'cycle-wrap-error': 'After the last one, it wraps back to start!',

  // pre-number patterns & sorting (patterns, sorting)
  'ab-assumed-on-aab': 'Count how many repeat before the pattern switches!',
  'last-item-echo': 'Look from the start: does it repeat or switch?',
  'first-item-restart': 'Say the pattern out loud from the start!',
  'odd-one-out-inversion': 'Three belong together. Tap the ONE that is different!',
  'surface-feature-distraction': 'Think about what each thing IS, not its colour!',

  // measurement: length (measureLength)
  'count-marks-not-units': 'Count the blocks themselves, one by one!',
  'ruler-one-start-error': 'Start at 0 cm and count the centimetre jumps!',
  'end-mark-only-read': 'Started past 0? Subtract the start from the end!',

  // pre-number comparison & weight (compare, measureWeight)
  'opposite-attribute-confusion': 'Check the word: MORE/HEAVIER or FEWER/LIGHTER?',
  'quantity-size-illusion': 'Ignore object size. Count how MANY are in each!',
  'up-pan-is-heavier': 'On a balance scale, the HEAVIER side drops DOWN!',
  'size-weight-illusion': 'A balloon looks big, but air is super light!',

  // 2D shapes & spatial (shapes2d, spatial)
  'rotation-blindness': 'Tilt your head! A shape keeps its name tilted.',
  'square-rectangle-confusion': 'Squares have 4 equal sides; rectangles have 2 long!',
  'side-corner-count-slip': 'Touch each side or corner once as you count!',
  'curved-straight-mixup': 'A circle is round: 0 straight sides, 0 corners!',
  'opposite-spatial-term': 'Look closely: inside/outside, top/bottom, or near/far?',
  'vertical-horizontal-confusion': 'Check the question: high/low or inside/near?',

  // coins (moneyCoins)
  'size-value-bias': 'Coin size tricks you. Read the number on it!',
  'coin-count-as-value': 'Add the coin numbers, not how many coins!',
  'sum-as-concatenation': 'Add the coin values. Don’t stick digits together!',

  // capacity, clock, pictograph & basic fractions (measureCapacity, timeClock, pictograph, fractionsBasic)
  'container-count-confusion': 'Each jug holds the same. Add them all up!',
  'hand-size-reversal': 'Read the short hour hand, then the long minute!',
  'hour-hand-proximity': 'At half past, pick the number just passed!',
  'minute-numeric-literal': 'Count by 5s around the clock for minutes!',
  'half-hour-as-fifty': 'One hour is 60 minutes, so half is 30!',
  'off-by-one-hour': 'Look closely at which number the short hand passed!',
  'adjacent-row-read': 'Follow the named row across with your finger!',
  'total-instead-of-difference': 'To find how many MORE, subtract the smaller row!',
  'scale-factor-ignored': 'Check the key: each picture stands for 2!',
  'denominator-magnitude-bias': 'More pieces means smaller pieces! 1/2 beats 1/4.',
  'shaded-to-unshaded-ratio': 'The bottom number counts ALL equal parts!',
  'unshaded-complement-picked': 'Count only the SHADED parts for the top!',
  'double-instead-of-half': 'Half means sharing equally into 2, not doubling!',

  // generic nearby slip (no specific misconception)
  'random-slip': 'Oops, almost! Take another careful look.',
};

/** The tags the ready recipes can emit (every one has a hint above). */
export const REACHABLE_TAGS = Object.keys(HINTS);

/** Hint for a misconception tag; a gentle generic fallback for anything unmapped. */
export function getHint(tag) {
  return HINTS[tag] ?? 'Let’s try that one again together!';
}
