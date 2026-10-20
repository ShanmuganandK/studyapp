// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import ThemePicker from '../ThemePicker';

afterEach(cleanup);

describe('ThemePicker', () => {
  it('is headed "Colours", not "Test settings"', () => {
    render(<ThemePicker theme="wonder" onThemeChange={() => {}} />);
    expect(screen.getByText('Colours')).toBeTruthy();
    expect(screen.queryByText(/test/i)).toBeNull();
  });

  it('offers exactly the shipped palettes (Deep Sea was removed: 2.06:1 button text)', () => {
    render(<ThemePicker theme="wonder" onThemeChange={() => {}} />);
    for (const name of ['Wonder', 'Sunset', 'Bubblegum']) {
      expect(screen.getByRole('button', { name: new RegExp(name) })).toBeTruthy();
    }
    expect(screen.queryByRole('button', { name: /Deep Sea/ })).toBeNull();
  });

  it('marks the active theme as pressed', () => {
    render(<ThemePicker theme="sunset" onThemeChange={() => {}} />);
    expect(screen.getByRole('button', { name: /Sunset/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Wonder/ }).getAttribute('aria-pressed')).toBe('false');
  });

  it('calls the handler with the chosen theme slug', () => {
    const onThemeChange = vi.fn();
    render(<ThemePicker theme="wonder" onThemeChange={onThemeChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Bubblegum/ }));
    expect(onThemeChange).toHaveBeenCalledWith('bubblegum');
  });
});
