import { describe, it, expect, vi, beforeEach } from 'vitest';

const isNativePlatform = vi.fn();
let backCb = null;
const remove = vi.fn();
const exitApp = vi.fn();
const addListener = vi.fn(async (_evt, cb) => {
  backCb = cb;
  return { remove };
});
let shouldFailAppImport = false;

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => isNativePlatform() },
}));

vi.mock('@capacitor/app', () => {
  if (shouldFailAppImport) throw new Error('plugin unavailable');
  return {
    App: {
      addListener: (...args) => addListener(...args),
      exitApp: () => exitApp(),
    },
  };
});

import { isNativeApp, registerBackButtonListener } from '../platform';

const flushMicrotasks = () => new Promise((r) => setTimeout(r, 0));

describe('platform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    backCb = null;
    shouldFailAppImport = false;
  });

  it('isNativeApp reflects Capacitor.isNativePlatform and returns false if it throws', () => {
    isNativePlatform.mockReturnValue(true);
    expect(isNativeApp()).toBe(true);

    isNativePlatform.mockReturnValue(false);
    expect(isNativeApp()).toBe(false);

    isNativePlatform.mockImplementation(() => { throw new Error('bridge error'); });
    expect(isNativeApp()).toBe(false);
  });

  it('registerBackButtonListener is a no-op on web', async () => {
    isNativePlatform.mockReturnValue(false);
    const cleanup = registerBackButtonListener(vi.fn());
    await flushMicrotasks();
    expect(addListener).not.toHaveBeenCalled();
    expect(() => cleanup()).not.toThrow();
  });

  it('registerBackButtonListener wires native backButton and forwards exitApp', async () => {
    isNativePlatform.mockReturnValue(true);
    const onBack = vi.fn((exit) => exit());
    const cleanup = registerBackButtonListener(onBack);
    await flushMicrotasks();

    expect(addListener).toHaveBeenCalledWith('backButton', expect.any(Function));
    backCb();
    expect(onBack).toHaveBeenCalledOnce();
    expect(exitApp).toHaveBeenCalledOnce();

    cleanup();
    expect(remove).toHaveBeenCalledOnce();
  });

  it('cleans up listener if unmounted before async addListener resolves', async () => {
    isNativePlatform.mockReturnValue(true);
    let resolveListener;
    addListener.mockImplementationOnce(() => new Promise((r) => { resolveListener = r; }));

    const cleanup = registerBackButtonListener(vi.fn());
    await flushMicrotasks();
    cleanup();
    resolveListener({ remove });
    await flushMicrotasks();

    expect(remove).toHaveBeenCalledOnce();
  });
});
