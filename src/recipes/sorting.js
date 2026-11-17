/**
 * Recipe: sorting & classification (Grade 1). Serves g1.prenum.sort. Format `mcq`.
 *
 * Rung 1 asks "Which one does NOT belong?" given 3 items from one category and 1 odd item out.
 * Rung 2 asks "Which one belongs with A B C?" given 3 items from a category and options that
 * include a colour/shape-matched distractor from another category.
 *
 * Distractors encode canonical misconceptions from misconceptions-reference.md
 * ("Pre-number — sorting & classification"):
 *   - odd-one-out-inversion       : picks one of the 3 matching items instead of the odd one out
 *   - surface-feature-distraction : matches by colour/shape rather than functional category
 */

const CATEGORIES = [
  { name: 'fruits', items: ['🍎', '🍌', '🍇', '🍉'], lure: '🚗' },
  { name: 'animals', items: ['🐶', '🐱', '🐰', '🐼'], lure: '🧸' },
  { name: 'vehicles', items: ['🚌', '🚲', '🚂', '✈️'], lure: '🎒' },
  { name: 'school', items: ['✏️', '📚', '🖍️', '📏'], lure: '🍌' },
];

const recipe = {
  skillId: 'g1.prenum.sort',
  maxDifficulty: 2,

  generate(difficulty, rng) {
    const catIdx = rng.int(0, CATEGORIES.length - 1);
    const cat = CATEGORIES[catIdx];
    const otherCats = CATEGORIES.filter((_, i) => i !== catIdx);

    if (difficulty === 1) {
      const sameThree = rng.shuffle(cat.items).slice(0, 3);
      const oddCat = rng.pick(otherCats);
      const oddItem = rng.pick(oddCat.items);

      const shown = rng.shuffle([...sameThree, oddItem]);
      const optionPairs = rng.shuffle([
        { value: oddItem, tag: null },
        ...sameThree.map((item) => ({ value: item, tag: 'odd-one-out-inversion' })),
      ]);

      return {
        questionText: `Which one does NOT belong?  ${shown.join(' ')}`,
        correctAnswer: oddItem,
        options: optionPairs.map((opt) => opt.value),
        format: 'mcq',
        misconceptions: optionPairs.map((opt) => opt.tag),
      };
    }

    // Difficulty 2: "Which one belongs with A B C?"
    const shuffledCat = rng.shuffle(cat.items);
    const promptGroup = shuffledCat.slice(0, 3);
    const answer = shuffledCat[3];

    const used = new Set([...promptGroup, answer]);
    const distractors = [];
    const addCandidate = (value, tag) => {
      if (!used.has(value) && distractors.length < 3) {
        used.add(value);
        distractors.push({ value, tag });
      }
    };

    addCandidate(cat.lure, 'surface-feature-distraction');
    for (const oc of rng.shuffle(otherCats)) {
      for (const item of rng.shuffle(oc.items)) {
        addCandidate(item, 'random-slip');
      }
    }

    const optionPairs = rng.shuffle([{ value: answer, tag: null }, ...distractors]);

    return {
      questionText: `Which one belongs with ${promptGroup.join(' ')}?`,
      correctAnswer: answer,
      options: optionPairs.map((opt) => opt.value),
      format: 'mcq',
      misconceptions: optionPairs.map((opt) => opt.tag),
    };
  },
};

export default recipe;
