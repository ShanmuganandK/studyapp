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
