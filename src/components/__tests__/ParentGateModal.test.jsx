// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import ParentGateModal from '../ParentGateModal';

// Mascot preloads webp assets — irrelevant to gate logic; stub it.
vi.mock('../Mascot', () => ({ default: () => null }));

// Mutable auth mock — each test sets parentSettings + spies as needed.
const auth = {
  parentSettings: { passcodeHash: null },
  updatePasscode: vi.fn(),
  verifyPasscode: vi.fn(),
  clearPasscode: vi.fn(),
};
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => auth }));

const HASH = 'deadbeef'; // stand-in for a set passcode

function typePin(pin) {
  for (const d of pin) {
    fireEvent.click(screen.getByRole('button', { name: d }));
  }
}

describe('ParentGateModal', () => {
  beforeEach(() => {
    auth.parentSettings = { passcodeHash: null };
    auth.updatePasscode = vi.fn().mockResolvedValue(undefined);
    auth.verifyPasscode = vi.fn();
    auth.clearPasscode = vi.fn();
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('portals the overlay into document.body (true viewport overlay)', () => {
    auth.parentSettings = { passcodeHash: HASH };
    const { container } = render(
      <ParentGateModal isOpen onClose={() => {}} onSuccess={() => {}} />
    );
    // Overlay is NOT inside the component's own container — it's on document.body.
    expect(container.querySelector('.fixed.inset-0')).toBeNull();
    expect(document.body.querySelector('.fixed.inset-0')).toBeTruthy();
  });

  it('no passcode set + verify mode → immediate onSuccess', () => {
    const onSuccess = vi.fn();
    render(<ParentGateModal isOpen onClose={() => {}} onSuccess={onSuccess} />);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('verify: wrong PIN shakes and does not proceed', async () => {
    auth.parentSettings = { passcodeHash: HASH };
    auth.verifyPasscode.mockResolvedValue(false);
    const onSuccess = vi.fn();
    render(<ParentGateModal isOpen onClose={() => {}} onSuccess={onSuccess} />);
    typePin('1234');
    expect(await screen.findByText(/Incorrect PIN/)).toBeTruthy();
    expect(document.body.querySelector('.animate-shake')).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('verify: correct PIN calls onSuccess', async () => {
    auth.parentSettings = { passcodeHash: HASH };
    auth.verifyPasscode.mockResolvedValue(true);
    const onSuccess = vi.fn();
    render(<ParentGateModal isOpen onClose={() => {}} onSuccess={onSuccess} />);
    typePin('1234');
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('set mode: enter + confirm saves the passcode and proceeds', async () => {
    const onSuccess = vi.fn();
    render(<ParentGateModal isOpen isSettingMode onClose={() => {}} onSuccess={onSuccess} />);
    typePin('4321'); // step 1
    expect(await screen.findByText('Confirm Passcode')).toBeTruthy();
    typePin('4321'); // step 2 (match)
    await waitFor(() => expect(auth.updatePasscode).toHaveBeenCalledWith('4321'));
    expect(onSuccess).toHaveBeenCalled();
  });

  it('forgot flow: correct challenge clears the code and drops into set-new; wrong shakes', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // → 10 × 2 = 20
    auth.parentSettings = { passcodeHash: HASH };
    const onSuccess = vi.fn();
    render(<ParentGateModal isOpen onClose={() => {}} onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /Forgot passcode/ }));
    expect(await screen.findByText('10 × 2')).toBeTruthy();

    // Wrong answer → shake, no reset, no proceed.
    fireEvent.change(screen.getByLabelText('Answer'), { target: { value: '21' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(await screen.findByText(/Not quite/)).toBeTruthy();
    expect(auth.clearPasscode).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();

    // Correct answer → clears code, transitions to set-new-passcode.
    fireEvent.change(screen.getByLabelText('Answer'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    await waitFor(() => expect(auth.clearPasscode).toHaveBeenCalled());
    expect(await screen.findByText('Set a Passcode')).toBeTruthy();

    // Finish setting a new code.
    typePin('1111');
    expect(await screen.findByText('Confirm Passcode')).toBeTruthy();
    typePin('1111');
    await waitFor(() => expect(auth.updatePasscode).toHaveBeenCalledWith('1111'));
    expect(onSuccess).toHaveBeenCalled();
  });
});
