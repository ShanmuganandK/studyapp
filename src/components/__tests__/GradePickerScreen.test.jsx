// @vitest-environment jsdom
/**
 * GradePickerScreen — the first-run picker's own UI (DECISIONS 2026-09-23).
 *
 * Scope fence: this file covers RENDER + CHOICE only. `chooseInitialGrade`'s state and
 * persistence live in useTestSettings.test.js; the cross-module key/export guarantees live in
 * hooks/__tests__/gradePicker.integration.test.js. The component itself is presentational —
 * no storage, no state — so there is nothing else here to check.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import GradePickerScreen from '../GradePickerScreen';

afterEach(cleanup);

describe('GradePickerScreen', () => {
  it('asks the one parent-facing question and nothing else — no name, no age field', () => {
    render(<GradePickerScreen onChoose={() => {}} />);
    expect(screen.getByRole('heading', { name: /Which class is your child in\?/ })).toBeTruthy();
    // The whole point of the decision: one question. Any text input would be a new data field.
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('offers Class 1 and Class 2 as real, enabled choices', () => {
    render(<GradePickerScreen onChoose={() => {}} />);
    for (const label of ['Class 1', 'Class 2']) {
      expect(screen.getByRole('button', { name: label }).disabled).toBe(false);
    }
  });

  it('shows Class 3 as visibly disabled "coming soon", not absent', () => {
    render(<GradePickerScreen onChoose={() => {}} />);
    const class3 = screen.getByRole('button', { name: /Class 3/ });
    expect(class3.disabled).toBe(true);
    expect(class3.textContent).toMatch(/coming soon/i);
  });

  it('calls onChoose with the chosen grade as a NUMBER (the shape the store normalises against)', () => {
    const onChoose = vi.fn();
    render(<GradePickerScreen onChoose={onChoose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Class 2' }));
    expect(onChoose).toHaveBeenCalledWith(2);
  });

  it('a click on the disabled Class 3 option chooses nothing', () => {
    const onChoose = vi.fn();
    render(<GradePickerScreen onChoose={onChoose} />);
    fireEvent.click(screen.getByRole('button', { name: /Class 3/ }));
    expect(onChoose).not.toHaveBeenCalled();
  });
});
