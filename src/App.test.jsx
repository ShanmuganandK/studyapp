// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

let shouldThrow = false;
vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
}));
vi.mock('./components/ThemeManager', () => ({
  default: () => {
    if (shouldThrow) throw new Error('boom');
    return <div data-testid="theme-manager">ok</div>;
  },
}));
vi.mock('./utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import App from './App';
import logger from './utils/logger';

describe('App', () => {
  afterEach(() => {
    shouldThrow = false;
    cleanup();
    vi.restoreAllMocks();
  });

  it('mounts AuthProvider and ThemeManager inside ErrorBoundary', () => {
    render(<App />);
    expect(screen.getByTestId('auth-provider')).toBeTruthy();
    expect(screen.getByTestId('theme-manager').textContent).toBe('ok');
  });

  it('renders child-safe fallback without exposing raw error details when a child throws', () => {
    shouldThrow = true;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);
    expect(screen.getByText('Tinku needs a moment!')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy();
    expect(screen.queryByText('boom')).toBeNull();
    expect(logger.error).toHaveBeenCalledWith('ErrorBoundary caught an error', expect.any(Error), expect.any(Object));
    expect(consoleError).toHaveBeenCalled();
  });
});
