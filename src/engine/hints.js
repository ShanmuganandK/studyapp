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
  'double-count-object': 'Touch each one just once as you count — don’t count the same one twice!',
  'skip-count-sequence': 'Let’s count slowly together so we don’t skip a number.',
  'count-from-zero': 'Start counting from 1, not 0!',

  // addition (within 20)
  'crossing-ten-misstep': 'When the ones make more than ten, carry that ten over too!',
  'add-tens-to-ones': 'Add the small number to the ones, not onto the ten.',

  // shared add / subtract
  'operator-mixup': 'Check the sign: + puts the groups together, − takes some away.',
  'off-by-one': 'So close — recount your last step, you’re off by just one.',

  // addition (2-digit, no-carry & carry) — misconceptions-reference.md
  'ones-addition-ignored': 'You got the tens right! Now add the ones from BOTH numbers together too.',
  'column-alignment-shift': 'Line up the ones under the ones before you add or subtract!',
  'add-across-columns': 'Add the ones column first, then add the tens column separately!',
  'forgot-carry': 'When the ones make 10 or more, carry that extra ten to the tens column!',
  'write-full-sum-in-column': 'Only one digit fits in the ones place — carry the extra ten over!',
  'double-carry': 'You made one new ten! Add it only to the tens column, not the ones.',
  'carry-subtraction-instead': 'Carrying a ten means ADDING 1 more ten to the tens column!',

  // subtraction (within 20 & 2-digit)
  'tens-ignored': 'Don’t forget the ten! A teen number is ten and some ones.',
  'smaller-from-larger-force': 'Can’t take the ones away? Borrow a ten first!',
  'digit-subtraction-isolation': 'Keep the tens answer in the tens place and the ones in the ones place!',
  'ones-subtraction-ignored': 'Don’t forget to subtract the ones column too!',
  'borrow-without-reducing-tens': 'When you borrow a ten for the ones, the tens column goes down by 1!',
  'regroup-ten-ones-shortchange': 'Add the borrowed 10 to the ones already there!',
  'borrow-from-nowhere': 'When you take 1 ten from the tens column, give those 10 ones to the ones column!',

  // multiplication (mulIntro, mulTable)
  'multiplication-as-addition': '× means equal groups! Add the same group size over and over.',
  'skip-count-misstep': 'Skip count carefully by one step at a time!',
  'multiplication-by-zero-identity': 'Any number of groups of zero is still zero!',
  'add-instead-of-multiply': 'Look at the × sign — count equal groups instead of adding the two numbers!',
  'multiplication-by-one-identity': 'Multiplying by 1 means just one group — the number stays the same!',
  'zero-identity-error': 'Any number times zero is always zero!',

  // comparing numbers
  'alligator-confusion': 'The hungry crocodile always opens wide to eat the BIGGER number!',
  'ones-digit-bias': 'Look at the whole number — a ten is more than a few ones.',
  'digit-length-bias': 'More digits means bigger — a two-digit number has a ten!',

  // numbers 21–99 (numbers21to99)
  'decade-transition-stall': 'After 9 ones comes a brand new ten! Roll up to the next ten.',
  'decade-ten-overshoot': 'When 9 ones roll over to the next ten, the ones reset to 0!',
  'before-instead-of-after': 'We are counting forward! What number comes NEXT after this one?',
  'place-value-swap': 'Tens go on the left, ones go on the right!',

  // place value: tens & ones (placeValue) and hundreds, tens, ones (counting3digit, placeValue3)
  'separate-digit-reading': 'When the ones join the tens, they take the zero’s place!',
  'digit-reversal': 'Tens go on the left, ones go on the right!',
  'expanded-addition': 'Each ten is a bundle of 10! Count the tens as 10s, then add the ones.',
  'tens-only-counted': 'You got the tens right! Now add the ones too.',
  'expanded-concatenation': 'Put each digit in its own house: hundreds, tens, then ones!',
  'zero-placeholder-ignored': 'Keep a 0 in the empty house so every digit stays in the right place!',
  'digit-value-blindness': 'Put each part into its own house: hundreds, tens, then ones!',
  'reverse-period-reading': 'Read from left to right: hundreds first, then tens, then ones!',
  'place-column-shift': 'Check the tens and ones houses carefully before putting them together!',

  // money: amounts & change (moneyAmounts)
  'smaller-from-larger-force-money': 'Can’t subtract from 0 ones? Exchange one ₹10 note for ten ₹1 coins first!',
  'ten-across-zero-borrow': 'When you exchange one ₹10 note for ones, you have one less ₹10 note!',

  // ordinal numbers (ordinal)
  'cardinal-confusion': 'We want the position in line, not how many there are in all!',
  'right-to-left-start': 'Start counting positions from the LEFT end of the line!',

  // time: days & daily sequence (timeBasic)
  'before-after-reversal': 'Check the word carefully: AFTER moves forward, BEFORE goes back one step!',
  'sequence-off-by-one': 'Say the order slowly one by one — don’t skip a step!',
  'cycle-wrap-error': 'When the week or day ends, it wraps right back around to the start!',

  // pre-number patterns & sorting (patterns, sorting)
  'ab-assumed-on-aab': 'Count how many of the first kind appear together before the pattern switches!',
  'last-item-echo': 'Look at the whole pattern from the start — does it repeat or switch next?',
  'first-item-restart': 'Say the pattern out loud from the beginning to hear what comes next!',
  'odd-one-out-inversion': 'Three of these belong to the same family — tap the ONE that is different!',
  'surface-feature-distraction': 'Think about what kind of thing each item is, not just how it looks!',

  // measurement: length (measureLength)
  'count-marks-not-units': 'Count the blocks themselves, one by one!',
  'ruler-one-start-error': 'Start measuring from the 0 cm mark and count the centimetre jumps!',
  'end-mark-only-read': 'When an object starts past 0 cm, subtract the starting mark from the end mark!',

  // pre-number comparison & weight (compare, measureWeight)
  'opposite-attribute-confusion': 'Check the question word carefully — are we looking for MORE/HEAVIER or FEWER/LIGHTER?',
  'quantity-size-illusion': 'Big items take up space, so count how MANY are in each group!',
  'up-pan-is-heavier': 'On a balance scale, the HEAVIER side always pushes DOWN!',
  'size-weight-illusion': 'A balloon looks big, but it is filled with air and is very light!',

  // 2D shapes & spatial (shapes2d, spatial)
  'rotation-blindness': 'Turn your head! A shape keeps its name even when it is tilted.',
  'square-rectangle-confusion': 'A square has 4 equal sides; a rectangle has 2 long sides and 2 short sides!',
  'side-corner-count-slip': 'Touch each side or corner one by one as you count!',
  'curved-straight-mixup': 'A circle goes round and round — it has 0 straight sides and 0 corners!',
  'opposite-spatial-term': 'Look closely at the picture — check inside vs outside, top vs bottom, near vs far!',
  'vertical-horizontal-confusion': 'Check whether the question is about high/low or inside/near!',

  // coins (moneyCoins)
  'size-value-bias': 'Coin size doesn’t tell the value — read the ₹ number on the coin!',
  'coin-count-as-value': 'Add the ₹ numbers printed on the coins, not just how many coins there are!',
  'sum-as-concatenation': 'Add the rupee numbers together instead of putting the digits side by side!',

  // capacity, clock, pictograph & basic fractions (measureCapacity, timeClock, pictograph, fractionsBasic)
  'container-count-confusion': 'Each jug holds the same number of litres — add that amount for every jug!',
  'hand-size-reversal': 'Read the short hour hand first, then the long minute hand!',
  'hour-hand-proximity': 'At half past, the hour hand is halfway to the next number — use the number it just passed!',
  'minute-numeric-literal': 'For the minute hand, count by 5s around the clock!',
  'half-hour-as-fifty': 'An hour has 60 minutes, so half an hour is 30 minutes, not 50!',
  'off-by-one-hour': 'Look closely at which number the short hour hand is pointing to!',
  'adjacent-row-read': 'Follow the row for the item named in the question across with your finger!',
  'total-instead-of-difference': 'To find how many MORE, subtract the smaller row from the bigger row!',
  'scale-factor-ignored': 'Check the key at the bottom — each picture stands for 2!',
  'denominator-magnitude-bias': 'More equal pieces means each piece is SMALLER! 1/2 is bigger than 1/4.',
  'shaded-to-unshaded-ratio': 'The bottom number counts ALL equal parts in the whole shape!',
  'unshaded-complement-picked': 'Count the SHADED parts for the top number!',
  'double-instead-of-half': 'Half means sharing equally into 2 parts, not doubling!',

  // generic nearby slip (no specific misconception)
  'random-slip': 'Oops, almost! Take another careful look.',
};

/** The tags the ready recipes can emit (every one has a hint above). */
export const REACHABLE_TAGS = Object.keys(HINTS);

/** Hint for a misconception tag; a gentle generic fallback for anything unmapped. */
export function getHint(tag) {
  return HINTS[tag] ?? 'Let’s try that one again together!';
}
