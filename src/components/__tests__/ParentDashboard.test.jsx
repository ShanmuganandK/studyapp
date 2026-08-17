// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import ParentDashboard from '../ParentDashboard';
import { emptySkillState } from '../../engine/mastery';
import { saveSkillState, loadAllSkillStates } from '../../services/progressStore';
import { BACKUP_FORMAT, BACKUP_VERSION } from '../../services/progressBackup';

// Mascot preloads webp assets — irrelevant to the settings footer; stub it.
vi.mock('../Mascot', () => ({ default: () => null }));

const baseProps = {
  onSetPasscode: () => {},
  onRemovePasscode: () => {},
  userEmail: null,
};

const SKILL_ID = 'g1.add.within20';
const PASSCODE_KEY = 'math_kids_settings_anon';

/** Reads the last Blob handed to a stubbed URL.createObjectURL and returns its text. */
async function lastCreatedBlobText(createObjectURL) {
  const blob = createObjectURL.mock.calls.at(-1)[0];
  return blob.text();
}

describe('ParentDashboard — passcode lifecycle actions', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

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

describe('ParentDashboard — progress backup (export/import, TRACKER "Now" #3)', () => {
  let createObjectURL;
  let revokeObjectURL;

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:mock-url');
    revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('no saved progress: Export is disabled with a hint', () => {
    render(<ParentDashboard {...baseProps} hasPasscode={false} />);
    expect(screen.getByRole('button', { name: /Export progress/ }).disabled).toBe(true);
    expect(screen.getByText(/there'll be something to save/)).toBeTruthy();
  });

  it('with saved progress: Export is enabled and downloads a valid, versioned envelope', async () => {
    saveSkillState(SKILL_ID, emptySkillState(SKILL_ID, 3));
    render(<ParentDashboard {...baseProps} hasPasscode={false} />);

    const exportBtn = screen.getByRole('button', { name: /Export progress/ });
    expect(exportBtn.disabled).toBe(false);
    fireEvent.click(exportBtn);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    const envelope = JSON.parse(await lastCreatedBlobText(createObjectURL));
    expect(envelope.format).toBe(BACKUP_FORMAT);
    expect(envelope.version).toBe(BACKUP_VERSION);
    expect(envelope.skills[SKILL_ID]).toEqual(emptySkillState(SKILL_ID, 3));
  });

  it('Guard C — the exported backup never contains the parent passcode', async () => {
    saveSkillState(SKILL_ID, emptySkillState(SKILL_ID, 3));
    localStorage.setItem(PASSCODE_KEY, JSON.stringify({ passcodeHash: 'super-secret-hash' }));
    render(<ParentDashboard {...baseProps} hasPasscode />);

    fireEvent.click(screen.getByRole('button', { name: /Export progress/ }));
    const raw = await lastCreatedBlobText(createObjectURL);

    expect(raw).toContain(SKILL_ID); // real progress IS in the file
    expect(raw).not.toContain('passcodeHash');
    expect(raw).not.toContain('super-secret-hash');
    expect(raw).not.toContain(PASSCODE_KEY);
  });

  it('valid backup file: shows the two-step confirm, then REPLACES storage on confirm', async () => {
    saveSkillState('g1.sub.within10', emptySkillState('g1.sub.within10', 3)); // pre-existing, should be gone after replace
    const backup = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      skills: { [SKILL_ID]: emptySkillState(SKILL_ID, 3) },
    };
    const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });

    render(<ParentDashboard {...baseProps} hasPasscode={false} />);
    fireEvent.change(screen.getByLabelText(/Import backup/), { target: { files: [file] } });

    expect(await screen.findByText(/This will replace all progress on this device/)).toBeTruthy();
    expect(screen.getByText(/1 skill\b/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Replace progress' }));

    await waitFor(() => {
      const all = loadAllSkillStates();
      expect(all['g1.sub.within10']).toBeUndefined();
      expect(all[SKILL_ID]).toEqual(emptySkillState(SKILL_ID, 3));
    });
  });

  it('malformed backup file: shows a gentle error and leaves storage untouched', async () => {
    saveSkillState(SKILL_ID, emptySkillState(SKILL_ID, 3));
    const file = new File(['not valid json{{'], 'backup.json', { type: 'application/json' });

    render(<ParentDashboard {...baseProps} hasPasscode={false} />);
    fireEvent.change(screen.getByLabelText(/Import backup/), { target: { files: [file] } });

    expect(await screen.findByText(/doesn't look like a Tinku Math backup/)).toBeTruthy();
    expect(loadAllSkillStates()[SKILL_ID]).toEqual(emptySkillState(SKILL_ID, 3));
  });

  it('Cancel dismisses the import confirm without touching storage', async () => {
    saveSkillState(SKILL_ID, emptySkillState(SKILL_ID, 3));
    const backup = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      skills: { 'g1.sub.within10': emptySkillState('g1.sub.within10', 3) },
    };
    const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });

    render(<ParentDashboard {...baseProps} hasPasscode={false} />);
    fireEvent.change(screen.getByLabelText(/Import backup/), { target: { files: [file] } });
    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText(/This will replace all progress/)).toBeNull();
    expect(loadAllSkillStates()[SKILL_ID]).toEqual(emptySkillState(SKILL_ID, 3));
    expect(loadAllSkillStates()['g1.sub.within10']).toBeUndefined();
  });
});
