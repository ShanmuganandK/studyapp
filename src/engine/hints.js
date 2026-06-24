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

  // subtraction (within 20)
  'tens-ignored': 'Don’t forget the ten! A teen number is ten and some ones.',
  'smaller-from-larger-force': 'Can’t take the ones away? Borrow a ten first!',

  // comparing numbers
  'alligator-confusion': 'The hungry crocodile always opens wide to eat the BIGGER number!',
  'ones-digit-bias': 'Look at the whole number — a ten is more than a few ones.',
  'digit-length-bias': 'More digits means bigger — a two-digit number has a ten!',

  // generic nearby slip (no specific misconception)
  'random-slip': 'Oops, almost! Take another careful look.',
};

/** The tags the ready recipes can emit (every one has a hint above). */
export const REACHABLE_TAGS = Object.keys(HINTS);

/** Hint for a misconception tag; a gentle generic fallback for anything unmapped. */
export function getHint(tag) {
  return HINTS[tag] ?? 'Let’s try that one again together!';
}
