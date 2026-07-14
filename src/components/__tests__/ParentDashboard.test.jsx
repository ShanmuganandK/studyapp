// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import ParentDashboard from '../ParentDashboard';

// Mascot preloads webp assets — irrelevant to the settings footer; stub it.
vi.mock('../Mascot', () => ({ default: () => null }));

const baseProps = {
  onSetPasscode: () => {},
  onRemovePasscode: () => {},
  userEmail: null,
};

describe('ParentDashboard — passcode lifecycle actions', () => {
  afterEach(cleanup);

  it('no passcode set: shows "Set Parent Passcode", no Remove action', () => {
    render(<ParentDashboard {...baseProps} hasPasscode={false} />);
    expect(screen.getByRole('button', { name: /Set Parent Passcode/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Remove passcode/ })).toBeNull();
  });

  it('passcode set: shows Change + Remove actions', () => {
    render(<ParentDashboard {...baseProps} hasPasscode />);
    expect(screen.getByRole('button', { name: /Change Passcode/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Remove passcode/ })).toBeTruthy();
  });

  it('Remove uses an inline confirm before calling onRemovePasscode', () => {
    const onRemovePasscode = vi.fn();
    render(<ParentDashboard {...baseProps} hasPasscode onRemovePasscode={onRemovePasscode} />);

    // First tap only reveals the confirm — does NOT remove yet.
    fireEvent.click(screen.getByRole('button', { name: /Remove passcode/ }));
    expect(onRemovePasscode).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();

    // Confirm actually removes.
    fireEvent.click(screen.getByRole('button', { name: 'Remove passcode' }));
    expect(onRemovePasscode).toHaveBeenCalledTimes(1);
  });

  it('Cancel dismisses the confirm without removing', () => {
    const onRemovePasscode = vi.fn();
    render(<ParentDashboard {...baseProps} hasPasscode onRemovePasscode={onRemovePasscode} />);
    fireEvent.click(screen.getByRole('button', { name: /Remove passcode/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onRemovePasscode).not.toHaveBeenCalled();
    // Back to the single trigger.
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });
});
