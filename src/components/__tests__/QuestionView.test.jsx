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
});
