// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import useOnline from '../useOnline';

describe('useOnline', () => {
  afterEach(() => {
    cleanup();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  it('initialises from navigator.onLine and updates on window online/offline events', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    const { result, unmount } = renderHook(() => useOnline());
    expect(result.current).toBe(false);

    act(() => window.dispatchEvent(new Event('online')));
    expect(result.current).toBe(true);

    act(() => window.dispatchEvent(new Event('offline')));
    expect(result.current).toBe(false);

    unmount();
  });
});
