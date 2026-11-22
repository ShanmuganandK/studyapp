// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import QuestionView from '../QuestionView';

/**
 * Regression test for a real bug: `mcq` questions all rendered at the large `text-question`
 * font size, sized for compact equations ("27 + 1 = ?"). counting3digit.js's sentence-style
 * text ("1 hundred, 3 tens and 0 ones make ?") overflowed at that size and got visually cut
 * off mid-sentence on a real device — a child could see "1 hundred," and nothing after it,
 * with no way to tell which option was correct. `QuestionView` now falls back to the smaller
 * `text-prompt` token (already used for the compare/count-objects sentence prompts) once the
 * question text passes a length threshold.
 */

afterEach(cleanup);

describe('QuestionView — mcq font sizing', () => {
  it('uses the large text-question token for a compact equation', () => {
    const question = { format: 'mcq', questionText: '27 + 1 = ?' };
    render(<QuestionView question={question} />);
    const el = screen.getByText('27 + 1 = ?');
    expect(el.className).toContain('text-question');
    expect(el.className).not.toContain('text-prompt');
  });

  it('falls back to the smaller text-prompt token for a long sentence-style question', () => {
    const question = { format: 'mcq', questionText: '1 hundred, 3 tens and 0 ones make ?' };
    render(<QuestionView question={question} />);
    const el = screen.getByText('1 hundred, 3 tens and 0 ones make ?');
    expect(el.className).toContain('text-prompt');
    expect(el.className).not.toContain('text-question');
  });
});

describe('QuestionView — visual format trays (Batch 3)', () => {
  it('renders unit-length block tray', () => {
    render(
      <QuestionView
        question={{
          format: 'unit-length',
          questionText: 'How many blocks long is the pencil?',
          render: { objectGlyph: '✏️', unitGlyph: '🟦', count: 4 },
        }}
      />,
    );
    expect(screen.getByLabelText('4 unit blocks')).toBeTruthy();
  });

  it('renders shape-mcq SVG with rotation when rotated=true', () => {
    render(
      <QuestionView
        question={{
          format: 'shape-mcq',
          questionText: 'This shape is tilted! Which 2D shape is it?',
          render: { shape: 'square', rotated: true },
        }}
      />,
    );
    const svg = screen.getByRole('img', { name: 'square' });
    expect(svg.style.transform).toBe('rotate(45deg)');
  });

  it('renders clock SVG with time label', () => {
    render(
      <QuestionView
        question={{
          format: 'clock',
          questionText: 'What time does the clock show?',
          render: { hours: 4, minutes: 30 },
        }}
      />,
    );
    expect(screen.getByRole('img', { name: '4:30' })).toBeTruthy();
  });

  it('renders coins-mcq with currency-neutral coins', () => {
    render(
      <QuestionView
        question={{
          format: 'coins-mcq',
          questionText: 'Count the coins',
          render: { coins: [5, 2, 1] },
        }}
      />,
    );
    expect(screen.getByText('🪙5')).toBeTruthy();
    expect(screen.getByText('🪙2')).toBeTruthy();
    expect(screen.getByText('🪙1')).toBeTruthy();
  });

  it('renders pictograph rows and scale key when scale > 1', () => {
    render(
      <QuestionView
        question={{
          format: 'pictograph',
          questionText: 'Each picture stands for 2. How many Apples are there?',
          render: {
            rows: [
              { label: 'Apples', glyph: '🍎', count: 3 },
              { label: 'Bananas', glyph: '🍌', count: 2 },
            ],
            scale: 2,
          },
        }}
      />,
    );
    expect(screen.getByText('Apples')).toBeTruthy();
    expect(screen.getByText('Key: 1 picture = 2')).toBeTruthy();
  });

  it('renders fraction-mcq partitioned bar', () => {
    render(
      <QuestionView
        question={{
          format: 'fraction-mcq',
          questionText: '1 of 4 equal parts is shaded. What fraction is shaded?',
          render: { totalParts: 4, shadedParts: 1 },
        }}
      />,
    );
    expect(screen.getByRole('img', { name: '1 of 4 parts shaded' })).toBeTruthy();
  });

  it('renders ordinal-strip single-row animal strip instead of inline sentence', () => {
    render(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: 'From the left, 🐶 is at position ? in: 🐼 🐮 🐶 🐯',
          render: { kind: 'ordinal-strip', items: ['🐼', '🐮', '🐶', '🐯'], target: '🐶' },
        }}
      />,
    );
    expect(screen.getByText('← Start (1st)')).toBeTruthy();
  });

  it('renders place-houses card for tens & ones and 3-digit numbers', () => {
    render(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: '3 tens and 4 ones make ?',
          render: {
            kind: 'place-houses',
            columns: [
              { label: 'Tens', count: 3 },
              { label: 'Ones', count: 4 },
            ],
          },
        }}
      />,
    );
    expect(screen.getByText('What number do these houses make?')).toBeTruthy();
    expect(screen.getByText('Tens')).toBeTruthy();
    expect(screen.getByText('Ones')).toBeTruthy();
  });

  it('renders SVG tilted balance scale for balance-mcq', () => {
    render(
      <QuestionView
        question={{
          format: 'balance-mcq',
          questionText: 'Which one is HEAVIER?',
          render: { leftItem: '🍉', rightItem: '🎈', heavier: 'left' },
        }}
      />,
    );
    expect(screen.getByRole('img', { name: 'Balance scale with 🍉 and 🎈' })).toBeTruthy();
  });

  it('renders group-compare without leaking counts and preserves big-vs-small visual contrast (TD-9)', () => {
    const { container } = render(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: 'Group A has 4 🐘. Group B has 6 🐜. How many are in the group with MORE?',
          render: {
            kind: 'group-compare',
            countA: 4,
            glyphA: '🐘',
            countB: 6,
            glyphB: '🐜',
            word: 'MORE',
          },
        }}
      />,
    );
    expect(screen.getByText('Group A')).toBeTruthy();
    expect(screen.getByText('Group B')).toBeTruthy();
    expect(screen.queryByText(/\(4\)/)).toBeNull();
    expect(screen.queryByText(/\(6\)/)).toBeNull();
    expect(container.textContent).not.toContain('Group A (4)');
    expect(container.textContent).not.toContain('Group B (6)');
    // Big glyph group renders visually larger than small glyph group (Piaget conservation).
    const groupAGlyphs = screen.getAllByText('🐘');
    const groupBGlyphs = screen.getAllByText('🐜');
    expect(groupAGlyphs).toHaveLength(4);
    expect(groupBGlyphs).toHaveLength(6);
    expect(groupAGlyphs[0].parentElement.className).toContain('text-xl');
    expect(groupBGlyphs[0].parentElement.className).toContain('text-xs');
  });

  it('renders half-collection without leaking groupSize numerals when groupSize > 6 (TD-9)', () => {
    const { container } = render(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: 'What is 1/2 of 16 apples?',
          render: {
            kind: 'half-collection',
            total: 16,
            num: 1,
            den: 2,
            glyph: '🍎',
            word: 'apples',
          },
        }}
      />,
    );
    expect(container.textContent).not.toContain('(8)');
    expect(screen.getAllByText('🍎')).toHaveLength(16);
  });
});

describe('QuestionView — remaining formats and mcq render.kind trays (TD-7)', () => {
  it('renders count-objects tray with exact object count and aria-label', () => {
    render(
      <QuestionView
        question={{
          format: 'count-objects',
          questionText: 'How many apples are there?',
          render: { glyph: '🍎', count: 15 },
        }}
      />,
    );
    expect(screen.getByLabelText('15 objects to count')).toBeTruthy();
    expect(screen.getAllByText('🍎')).toHaveLength(15);
  });

  it('renders compare sign box blank and filled on blankFill', () => {
    const base = {
      format: 'compare',
      questionText: 'Compare 14 and 9',
      correctAnswer: '>',
      render: { left: 14, right: 9 },
    };
    const { rerender } = render(<QuestionView question={base} />);
    expect(screen.getByText('Which sign goes in the box?')).toBeTruthy();
    expect(screen.getByText('?')).toBeTruthy();

    rerender(<QuestionView question={base} blankFill="correct" />);
    expect(screen.getByText('>').className).toContain('border-success');

    rerender(<QuestionView question={base} blankFill="learn" />);
    expect(screen.getByText('>').className).toContain('border-learn');
  });

  it.each([
    ['inside', '🧺', '🐱', 'basket', null],
    ['outside', '🏠', '🐶', 'house', null],
    ['top', '🪑', '🍎', 'table', null],
    ['bottom', '🛏️', '🧸', 'bed', null],
    ['near', '🌳', '🐰', 'tree', null],
    ['far', '🚗', '🚲', 'car', '• • •'],
  ])('renders spatial-mcq for relation "%s"', (relation, anchorGlyph, itemGlyph, anchorName, marker) => {
    render(
      <QuestionView
        question={{
          format: 'spatial-mcq',
          questionText: `Where is ${itemGlyph}?`,
          render: { relation, anchorGlyph, itemGlyph, anchorName },
        }}
      />,
    );
    expect(screen.getByText(new RegExp(`relative to the ${anchorName}\\?`))).toBeTruthy();
    expect(screen.getByText(anchorGlyph)).toBeTruthy();
    expect(screen.getByText(itemGlyph)).toBeTruthy();
    if (marker) expect(screen.getByText(marker)).toBeTruthy();
  });

  it('renders ordinal-strip up to LINE_CAP N=7 items in a single row and highlights target', () => {
    const items = ['🐼', '🐮', '🐶', '🐯', '🐸', '🦊', '🐰'];
    render(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: 'From the left, 🦊 is at position ? in: 🐼 🐮 🐶 🐯 🐸 🦊 🐰',
          render: { kind: 'ordinal-strip', items, target: '🦊' },
        }}
      />,
    );
    expect(screen.getByText('← Start (1st)')).toBeTruthy();
    for (const item of items) expect(screen.getByText(item)).toBeTruthy();
    expect(screen.getByText('🦊').className).toContain('bg-primary-soft');
    expect(screen.getByText('🐼').className).not.toContain('bg-primary-soft');
  });

  it('renders pattern-strip with target slot and blankFill reveal', () => {
    const q = {
      format: 'mcq',
      questionText: 'What comes next? 🍎 🍌 🍎 🍌 ?',
      correctAnswer: '🍎',
      render: { kind: 'pattern-strip', sequence: ['🍎', '🍌', '🍎', '🍌'] },
    };
    const { rerender } = render(<QuestionView question={q} />);
    expect(screen.getByText('What comes next in the pattern?')).toBeTruthy();
    expect(screen.getByText('?')).toBeTruthy();

    rerender(<QuestionView question={q} blankFill="correct" />);
    expect(screen.getAllByText('🍎')).toHaveLength(3);
  });

  it('renders sorting-tray in both odd-one-out and belongs-with modes', () => {
    const { rerender } = render(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: 'Odd one out',
          correctAnswer: '🚗',
          render: { kind: 'sorting-tray', mode: 'odd-one-out', items: ['🍎', '🍌', '🍇', '🚗'] },
        }}
      />,
    );
    expect(screen.getByText('Which one does NOT belong?')).toBeTruthy();
    expect(screen.queryByText('?')).toBeNull();

    rerender(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: 'Belongs with',
          correctAnswer: '🍐',
          render: { kind: 'sorting-tray', mode: 'belongs-with', items: ['🍎', '🍌', '🍇'] },
        }}
      />,
    );
    expect(screen.getByText('Which one belongs with this group?')).toBeTruthy();
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('renders number-step track with sequence and target slot', () => {
    render(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: '45, 46, 47, ?',
          correctAnswer: 48,
          render: { kind: 'number-step', sequence: [45, 46, 47] },
        }}
      />,
    );
    expect(screen.getByText('Count forward — what comes next?')).toBeTruthy();
    expect(screen.getByText('45')).toBeTruthy();
    expect(screen.getByText('47')).toBeTruthy();
    expect(screen.getByText('?')).toBeTruthy();
  });

  it.each([
    ['after', 'Monday', 'day', 'What day comes right AFTER?', '→'],
    ['before', 'Friday', 'day', 'What day comes right BEFORE?', '←'],
    ['tomorrow', 'Tuesday', 'day', 'Today is Tuesday — what day is TOMORROW?', '→'],
    ['yesterday', 'Sunday', 'day', 'Today is Sunday — what day was YESTERDAY?', '←'],
    ['2 days after', 'Wednesday', 'day', 'What day comes 2 days AFTER Wednesday?', '+2 →'],
  ])('renders time-sequence for direction "%s"', (direction, current, noun, header, arrow) => {
    render(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: header,
          correctAnswer: 'Thursday',
          render: { kind: 'time-sequence', current, direction, noun },
        }}
      />,
    );
    expect(screen.getByText(header)).toBeTruthy();
    expect(screen.getByText(current)).toBeTruthy();
    expect(screen.getByText(arrow)).toBeTruthy();
  });

  it('renders money-add and money-change cards with currency-neutral coins', () => {
    const { rerender } = render(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: '🪙 15 + 🪙 12 = ?',
          correctAnswer: 27,
          render: { kind: 'money-add', a: 15, b: 12 },
        }}
      />,
    );
    expect(screen.getByText('Add the money together:')).toBeTruthy();
    expect(screen.getByText('🪙 15')).toBeTruthy();
    expect(screen.getByText('🪙 12')).toBeTruthy();

    rerender(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: 'Have 🪙 50, spend 🪙 18',
          correctAnswer: 32,
          render: { kind: 'money-change', have: 50, spend: 18 },
        }}
      />,
    );
    expect(screen.getByText('How much money is left?')).toBeTruthy();
    expect(screen.getByText('🪙 50')).toBeTruthy();
    expect(screen.getByText('🪙 18')).toBeTruthy();
  });

  it('renders ruler-cm, length-add, and ribbon-compare trays', () => {
    const { rerender } = render(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: 'Starts at 3 cm, ends at 11 cm',
          correctAnswer: 8,
          render: { kind: 'ruler-cm', start: 3, end: 11 },
        }}
      />,
    );
    expect(screen.getByText('Start: 3 cm')).toBeTruthy();
    expect(screen.getByText('End: 11 cm')).toBeTruthy();

    rerender(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: '6 cm + 5 cm = ?',
          correctAnswer: 11,
          render: { kind: 'length-add', a: 6, b: 5, unit: 'cm' },
        }}
      />,
    );
    expect(screen.getByText('Join the two lengths:')).toBeTruthy();
    expect(screen.getByText('6 cm')).toBeTruthy();
    expect(screen.getByText('5 cm')).toBeTruthy();

    rerender(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: 'Ribbon A (7) vs Ribbon B (4)',
          correctAnswer: 3,
          render: { kind: 'ribbon-compare', a: 7, b: 4 },
        }}
      />,
    );
    expect(screen.getByText('How many blocks LONGER is Ribbon A?')).toBeTruthy();
    expect(screen.getByText('Ribbon A (7)')).toBeTruthy();
    expect(screen.getByText('Ribbon B (4)')).toBeTruthy();
  });

  it('renders capacity-jugs and capacity-tanks cards', () => {
    const { rerender } = render(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: '1 jug holds 4 litres. How many litres in 3 jugs?',
          correctAnswer: 12,
          render: { kind: 'capacity-jugs', perJug: 4, jugs: 3 },
        }}
      />,
    );
    expect(screen.getByText('How many litres in all 3 jugs?')).toBeTruthy();
    expect(screen.getAllByText('4 L')).toHaveLength(3);

    rerender(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: 'Tank A holds 45 L. Tank B holds 18 L.',
          correctAnswer: 27,
          render: { kind: 'capacity-tanks', tankA: 45, tankB: 18 },
        }}
      />,
    );
    expect(screen.getByText('How many MORE litres in Tank A?')).toBeTruthy();
    expect(screen.getByText('45 L')).toBeTruthy();
    expect(screen.getByText('18 L')).toBeTruthy();
  });

  it('renders fraction-whole cards', () => {
    render(
      <QuestionView
        question={{
          format: 'mcq',
          questionText: 'How many quarters (1/4) make 2 whole pizzas?',
          correctAnswer: 8,
          render: { kind: 'fraction-whole', wholes: 2, partsPerWhole: 4 },
        }}
      />,
    );
    expect(screen.getByText('How many quarters (1/4) make 2 whole pizzas?')).toBeTruthy();
    expect(screen.getAllByText('4 × 1/4')).toHaveLength(2);
  });
});
