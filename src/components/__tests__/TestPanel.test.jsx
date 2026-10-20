// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import TestPanel from '../TestPanel';

afterEach(cleanup);

const base = {
  theme: 'wonder',
  onThemeChange: () => {},
  bridgeEnabled: false,
  onBridgeEnabledChange: () => {},
};

describe('TestPanel', () => {
  it('renders the bridge-in toggle, defaulting to Off selected', () => {
    render(<TestPanel {...base} />);
    expect(screen.getByText('Warm-up steps (test)')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Off' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'On' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('marks On as pressed when bridgeEnabled is true', () => {
    render(<TestPanel {...base} bridgeEnabled />);
    expect(screen.getByRole('button', { name: 'On' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Off' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('calls onBridgeEnabledChange with the chosen boolean', () => {
    const onBridgeEnabledChange = vi.fn();
    render(<TestPanel {...base} onBridgeEnabledChange={onBridgeEnabledChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'On' }));
    expect(onBridgeEnabledChange).toHaveBeenCalledWith(true);
  });

  it('renders all theme options', () => {
    render(<TestPanel {...base} />);
    for (const name of ['Wonder', 'Sunset', 'Bubblegum', 'Deep Sea']) {
      expect(screen.getByRole('button', { name: new RegExp(name) })).toBeTruthy();
    }
  });

  it('no longer holds the class/grade control: that is a real setting now (ClassPicker, DECISIONS 2026-10-20)', () => {
    render(<TestPanel {...base} />);
    expect(screen.queryByRole('button', { name: /Grade \d/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Class \d/ })).toBeNull();
  });

  it('marks the active theme as pressed', () => {
    render(<TestPanel {...base} theme="sunset" />);
    expect(screen.getByRole('button', { name: /Sunset/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Wonder/ }).getAttribute('aria-pressed')).toBe('false');
  });

  it('calls the handler with the chosen theme slug', () => {
    const onThemeChange = vi.fn();
    render(<TestPanel {...base} onThemeChange={onThemeChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Deep Sea/ }));
    expect(onThemeChange).toHaveBeenCalledWith('deepsea');
  });
});
