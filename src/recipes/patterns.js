/**
 * Recipe: simple patterns AB, AAB, ABB, ABC (Grade 1). Serves g1.prenum.patterns. Format `mcq`
 * (string glyph options).
 *
 * Rung 1 generates alternating AB patterns ("🍎 🍌 🍎 🍌 ?").
 * Rung 2 generates 3-item cycle patterns: AAB ("🔴 🔴 🔵 🔴 ?"), ABB, or ABC.
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Pre-number — simple patterns (AB, AAB)"):
 *   - ab-assumed-on-aab : treats an AAB/ABB pattern as simple AB alternation
 *   - last-item-echo    : repeats the last shown item when the pattern should switch
 *   - first-item-restart: restarts with seq[0] mid-cycle
 */

const OPTION_COUNT = 4;
const POOLS = [
  ['🍎', '🍌', '🍇', '🍉', '🍓'],
  ['🔴', '🔵', '🟢', '🟣', '🟠'],
  ['🐶', '🐱', '🐰', '🐼', '🐸'],
  ['🌸', '🌼', '🌻', '🌷', '🍀'],
];

const recipe = {
  skillId: 'g1.prenum.patterns',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    const pool = rng.shuffle(rng.pick(POOLS));
    const [A, B, C, D, E] = pool;

    let seq;
    let answer;
    let abAssumedValue = null;

    if (difficulty === 1) {
      // AB pattern: length 4 (A B A B -> A) or length 5 (A B A B A -> B)
      const len = rng.int(4, 5);
      seq = Array.from({ length: len }, (_, i) => (i % 2 === 0 ? A : B));
      answer = len % 2 === 0 ? A : B;
    } else {
      const kind = rng.pick(['AAB_AT_4', 'AAB_AT_5', 'ABB_AT_5', 'ABC_AT_5']);
      if (kind === 'AAB_AT_4') {
        // A A B A ? -> A (a child assuming AB picks B)
        seq = [A, A, B, A];
        answer = A;
        abAssumedValue = B;
      } else if (kind === 'AAB_AT_5') {
        // A A B A A ? -> B
        seq = [A, A, B, A, A];
        answer = B;
      } else if (kind === 'ABB_AT_5') {
        // A B B A B ? -> B (a child assuming AB picks A)
        seq = [A, B, B, A, B];
        answer = B;
        abAssumedValue = A;
      } else {
        // A B C A B ? -> C
        seq = [A, B, C, A, B];
        answer = C;
      }
    }

    const used = new Set([answer]);
    const distractors = [];
    const addCandidate = (value, tag) => {
      if (value && !used.has(value) && distractors.length < OPTION_COUNT - 1) {
        used.add(value);
        distractors.push({ value, tag });
      }
    };

    if (abAssumedValue) {
      addCandidate(abAssumedValue, 'ab-assumed-on-aab');
    }
    const lastItem = seq[seq.length - 1];
    if (lastItem !== answer) {
      addCandidate(lastItem, 'last-item-echo');
    }
    if (seq[0] !== answer) {
      addCandidate(seq[0], 'first-item-restart');
    }

    for (const extra of [C, D, E, A, B]) {
      addCandidate(extra, 'random-slip');
    }

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);

    return {
      questionText: `What comes next?  ${seq.join(' ')} ?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
    };
  },
};

export default recipe;
