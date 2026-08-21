// @vitest-environment jsdom
/**
 * useTestSettings tests — the hook owns the ONE side-effect that applies a theme: a
 * `theme-<slug>` class on document.body (body-level so the portalled parent gate re-themes).
 * These assert that switching themes toggles exactly one class, `wonder` clears it, and both
 * theme and grade persist. Grade must never touch the body class.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import useTestSettings from '../useTestSettings';

function bodyThemeClasses() {
  return Array.from(document.body.classList).filter((c) => c.startsWith('theme-'));
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.body.className = '';
});

describe('useTestSettings', () => {
  it('defaults to wonder with no theme class on <body>', () => {
    const { result } = renderHook(() => useTestSettings());
    expect(result.current.theme).toBe('wonder');
    expect(result.current.grade).toBe(1);
    expect(bodyThemeClasses()).toEqual([]);
  });

  it('setTheme applies exactly one theme-<slug> class and swaps cleanly', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => result.current.setTheme('sunset'));
    expect(result.current.theme).toBe('sunset');
    expect(bodyThemeClasses()).toEqual(['theme-sunset']);

    act(() => result.current.setTheme('deepsea'));
    expect(bodyThemeClasses()).toEqual(['theme-deepsea']);

    act(() => result.current.setTheme('wonder'));
    expect(bodyThemeClasses()).toEqual([]);
  });

  it('persists theme and grade across a remount', () => {
    const first = renderHook(() => useTestSettings());
    act(() => first.result.current.setTheme('bubblegum'));
    act(() => first.result.current.setGrade(3));
    cleanup();

    const second = renderHook(() => useTestSettings());
    expect(second.result.current.theme).toBe('bubblegum');
    expect(second.result.current.grade).toBe(3);
    expect(bodyThemeClasses()).toEqual(['theme-bubblegum']);
  });

  it('setGrade does not affect the body theme class', () => {
    const { result } = renderHook(() => useTestSettings());
    act(() => result.current.setGrade(2));
    expect(result.current.grade).toBe(2);
    expect(bodyThemeClasses()).toEqual([]);
  });
});
