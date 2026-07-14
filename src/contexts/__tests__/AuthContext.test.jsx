// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

/**
 * Integration test for the passcode lifecycle against the REAL AuthContext + real hashPasscode
 * + real localStorage — no signed-in user (the anonymous case, keyed under 'anon'), which is
 * exactly the state bug 2 broke. Proves set → verify → change → remove persist and validate
 * WITHOUT requiring a Firebase account. No mocking of the auth internals.
 */

const SETTINGS_KEY = 'math_kids_settings_anon';

function Harness() {
  const { parentSettings, updatePasscode, verifyPasscode, clearPasscode } = useAuth();
  return (
    <div>
      <span data-testid="hash">{String(parentSettings?.passcodeHash)}</span>
      <span data-testid="verify" />
      <button onClick={() => updatePasscode('1234')}>set-1234</button>
      <button onClick={() => updatePasscode('5678')}>change-5678</button>
      <button onClick={clearPasscode}>remove</button>
      <button onClick={async () => {
        document.querySelector('[data-testid="verify"]').textContent =
          String(await verifyPasscode('1234'));
      }}>verify-1234</button>
      <button onClick={async () => {
        document.querySelector('[data-testid="verify"]').textContent =
          String(await verifyPasscode('0000'));
      }}>verify-0000</button>
    </div>
  );
}

describe('AuthContext passcode lifecycle (integration)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('set → verify(correct/wrong) → change → remove all persist and validate', async () => {
    render(<AuthProvider><Harness /></AuthProvider>);
    // Provider renders children only once the (local dev) user has loaded.
    await waitFor(() => expect(screen.getByText('set-1234')).toBeTruthy());
    expect(screen.getByTestId('hash').textContent).toBe('null');

    // SET (no signed-in user → keyed under 'anon')
    fireEvent.click(screen.getByText('set-1234'));
    await waitFor(() => expect(screen.getByTestId('hash').textContent).not.toBe('null'));
    const setHash = screen.getByTestId('hash').textContent;
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)).passcodeHash).toBe(setHash);

    // VERIFY correct → true, wrong → false (the check actually works)
    fireEvent.click(screen.getByText('verify-1234'));
    await waitFor(() => expect(screen.getByTestId('verify').textContent).toBe('true'));
    fireEvent.click(screen.getByText('verify-0000'));
    await waitFor(() => expect(screen.getByTestId('verify').textContent).toBe('false'));

    // CHANGE → new hash persists, old PIN no longer verifies
    fireEvent.click(screen.getByText('change-5678'));
    await waitFor(() => expect(screen.getByTestId('hash').textContent).not.toBe(setHash));
    fireEvent.click(screen.getByText('verify-1234'));
    await waitFor(() => expect(screen.getByTestId('verify').textContent).toBe('false'));

    // REMOVE → hash cleared, storage cleared, and no-code verify returns true (ungated)
    fireEvent.click(screen.getByText('remove'));
    await waitFor(() => expect(screen.getByTestId('hash').textContent).toBe('null'));
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)).passcodeHash).toBeNull();
    fireEvent.click(screen.getByText('verify-0000'));
    await waitFor(() => expect(screen.getByTestId('verify').textContent).toBe('true'));
  });
});
