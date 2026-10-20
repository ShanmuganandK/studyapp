// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import ClassPicker from '../ClassPicker';

afterEach(cleanup);

describe('ClassPicker', () => {
  it('offers Class 1 and Class 2 and shows Class 3 as visibly disabled "soon" (DECISIONS 2026-09-23)', () => {
    render(<ClassPicker grade={1} onGradeChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Class 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Class 2' })).toBeTruthy();
    const c3 = screen.getByRole('button', { name: /Class 3/ });
    expect(c3.disabled).toBe(true);
    expect(c3.textContent).toMatch(/soon/i);
  });

  it('marks the active class as pressed and reports the chosen class number', () => {
    const onGradeChange = vi.fn();
    render(<ClassPicker grade={2} onGradeChange={onGradeChange} />);
    expect(screen.getByRole('button', { name: 'Class 2' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Class 1' }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Class 1' }));
    expect(onGradeChange).toHaveBeenCalledWith(1);
  });

  it('says what the setting does, and that each class keeps its own progress', () => {
    render(<ClassPicker grade={1} onGradeChange={() => {}} />);
    expect(screen.getByText(/keeps its own progress/i)).toBeTruthy();
  });
});
