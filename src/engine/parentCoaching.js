/**
 * parentCoaching — plain-language observations & 60-second offline home activities
 * for every diagnostic misconception tag (84/84 parity; excludes generic `random-slip`).
 *
 * Pure engine module (STANDARDS §2): no React, DOM, localStorage, or Date.now().
 * Tone: warm, encouraging, non-judgmental — never labels a child, never shows scores/counts.
 */

import { SKILLS } from '../recipes/skillMap.js';
import { isMastered } from './mastery.js';

/**
 * Selection rules for the "Tinku Noticed" card. Mistake counts in a skill state are lifetime totals that
 * never decay, so the card must not treat old history as current:
 *   - MIN_OCCURRENCES: one wrong tap is a slip or a guess, not a pattern worth a parent's evening.
 *   - RECENT_DAYS: only skills practised within this many days of `today` count as "recent practice".
 *   - mastered skills are skipped: whatever went wrong there has been overcome.
 */
export const NOTICED_MIN_OCCURRENCES = 2;
export const NOTICED_RECENT_DAYS = 14;

/** Whole days from ISO date `from` to ISO date `to` ('YYYY-MM-DD'); NaN when either is missing. */
function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

const COACHING = {
  // ── Counting ────────────────────────────────────────────────────────────────
  'double-count-object': {
    title: 'Counting one item twice',
    observation: 'When objects are clustered together, it is easy to lose track and touch the same one twice.',
    activity: 'Line up 8 spoons on the table and have your child slide each spoon aside one at a time while counting out loud.',
  },
  'skip-count-sequence': {
    title: 'Skipping a number in order',
    observation: 'Sometimes one number gets skipped when counting quickly, a very common slip at this age.',
    activity: 'Walk up 10 steps or clap 10 times together slowly, saying one number per step.',
  },
  'count-from-zero': {
    title: 'Starting counts from zero',
    observation: 'Sometimes counting starts at 0 on the first object, which leaves the total one short.',
    activity: 'Place 5 snacks in a row and tap the first one together saying "1!" clearly before counting the rest.',
  },

  // ── Addition (within 20) ────────────────────────────────────────────────────
  'crossing-ten-misstep': {
    title: 'Bridging across 10',
    observation: 'When ones add past 10 (like 8 + 5), the jump across 10 can get miscounted by one or two.',
    activity: 'Put 8 grapes on a plate and 5 beside it: move 2 over to "fill 10", then ask how many are left outside.',
  },
  'add-tens-to-ones': {
    title: 'Adding ones onto the tens',
    observation: 'When adding a single digit to a teen number (like 13 + 4), the 4 sometimes lands on the tens digit.',
    activity: 'Show 1 bundle of 10 straws and 3 loose straws, then hand over 4 more loose straws to count with the 3.',
  },

  // ── Shared Add / Subtract ───────────────────────────────────────────────────
  'operator-mixup': {
    title: 'Mixing up + and − signs',
    observation: 'Some answers follow the opposite sign: adding when the question says take away, or the other way round.',
    activity: 'Before answering 3 quick sums with buttons, ask your child to point to the sign and say "join" (+) or "take away" (−).',
  },
  'off-by-one': {
    title: 'Off by just one',
    observation: 'Some answers land just 1 above or below the right number, often from rushing the final count.',
    activity: 'Play a 1-minute finger check: have your child nod once per count on the last 3 numbers.',
  },

  // ── 2-Digit Addition ────────────────────────────────────────────────────────
  'ones-addition-ignored': {
    title: 'Adding tens, pausing on ones',
    observation: 'Some answers add the tens but keep only one number’s ones digit instead of adding both.',
    activity: 'Write 23 + 14 vertically and cover the tens with your thumb so only 3 + 4 shows first.',
  },
  'column-alignment-shift': {
    title: 'Lining up ones and tens',
    observation: 'When adding a 1-digit and 2-digit number, the single digit sometimes lines up under the tens.',
    activity: 'Draw two simple columns labelled "T" and "O" on scrap paper and place 24 and 3 in the right rooms.',
  },
  'add-across-columns': {
    title: 'Mixing digits across columns',
    observation: 'Tens and ones digits sometimes get combined across columns rather than ones-with-ones and tens-with-tens.',
    activity: 'Use coins of 10 and 1: put 10s on the left and 1s on the right, then push matching piles together.',
  },
  'forgot-carry': {
    title: 'Forgetting to carry the new ten',
    observation: 'When ones total 10 or more, the extra ten gets dropped instead of moving to the tens column.',
    activity: 'Bundle 10 toothpicks with a rubber band whenever loose ones reach 10, and move the bundle to the left.',
  },
  'write-full-sum-in-column': {
    title: 'Writing two digits in ones',
    observation: 'Instead of carrying 1 ten over, the full two-digit ones sum (like 13) gets squeezed into the answer.',
    activity: 'Remind them: "Only one digit fits in the ones room!" Trade 10 ones for 1 ten-coin together.',
  },
  'double-carry': {
    title: 'Carrying into both columns',
    observation: 'After making a new ten, the carried 1 sometimes gets added to both the tens and ones.',
    activity: 'Write a tiny "+1" above the tens column only, and say "new ten goes to the tens house."',
  },
  'carry-subtraction-instead': {
    title: 'Subtracting a carried ten',
    observation: 'The carried ten was spotted, but subtracted from the tens column instead of being added.',
    activity: 'Combine 18 + 6 with sticks: group 10 loose sticks into a bundle and ask "Did our tens pile grow or shrink?"',
  },

  // ── Subtraction (within 20 & 2-digit) ───────────────────────────────────────
  'tens-ignored': {
    title: 'Dropping the ten in teens',
    observation: 'When taking away from a teen number (like 17 − 4), the ten at the front sometimes gets dropped.',
    activity: 'Lay out 10 + 7 blocks, take 4 from the 7, and point out the 10-block is still sitting safe.',
  },
  'smaller-from-larger-force': {
    title: 'Flipping top and bottom digits',
    observation: 'When the bottom ones digit is bigger (like 32 − 8), kids often flip them and do 8 − 2.',
    activity: 'Hold 2 biscuits and ask: "Can I take 8 from 2 without opening a new pack of 10?"',
  },
  'digit-subtraction-isolation': {
    title: 'Subtracting ones from tens',
    observation: 'In two-digit minus one-digit problems, the single digit sometimes gets taken from the tens digit.',
    activity: 'Cover the tens digit with a coin so your child sees the ones subtraction first.',
  },
  'ones-subtraction-ignored': {
    title: 'Keeping the original ones',
    observation: 'Your child subtracted the tens neatly, then copied the first number’s ones unchanged.',
    activity: 'Circle the ones column first on two quick problems on paper before touching the tens.',
  },
  'borrow-without-reducing-tens': {
    title: 'Borrowing without lowering tens',
    observation: 'Your child remembered to add 10 to the ones, but forgot the tens digit goes down by 1.',
    activity: 'Trade 1 ten-note for ten 1-coins from a small tray so they physically see 1 fewer ten-note left.',
  },
  'regroup-ten-ones-shortchange': {
    title: 'Trading a ten for 10 ones',
    observation: 'When borrowing a ten, the ones sometimes jump straight to 10 instead of 10 plus the existing ones.',
    activity: 'Hold 3 coins, add a pile of 10 coins, and ask "How many ones do we have altogether now?"',
  },
  'borrow-from-nowhere': {
    title: 'Adding 10 without borrowing',
    observation: 'The ones grew by 10 to subtract, while the tens column stayed at its starting value.',
    activity: 'Use 3 bundles of ten and 2 loose sticks: open 1 bundle to subtract 5, and count the bundles left.',
  },

  // ── Multiplication ──────────────────────────────────────────────────────────
  'multiplication-as-addition': {
    title: 'Adding instead of equal groups',
    observation: 'Seeing × led to adding the two numbers once instead of counting equal groups.',
    activity: 'Set out 3 bowls with 2 grapes each and ask "3 groups of 2 — count by 2s!"',
  },
  'skip-count-misstep': {
    title: 'Slipping on a skip-count step',
    observation: 'Some answers land one step off while skip-counting up through equal groups.',
    activity: 'Clap and chant 2, 4, 6, 8, 10 (or 5s / 10s) together while waiting in line or riding.',
  },
  'multiplication-by-zero-identity': {
    title: 'Multiplying by zero',
    observation: 'Problems with × 0 sometimes feel like the number should stay unchanged instead of becoming 0.',
    activity: 'Place 4 empty plates on the table and ask: "4 plates with 0 biscuits each — how many biscuits?"',
  },
  'add-instead-of-multiply': {
    title: 'Reading × as +',
    observation: 'On times-table questions, the two numbers were added together rather than multiplied.',
    activity: 'Draw 2 dots on 5 sticky notes and tap each note while counting by 2s.',
  },
  'multiplication-by-one-identity': {
    title: 'Multiplying by 1',
    observation: 'Questions like 5 × 1 occasionally get mixed up with + 1 or 0.',
    activity: 'Show 1 bag holding 5 marbles: "1 group of 5 — how many marbles?"',
  },
  'zero-identity-error': {
    title: 'Groups of zero',
    observation: 'Multiplying by 0 occasionally returned the other number instead of 0.',
    activity: 'Hold out 0 bags of 5 coins and ask how many coins are in your hand.',
  },

  // ── Comparing Numbers ───────────────────────────────────────────────────────
  'alligator-confusion': {
    title: 'Flipping < and > signs',
    observation: 'Sometimes the < or > sign gets flipped, so it points the wrong way.',
    activity: 'Draw two dots beside the bigger number and one dot beside the smaller, then connect them into the open mouth.',
  },
  'ones-digit-bias': {
    title: 'Looking at ones before tens',
    observation: 'When comparing 19 and 21, the big 9 in the ones spot can distract from the 2 in tens.',
    activity: 'Compare 19 vs 21 using 10-bundles and loose sticks: "Which pile has more 10-bundles?"',
  },
  'digit-length-bias': {
    title: 'Comparing digit count vs. digit size',
    observation: 'A single large digit (like 9) can look bigger than a two-digit number with small digits (like 12).',
    activity: 'Ask: "Would you rather have 9 single coins or a 10-note plus 2 coins?"',
  },

  // ── Numbers 21–99 ───────────────────────────────────────────────────────────
  'decade-transition-stall': {
    title: 'Rolling over after 9 (29 → 30)',
    observation: 'Counting smoothly within a ten is strong, while stepping from 29 to 30 or 49 to 50 pauses.',
    activity: 'Practice "what comes after 29, 39, 49?" in the car or at bedtime using a quick 30-second chant.',
  },
  'decade-ten-overshoot': {
    title: 'Skipping past the round ten',
    observation: 'Right after a number ending in 9 (like 39), counting sometimes jumps straight to 41, skipping 40.',
    activity: 'Write 38, 39, __, 41 on a napkin and let your child fill in the round ten landing on 0.',
  },
  'before-instead-of-after': {
    title: 'Stepping back instead of forward',
    observation: 'When asked what comes next, the number right before was picked instead.',
    activity: 'Point left-to-right along 3 numbers on a ruler and ask "Which way do numbers grow?"',
  },
  'place-value-swap': {
    title: 'Swapping tens and ones digits',
    observation: 'The two digits are right, just flipped (such as reading 42 as 24).',
    activity: 'Build 42 with 4 bundles on the left and 2 singles on the right, reading left-to-right.',
  },

  // ── Place Value (2- & 3-digit) ──────────────────────────────────────────────
  'separate-digit-reading': {
    title: 'Sticking 10 and 4 together as 104',
    observation: 'Seeing "3 tens and 4 ones" sometimes turns into 30 + 4 written side by side as 304.',
    activity: 'Write 30 on one paper strip and 4 on a tiny strip, then slide the 4 right over the 0!',
  },
  'digit-reversal': {
    title: 'Reversing tens and ones order',
    observation: 'Tens and ones got swapped around when turning blocks into a two-digit number.',
    activity: 'Always ask "How many big ten-bundles first?" before writing the loose ones on the right.',
  },
  'expanded-addition': {
    title: 'Adding tens count + ones count directly',
    observation: 'When seeing 3 tens and 4 ones, 3 + 4 = 7 was added instead of 30 + 4.',
    activity: 'Count 3 bundles of ten by 10s ("10, 20, 30"), then count on the 4 single pieces.',
  },
  'tens-only-counted': {
    title: 'Stopping after counting the tens',
    observation: 'Some answers count the tens (like 30) but stop before adding the loose ones.',
    activity: 'Tap the tens pile ("30!") and then sweep your hand to the ones ("plus 4 more!").',
  },
  'expanded-concatenation': {
    title: 'Joining 300 + 40 + 5 as 300405',
    observation: 'Expanded parts sometimes get written end-to-end instead of stacked into hundreds, tens, and ones.',
    activity: 'Stack three strips — 300, 40, and 5 — aligned on the right edge to watch the zeros hide!',
  },
  'zero-placeholder-ignored': {
    title: 'Dropping the 0 placeholder',
    observation: 'In numbers like 305, the empty tens place was skipped, turning 305 into 35.',
    activity: 'Draw 3 boxes (H, T, O) and put a big 0 inside the empty middle box so the 3 stays in Hundreds.',
  },
  'digit-value-blindness': {
    title: 'Confusing digit face value and place value',
    observation: 'The digit 4 in 345 means 40, though it can look like just 4.',
    activity: 'Ask "Is that 4 worth 4 single coins or 4 ten-notes?" on any 3-digit house number you pass.',
  },
  'reverse-period-reading': {
    title: 'Reading 3-digit parts back-to-front',
    observation: 'Hundreds and ones occasionally trade places when building a 3-digit number.',
    activity: 'Point left-to-right across 3 cards: "Big Hundreds first, Tens middle, Ones last."',
  },
  'place-column-shift': {
    title: 'Shifting tens into hundreds or ones',
    observation: 'A digit landed in the neighbouring place-value house (such as 340 instead of 304).',
    activity: 'Say the number aloud slowly ("three hundred AND five") to hear whether any tens were named.',
  },

  // ── Money ───────────────────────────────────────────────────────────────────
  'smaller-from-larger-force-money': {
    title: 'Flipping digits on money change',
    observation: 'When making change requires trading a 10-note for ones, the ones digits got flipped.',
    activity: 'Role-play a tiny shop: hand over a 10-note for an item costing 4 coins and count the change together.',
  },
  'ten-across-zero-borrow': {
    title: 'Change across a round 10',
    observation: 'When trading a 10-note to pay ones, the 10-notes count stayed 1 too high.',
    activity: 'Swap one 10-coin for ten 1-coins in your palm so your child sees the 10-pile shrink by 1.',
  },
  'size-value-bias': {
    title: 'Judging coin value by size',
    observation: 'Larger-looking coins can trick kids into thinking they have a higher number value.',
    activity: 'Put 2 different coins side by side and ask your child to read only the printed numbers.',
  },
  'coin-count-as-value': {
    title: 'Counting how many coins instead of value',
    observation: 'Three coins worth 5, 2, and 1 were counted as "3" instead of adding 5 + 2 + 1.',
    activity: 'Tap each coin and count up by its number ("5... 6, 7... 8!") rather than counting 1, 2, 3.',
  },
  'sum-as-concatenation': {
    title: 'Putting coin digits side by side',
    observation: 'Coins like 5 and 2 were joined as 52 instead of added to make 7.',
    activity: 'Place two coins in two bowls, then pour them into one bowl asking "How much altogether?"',
  },

  // ── Ordinal Numbers ─────────────────────────────────────────────────────────
  'cardinal-confusion': {
    title: 'Counting the total instead of position',
    observation: 'When asked which spot an animal is in, the total number in the line was picked instead.',
    activity: 'Line up 5 toys and ask: "How many toys total? Now point to the 3rd toy only!"',
  },
  'right-to-left-start': {
    title: 'Counting positions from the right end',
    observation: 'Some answers count positions from the right side instead of the left.',
    activity: 'Put a sticker on the left edge of a toy queue to mark "Start (1st) here!"',
  },

  // ── Time & Sequence ─────────────────────────────────────────────────────────
  'before-after-reversal': {
    title: 'Swapping BEFORE and AFTER',
    observation: 'Your child stepped one day/part in the wrong direction when reading BEFORE vs. AFTER.',
    activity: 'At breakfast ask: "What meal came BEFORE this? What comes AFTER?"',
  },
  'sequence-off-by-one': {
    title: 'Skipping a day in the week',
    observation: 'The direction was right, and one day in the week sequence was skipped over.',
    activity: 'Sing the 7 days of the week together once while brushing teeth.',
  },
  'cycle-wrap-error': {
    title: 'Wrapping Sunday back to Monday',
    observation: 'Crossing from the end of the week (Sunday) back to Monday — or Night back to Morning — is tricky.',
    activity: 'Point out at bedtime: "After Sunday night, the week starts fresh on Monday morning!"',
  },

  // ── Patterns & Sorting ──────────────────────────────────────────────────────
  'ab-assumed-on-aab': {
    title: 'Assuming an A-B pattern on A-A-B',
    observation: 'On repeating patterns like 🍎🍎🍌, your child alternated every item instead of repeating two first.',
    activity: 'Build spoon-spoon-fork, spoon-spoon-fork on the table and chant the rhythm together.',
  },
  'last-item-echo': {
    title: 'Repeating the last item seen',
    observation: 'Instead of checking the repeating rule, the last item in the row was picked again.',
    activity: 'Cover the end of a 4-item Lego pattern and ask your child to say the whole rhythm from the start.',
  },
  'first-item-restart': {
    title: 'Jumping back to the first item too soon',
    observation: 'The pattern restarted from item #1 before finishing the current group.',
    activity: 'Circle each repeating chunk on paper (like [A A B] [A A B]) so the boundary stands out.',
  },
  'odd-one-out-inversion': {
    title: 'Picking a matching item in Odd-One-Out',
    observation: 'Instead of tapping the one item that doesn’t belong, one of the matching group was tapped.',
    activity: 'Place 3 fruits and 1 sock on the table and ask: "Which one can’t go in a fruit salad?"',
  },
  'surface-feature-distraction': {
    title: 'Grouping by colour instead of category',
    observation: 'Items got matched by look/colour rather than what family they belong to (animals, vehicles, food).',
    activity: 'Sort 4 kitchen items vs. 1 toy car together, naming *what they are for* rather than their colour.',
  },

  // ── Measurement (Length & Weight & Capacity) ────────────────────────────────
  'count-marks-not-units': {
    title: 'Counting tick marks instead of spaces',
    observation: 'When measuring with blocks or units, the lines/ends get counted instead of the spaces between.',
    activity: 'Lay 4 paperclips end-to-end next to a crayon and touch the middle of each paperclip as you count.',
  },
  'ruler-one-start-error': {
    title: 'Starting from 1 cm instead of 0 cm',
    observation: 'Objects aligned at 1 cm instead of 0 cm read 1 cm longer than their true length.',
    activity: 'Line up a pencil on a ruler starting right at 0, then slide it to 1 to compare how the end mark moves.',
  },
  'end-mark-only-read': {
    title: 'Reading only the end mark on a ruler',
    observation: 'When an object starts past 0 (like 2 cm to 7 cm), the end mark (7) was read without subtracting 2.',
    activity: 'Put a toothpick from 3 cm to 6 cm on a ruler and count the actual centimetre jumps between 3 and 6.',
  },
  'opposite-attribute-confusion': {
    title: 'Swapping MORE/HEAVIER with FEWER/LIGHTER',
    observation: 'Some answers match the opposite word: the group with fewer when asked for more, or lighter for heavier.',
    activity: 'Have your child underline or say the magic word ("MORE" or "FEWER") aloud before counting.',
  },
  'quantity-size-illusion': {
    title: 'Letting bigger objects look like "more"',
    observation: 'A few large items (like 3 watermelons) look like more than 5 tiny items (like strawberries).',
    activity: 'Compare 2 big pillows vs. 4 small socks on the floor: "Which pile looks huge, and which has MORE items?"',
  },
  'up-pan-is-heavier': {
    title: 'Thinking the higher pan is heavier',
    observation: 'On a balance scale, it is easy to confuse the higher pan for the heavier side.',
    activity: 'Hold a heavy mug in one hand and a tissue in the other — drop the heavy hand down like a seesaw.',
  },
  'size-weight-illusion': {
    title: 'Thinking big always means heavy',
    observation: 'Big light objects (like a balloon) seem heavier than tiny dense objects.',
    activity: 'Let your child hold an inflated balloon in one hand and a small apple or spoon in the other.',
  },
  'container-count-confusion': {
    title: 'Counting jugs instead of litres',
    observation: 'Three 2-litre jugs were counted as 3 litres total instead of adding 2 + 2 + 2.',
    activity: 'Fill 3 small cups with 2 spoonfuls of water each and count the spoonfuls as you pour them into a bowl.',
  },

  // ── 2D Shapes & Spatial ─────────────────────────────────────────────────────
  'rotation-blindness': {
    title: 'Not recognising a tilted shape',
    observation: 'A square or triangle turned on its corner can look like a different shape (e.g., a diamond).',
    activity: 'Cut a paper square, tilt it 45°, and rotate it back together to show it is still the exact same square.',
  },
  'square-rectangle-confusion': {
    title: 'Mixing up squares and rectangles',
    observation: 'Squares and rectangles both have 4 corners, making it easy to confuse equal vs. long sides.',
    activity: 'Find a coaster (square) and a book cover (rectangle) and trace all 4 sides with a finger.',
  },
  'side-corner-count-slip': {
    title: 'Slipping when counting sides or corners',
    observation: 'One side or corner was counted twice or missed on polygons.',
    activity: 'Put a tiny sticker or finger on the first corner of a triangle/pentagon so you know where to stop.',
  },
  'curved-straight-mixup': {
    title: 'Giving a circle 1 side or corner',
    observation: 'A circle’s smooth curve sometimes gets counted as "1 side".',
    activity: 'Trace a bangle vs. a coaster: feel where corners poke on the square and stay smooth on the circle.',
  },
  'opposite-spatial-term': {
    title: 'Mixing up opposite position words',
    observation: 'Pairs like inside/outside, top/bottom, or near/far occasionally flipped.',
    activity: 'Play a 30-second toy game: "Put the teddy INSIDE the box... now ON TOP... now FAR from it!"',
  },
  'vertical-horizontal-confusion': {
    title: 'Mixing high/low with near/inside',
    observation: 'Up/down position words occasionally got mixed with closeness words.',
    activity: 'Point up to the ceiling ("top") and down to the floor ("bottom"), then step close/far from a chair.',
  },

  // ── Clock ───────────────────────────────────────────────────────────────────
  'hand-size-reversal': {
    title: 'Swapping the hour and minute hands',
    observation: 'The long minute hand was read as the hour, or the short hour hand as the minutes.',
    activity: 'Say the clock trick together: "Short name = Hour (short hand), Long name = Minute (long hand)."',
  },
  'hour-hand-proximity': {
    title: 'Reading the next hour at half past',
    observation: 'At 3:30, the hour hand sits halfway between 3 and 4, so it is easy to read 4:30.',
    activity: 'Trace clockwise from 3 toward 4 on a wall clock: "It hasn’t reached 4 yet, so it’s still 3-something!"',
  },
  'minute-numeric-literal': {
    title: 'Reading the 6 on the clock as :06',
    observation: 'When the minute hand points to 6, it stands for 30 minutes rather than 6 minutes.',
    activity: 'Point around 12, 3, 6, 9 on a clock face counting "0, 15, 30, 45" together.',
  },
  'half-hour-as-fifty': {
    title: 'Reading half past as :50',
    observation: 'Because half of 100 is 50, half an hour can feel like :50 instead of :30.',
    activity: 'Remind them an hour has 60 minutes, and split 6 tens in half on fingers (3 tens = 30).',
  },
  'off-by-one-hour': {
    title: 'Off by 1 hour on elapsed time',
    observation: 'Adding hours on the clock landed 1 hour early or late.',
    activity: 'Count hours forward on fingers from the clock time ("4 o’clock plus 2 hours: 5, 6!").',
  },

  // ── Pictograph ──────────────────────────────────────────────────────────────
  'adjacent-row-read': {
    title: 'Reading the neighbouring chart row',
    observation: 'Some answers come from the row just above or below the one asked about.',
    activity: 'Have your child place a finger on the named picture/word and slide straight across that row.',
  },
  'total-instead-of-difference': {
    title: 'Adding rows instead of finding "how many more"',
    observation: 'When asked how many more one row has, the two rows were added instead of compared.',
    activity: 'Line up 5 forks and 3 spoons in two matching rows and ask "How many forks have no partner?"',
  },
  'scale-factor-ignored': {
    title: 'Forgetting the picture key (× 2)',
    observation: 'Each picture stood for 2 items, and the pictures were counted as 1 each.',
    activity: 'Point to the "Key: 1 picture = 2" box first, then tap each picture counting "2, 4, 6!".',
  },

  // ── Fractions ───────────────────────────────────────────────────────────────
  'denominator-magnitude-bias': {
    title: 'Thinking 1/4 is bigger than 1/2',
    observation: 'Because 4 is bigger than 2, 1/4 can look larger than 1/2.',
    activity: 'Fold one paper strip in 2 and another in 4: compare one piece of each to see 1/2 is much larger.',
  },
  'shaded-to-unshaded-ratio': {
    title: 'Putting unshaded parts on the bottom',
    observation: 'For 1 shaded out of 4 parts, the bottom number was written as 3 (unshaded) instead of 4 (all parts).',
    activity: 'Cut a toast or chapati into 4 slices, take 1 slice, and count ALL 4 slices for the bottom number.',
  },
  'unshaded-complement-picked': {
    title: 'Counting shaded vs. unshaded parts',
    observation: 'The fraction read the shaded parts when asked for unshaded (or vice versa).',
    activity: 'Point to the word SHADED or UNSHADED in the prompt before counting the parts.',
  },
  'double-instead-of-half': {
    title: 'Doubling instead of finding half',
    observation: 'When asked for 1/2 of a group, the total was doubled instead of split into 2 equal shares.',
    activity: 'Share 8 grapes fairly into 2 bowls ("one for you, one for me") and count one bowl.',
  },
};

/**
 * Look up a parent coaching entry for a diagnostic misconception tag.
 * Returns null for `random-slip` or unmapped tags.
 */
export function getParentCoaching(tag) {
  return COACHING[tag] ?? null;
}

/**
 * Pick the top `limit` (default 2) recent diagnostic misconception coaching cards
 * for the active grade from stored `skillStates`. Pure, deterministic, zero PII/counts exposed.
 *
 * A tag qualifies only when, summed over the skills that count (same grade, not mastered, and practised
 * within `recentDays` of `today` when `today` is given), it occurred at least `minOccurrences` times.
 *
 * @param {Record<string, object>} skillStates
 * @param {{ grade?: number, today?: string, limit?: number, minOccurrences?: number, recentDays?: number }} [opts]
 */
export function pickTinkuNoticed(
  skillStates,
  {
    grade,
    today,
    limit = 2,
    minOccurrences = NOTICED_MIN_OCCURRENCES,
    recentDays = NOTICED_RECENT_DAYS,
  } = {},
) {
  const byTag = new Map();

  for (const [skillId, state] of Object.entries(skillStates ?? {})) {
    const skill = SKILLS[skillId];
    if (!skill) continue;
    if (grade != null && skill.grade !== grade) continue;
    if (state && isMastered(state)) continue;
    if (today && !(daysBetween(state?.lastSeen, today) <= recentDays)) continue;

    const lastSeen = state?.lastSeen ?? '';
    const misconceptions = state?.misconceptions ?? {};

    for (const [tag, count] of Object.entries(misconceptions)) {
      if (!count || count <= 0) continue;
      const coaching = getParentCoaching(tag);
      if (!coaching) continue;

      const existing = byTag.get(tag);
      const skillName = skill.displayName ?? skill.name;
      if (!existing) {
        byTag.set(tag, {
          tag,
          skillName,
          lastSeen,
          count,
          ...coaching,
        });
      } else {
        existing.count += count;
        if (lastSeen > existing.lastSeen) {
          existing.lastSeen = lastSeen;
          existing.skillName = skillName;
        }
      }
    }
  }

  return [...byTag.values()]
    .filter((item) => item.count >= minOccurrences)
    .sort((a, b) => (
      b.lastSeen.localeCompare(a.lastSeen) ||
      b.count - a.count ||
      a.tag.localeCompare(b.tag)
    ))
    .slice(0, limit)
    .map(({ tag, skillName, title, observation, activity }) => ({
      tag,
      skillName,
      title,
      observation,
      activity,
    }));
}
