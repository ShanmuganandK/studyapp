// @vitest-environment jsdom
/**
 * The first-run gate itself (DECISIONS 2026-09-23): does the REAL ThemeManager show the picker
 * only when this device has never had test settings written, and never again after?
 *
 * The other grade-picker tests cover the pieces — the screen's UI, the hook's write, the storage
 * key and the export exclusion. None of them covers the branch that decides whether a child ever
 * sees the picker at all, which is the whole behaviour. So this mounts the real ThemeManager
 * inside the real AuthProvider against real jsdom localStorage, mocking only the mascot's image
 * preloads (same fence as ParentGate.noauth.integration.test.jsx).
 *
 * ⚠️ Every assertion here is ASYNC on purpose. `AuthProvider` renders `{!loading && children}`
 * and resolves its (inert, null-user) adapter in a microtask, so ThemeManager is absent from the
 * DOM on the first paint. A synchronous `queryByRole(...) === null` therefore passes on an EMPTY
 * document and proves nothing — the first draft of this file did exactly that and "passed" two
 * negative cases vacuously. Each test below waits for something POSITIVE to render before
 * asserting an absence: the picker heading, or the nav that only exists once the gate is past.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import ThemeManager from '../ThemeManager';

// Mascot preloads webp assets — irrelevant to the gate; stub it (precedent: the noauth test).
vi.mock('../Mascot', () => ({ default: () => null }));

const TEST_SETTINGS_KEY = 'tinku:v1:testSettings';
const PICKER_HEADING = /Which class is your child in\?/;

function renderApp() {
  return render(<AuthProvider><ThemeManager /></AuthProvider>);
}

/** Resolves once the app proper is on screen — the nav exists only PAST the picker gate. */
const appProperRendered = () => screen.findByRole('button', { name: /Parent/ });

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('first-run grade picker — the gate in ThemeManager', () => {
  it('a device with NO stored test settings sees the picker, and no app chrome behind it', async () => {
    renderApp();
    expect(await screen.findByRole('heading', { name: PICKER_HEADING })).toBeTruthy();
    // It replaces the whole app output — the nav is not merely hidden, it is not rendered.
    expect(screen.queryByRole('button', { name: /Parent/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Home/ })).toBeNull();
  });

  it('a device whose record already has gradeChosen true never sees the picker', async () => {
    localStorage.setItem(
      TEST_SETTINGS_KEY,
      JSON.stringify({ version: 1, theme: 'wonder', grade: 2, bridgeEnabled: false, gradeChosen: true }),
    );
    renderApp();
    await appProperRendered(); // positive first — an empty DOM must not satisfy this test
    expect(screen.queryByRole('heading', { name: PICKER_HEADING })).toBeNull();
  });

  it('an EXISTING tester\'s legacy record with no gradeChosen key never sees the picker', async () => {
    // The regression the backfill exists to prevent: a returning tester re-asked on next launch.
    localStorage.setItem(TEST_SETTINGS_KEY, JSON.stringify({ version: 1, theme: 'sunset', grade: 2 }));
    renderApp();
    await appProperRendered();
    expect(screen.queryByRole('heading', { name: PICKER_HEADING })).toBeNull();
  });

  it('choosing a class dismisses the picker with no extra step, and persists the choice', async () => {
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Class 2' }));
    // No separate "continue" — the very next render is the app proper, already on that grade.
    await appProperRendered();
    expect(screen.queryByRole('heading', { name: PICKER_HEADING })).toBeNull();
    const stored = JSON.parse(localStorage.getItem(TEST_SETTINGS_KEY));
    expect(stored.grade).toBe(2);
    expect(stored.gradeChosen).toBe(true);
  });

  it('and it stays dismissed on the NEXT launch (a remount reading only storage)', async () => {
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Class 1' }));
    await appProperRendered();
    cleanup();

    renderApp(); // fresh mount, same storage — simulates reopening the PWA
    await appProperRendered();
    expect(screen.queryByRole('heading', { name: PICKER_HEADING })).toBeNull();
  });
});
