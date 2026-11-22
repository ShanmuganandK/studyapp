// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, cleanup, fireEvent, waitFor, configure } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/useAuth';
import ParentGateModal from '../ParentGateModal';
import ParentDashboard from '../ParentDashboard';

// Mascot preloads webp assets — irrelevant to gate/dashboard logic; stub it.
vi.mock('../Mascot', () => ({ default: () => null }));

/**
 * The FULL passcode lifecycle — set, verify, forgot-reset, remove — driven through the REAL
 * ParentGateModal + ParentDashboard + AuthContext with NO signed-in user (`authService` always
 * emits `null`, everything keyed under `'anon'`). Nothing is mocked except the mascot image.
 *
 * Each stage runs in its own isolated render + clean localStorage so a failure in one stage
 * never cascades into the rest.
 */

configure({ asyncUtilTimeout: 8000 });

const SETTINGS_KEY = 'math_kids_settings_anon';
const passHash = () => JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').passcodeHash ?? null;

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

async function bootFreshApp() {
  render(<AuthProvider><MiniApp /></AuthProvider>);
  await waitFor(() => expect(screen.getByText('nav-parent')).toBeTruthy());
}

async function setupPasscode(pin) {
  fireEvent.click(screen.getByText('nav-parent'));
  fireEvent.click(await screen.findByRole('button', { name: /Set Parent Passcode/ }));
  expect(await screen.findByText('Set a Passcode')).toBeTruthy();
  typePin(pin);
  expect(await screen.findByText('Confirm Passcode')).toBeTruthy();
  typePin(pin);
  await waitFor(() => expect(passHash()).toBeTruthy());
  expect(await screen.findByRole('button', { name: /Change Passcode/ })).toBeTruthy();
  return passHash();
}

describe('parent passcode lifecycle with NO auth session (integration)', () => {
  beforeEach(async () => {
    localStorage.clear();
    await bootFreshApp();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('stage 1 (set): a passcode persists even with no signed-in user', async () => {
    await setupPasscode('1234');
    expect(passHash()).toBeTruthy();
  });

  it('stage 2 (verify): wrong PIN rejected, correct PIN accepted', async () => {
    await setupPasscode('1234');

    fireEvent.click(screen.getByText('nav-parent'));
    expect(await screen.findByText('For Parents Only')).toBeTruthy();
    typePin('9999');
    expect(await screen.findByText(/Incorrect PIN/)).toBeTruthy();
    typePin('1234');
    await waitFor(() => expect(screen.queryByText('For Parents Only')).toBeNull());
  });

  it('stage 3 (forgot-reset): adult challenge resets to a new code; old code stops working', async () => {
    const firstHash = await setupPasscode('1234');

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
    expect(passHash()).not.toBe(firstHash);
    vi.restoreAllMocks();

    fireEvent.click(screen.getByText('nav-parent'));
    expect(await screen.findByText('For Parents Only')).toBeTruthy();
    typePin('1234');
    expect(await screen.findByText(/Incorrect PIN/)).toBeTruthy();
    typePin('5678');
    await waitFor(() => expect(screen.queryByText('For Parents Only')).toBeNull());
  });

  it('stage 4 (remove): clears the stored code; zone becomes ungated again', async () => {
    await setupPasscode('1234');

    fireEvent.click(screen.getByRole('button', { name: /Remove passcode/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove passcode' }));
    await waitFor(() => expect(passHash()).toBeNull());
    expect(await screen.findByRole('button', { name: /Set Parent Passcode/ })).toBeTruthy();
  });
});
