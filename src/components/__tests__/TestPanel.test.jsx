// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import TestPanel from '../TestPanel';

afterEach(cleanup);

const base = { bridgeEnabled: false, onBridgeEnabledChange: () => {} };

describe('TestPanel (tester tools)', () => {
  it('renders the warm-up toggle, defaulting to Off selected', () => {
    render(<TestPanel {...base} />);
    expect(screen.getByText('Warm-up steps (experiment)')).toBeTruthy();
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

  it('holds no theme or class control', () => {
    render(<TestPanel {...base} />);
    expect(screen.queryByRole('button', { name: /Wonder|Sunset|Bubblegum/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Class \d/ })).toBeNull();
  });
});
