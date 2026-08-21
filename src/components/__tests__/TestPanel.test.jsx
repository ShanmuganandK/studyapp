// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import TestPanel from '../TestPanel';

afterEach(cleanup);

const base = {
  theme: 'wonder',
  onThemeChange: () => {},
  grade: 1,
  onGradeChange: () => {},
};

describe('TestPanel', () => {
  it('renders all theme + grade options', () => {
    render(<TestPanel {...base} />);
    for (const name of ['Wonder', 'Sunset', 'Bubblegum', 'Deep Sea']) {
      expect(screen.getByRole('button', { name: new RegExp(name) })).toBeTruthy();
    }
    for (const g of [1, 2, 3]) {
      expect(screen.getByRole('button', { name: `Grade ${g}` })).toBeTruthy();
    }
  });

  it('marks the active theme and grade as pressed', () => {
    render(<TestPanel {...base} theme="sunset" grade={2} />);
    expect(screen.getByRole('button', { name: /Sunset/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Grade 2' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Wonder/ }).getAttribute('aria-pressed')).toBe('false');
  });

  it('calls the handlers with the chosen theme slug / grade number', () => {
    const onThemeChange = vi.fn();
    const onGradeChange = vi.fn();
    render(<TestPanel {...base} onThemeChange={onThemeChange} onGradeChange={onGradeChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Deep Sea/ }));
    expect(onThemeChange).toHaveBeenCalledWith('deepsea');

    fireEvent.click(screen.getByRole('button', { name: 'Grade 3' }));
    expect(onGradeChange).toHaveBeenCalledWith(3);
  });
});
