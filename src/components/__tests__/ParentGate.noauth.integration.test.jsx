// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  beforeEach(() => localStorage.clear());
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('set → verify → forgot-reset → remove all persist/validate under "anon" (no signed-in user)', async () => {
    render(<AuthProvider><MiniApp /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('nav-parent')).toBeTruthy());

    // No passcode yet → entering the parent zone is ungated, lands on the dashboard.
    fireEvent.click(screen.getByText('nav-parent'));
    expect(await screen.findByRole('button', { name: /Set Parent Passcode/ })).toBeTruthy();

    // SET a passcode — must persist even with no account.
    fireEvent.click(screen.getByRole('button', { name: /Set Parent Passcode/ }));
    expect(await screen.findByText('Set a Passcode')).toBeTruthy();
    typePin('1234');
    expect(await screen.findByText('Confirm Passcode')).toBeTruthy();
    typePin('1234');
    await waitFor(() => expect(passHash()).toBeTruthy());
    const firstHash = passHash();
    // Dashboard now recognises the code.
    expect(await screen.findByRole('button', { name: /Change Passcode/ })).toBeTruthy();

    // VERIFY — wrong rejected, correct accepted (the check actually works now).
    fireEvent.click(screen.getByText('nav-parent'));
    expect(await screen.findByText('For Parents Only')).toBeTruthy();
    typePin('9999');
    expect(await screen.findByText(/Incorrect PIN/)).toBeTruthy();
    typePin('1234');
    await waitFor(() => expect(screen.queryByText('For Parents Only')).toBeNull());

    // FORGOT → adult challenge → reset → set a NEW code (all with no user).
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

    // Old PIN no longer verifies.
    fireEvent.click(screen.getByText('nav-parent'));
    expect(await screen.findByText('For Parents Only')).toBeTruthy();
    typePin('1234');
    expect(await screen.findByText(/Incorrect PIN/)).toBeTruthy();
    typePin('5678');
    await waitFor(() => expect(screen.queryByText('For Parents Only')).toBeNull());

    // REMOVE — clears the stored code (inline confirm), zone becomes ungated again.
    fireEvent.click(screen.getByRole('button', { name: /Remove passcode/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove passcode' })); // confirm
    await waitFor(() => expect(passHash()).toBeNull());
    expect(await screen.findByRole('button', { name: /Set Parent Passcode/ })).toBeTruthy();
  });
});
