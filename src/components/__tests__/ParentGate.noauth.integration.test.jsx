// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { useState } from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import ParentGateModal from '../ParentGateModal';
import ParentDashboard from '../ParentDashboard';

// Mascot preloads webp assets — irrelevant to gate/dashboard logic; stub it.
vi.mock('../Mascot', () => ({ default: () => null }));

/**
 * The exact condition that hid the bug: the FULL passcode lifecycle — set, verify, forgot-reset,
 * remove — driven through the REAL ParentGateModal + ParentDashboard + AuthContext with NO signed-
 * in user (the anonymous case; Firebase user is null, everything keyed under 'anon'). Nothing is
 * mocked except the mascot image. If the passcode ops silently no-op without an account (the
 * original bug), these persistence assertions fail.
 *
 * Staged as 4 sequential `it`s sharing one continuous render (TRACKER Now #9a): the original
 * single `it` chained ~20 waitFor/findBy calls against vitest's 5s per-test timeout, which flaked
 * on cold CI runs (transform+import alone cost ~8s). Splitting gives each stage its own 5s budget
 * and names the failing stage instead of failing an opaque 20-step test.
 */

const SETTINGS_KEY = 'math_kids_settings_anon';
const passHash = () => JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').passcodeHash ?? null;

// Mini ThemeManager: real gate + dashboard wired the same way, no auth mock.
function MiniApp() {
  const { parentSettings, clearPasscode } = useAuth();
  const [gateOpen, setGateOpen] = useState(false);
  const [setting, setSetting] = useState(false);
  const [inParent, setInParent] = useState(false);
  const hasPasscode = !!parentSettings?.passcodeHash;

  return (
    <>
      <button onClick={() => { setSetting(false); setGateOpen(true); }}>nav-parent</button>
      {gateOpen && (
        <ParentGateModal
          isOpen
          isSettingMode={setting}
          onClose={() => { setGateOpen(false); setSetting(false); }}
          onSuccess={() => { setGateOpen(false); setSetting(false); setInParent(true); }}
        />
      )}
      {inParent && (
        <ParentDashboard
          onSetPasscode={() => { setSetting(true); setGateOpen(true); }}
          onRemovePasscode={clearPasscode}
          hasPasscode={hasPasscode}
          userEmail={null}
        />
      )}
    </>
  );
}

const typePin = (pin) => { for (const d of pin) fireEvent.click(screen.getByRole('button', { name: d })); };

describe('parent passcode lifecycle with NO auth session (integration)', () => {
  let firstHash;

  // One continuous render across all 4 stages — this is the same session a parent would drive
  // through the gate/dashboard, just split into named checkpoints. Do not clear localStorage or
  // unmount between stages; each stage depends on the previous stage's persisted state.
  beforeAll(async () => {
    localStorage.clear();
    render(<AuthProvider><MiniApp /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('nav-parent')).toBeTruthy());
  });

  afterAll(() => { cleanup(); vi.restoreAllMocks(); });

  it('stage 1 (set): a passcode persists even with no signed-in user', async () => {
    // No passcode yet → entering the parent zone is ungated, lands on the dashboard.
    fireEvent.click(screen.getByText('nav-parent'));
    expect(await screen.findByRole('button', { name: /Set Parent Passcode/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Set Parent Passcode/ }));
    expect(await screen.findByText('Set a Passcode')).toBeTruthy();
    typePin('1234');
    expect(await screen.findByText('Confirm Passcode')).toBeTruthy();
    typePin('1234');
    await waitFor(() => expect(passHash()).toBeTruthy());
    firstHash = passHash();
    // Dashboard now recognises the code.
    expect(await screen.findByRole('button', { name: /Change Passcode/ })).toBeTruthy();
  });

  it('stage 2 (verify): wrong PIN rejected, correct PIN accepted', async () => {
    fireEvent.click(screen.getByText('nav-parent'));
    expect(await screen.findByText('For Parents Only')).toBeTruthy();
    typePin('9999');
    expect(await screen.findByText(/Incorrect PIN/)).toBeTruthy();
    typePin('1234');
    await waitFor(() => expect(screen.queryByText('For Parents Only')).toBeNull());
  });

  it('stage 3 (forgot-reset): adult challenge resets to a new code; old code stops working', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // → 10 × 2 = 20
    fireEvent.click(screen.getByText('nav-parent'));
    fireEvent.click(await screen.findByRole('button', { name: /Forgot passcode/ }));
    expect(await screen.findByText('10 × 2')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Answer'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(await screen.findByText('Set a Passcode')).toBeTruthy();
    typePin('5678');
    expect(await screen.findByText('Confirm Passcode')).toBeTruthy();
    typePin('5678');
    await waitFor(() => expect(passHash()).toBeTruthy());
    expect(passHash()).not.toBe(firstHash); // code actually changed on the device
    vi.restoreAllMocks();

    // Old PIN no longer verifies; new one does.
    fireEvent.click(screen.getByText('nav-parent'));
    expect(await screen.findByText('For Parents Only')).toBeTruthy();
    typePin('1234');
    expect(await screen.findByText(/Incorrect PIN/)).toBeTruthy();
    typePin('5678');
    await waitFor(() => expect(screen.queryByText('For Parents Only')).toBeNull());
  });

  it('stage 4 (remove): clears the stored code; zone becomes ungated again', async () => {
    fireEvent.click(screen.getByRole('button', { name: /Remove passcode/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove passcode' })); // confirm
    await waitFor(() => expect(passHash()).toBeNull());
    expect(await screen.findByRole('button', { name: /Set Parent Passcode/ })).toBeTruthy();
  });
});
