// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup, waitFor } from '@testing-library/react';

const isNativeApp = vi.fn();
vi.mock('../../services/platform', () => ({ isNativeApp: () => isNativeApp() }));
let listener = null;
const remove = vi.fn();
const exitApp = vi.fn();
const addListener = vi.fn(async (_evt, cb) => {
  listener = cb;
  return { remove };
});
vi.mock('@capacitor/app', () => ({ App: { addListener: (...a) => addListener(...a), exitApp: () => exitApp() } }));

import useAndroidBackButton from '../useAndroidBackButton';

const handlers = () => ({ closeGate: vi.fn(), goToSkills: vi.fn() });

beforeEach(() => {
  vi.clearAllMocks();
  listener = null;
});
afterEach(cleanup);

describe('useAndroidBackButton', () => {
  it('web: registers nothing', () => {
    isNativeApp.mockReturnValue(false);
    renderHook(() => useAndroidBackButton({ isGateOpen: false, currentView: 'skills' }, handlers()));
    expect(addListener).not.toHaveBeenCalled();
  });

  it('android: routes Back through the current state and exits only from the skill list', async () => {
    isNativeApp.mockReturnValue(true);
    const h = handlers();
    const { rerender } = renderHook(({ s }) => useAndroidBackButton(s, h), {
      initialProps: { s: { isGateOpen: true, currentView: 'quiz' } },
    });
    await waitFor(() => expect(listener).toBeTruthy());
    listener();
    expect(h.closeGate).toHaveBeenCalledOnce();

    rerender({ s: { isGateOpen: false, currentView: 'quiz' } });
    listener();
    expect(h.goToSkills).toHaveBeenCalledOnce();
    expect(exitApp).not.toHaveBeenCalled();

    rerender({ s: { isGateOpen: false, currentView: 'skills' } });
    listener();
    expect(exitApp).toHaveBeenCalledOnce();
    expect(addListener).toHaveBeenCalledTimes(1); // registered once, not per render
  });

  it('removes the native listener on unmount', async () => {
    isNativeApp.mockReturnValue(true);
    const { unmount } = renderHook(() => useAndroidBackButton({ isGateOpen: false, currentView: 'skills' }, handlers()));
    await waitFor(() => expect(listener).toBeTruthy());
    unmount();
    await waitFor(() => expect(remove).toHaveBeenCalled());
  });
});
