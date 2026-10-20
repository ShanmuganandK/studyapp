// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import ParentDashboard from '../ParentDashboard';
import { emptySkillState } from '../../engine/mastery';
import { saveSkillState, loadAllSkillStates } from '../../services/progressStore';
import { SKILLS } from '../../recipes/skillMap';
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

describe('ParentDashboard — progress follows the active class', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  const props = { ...baseProps, hasPasscode: false, onGradeChange: () => {} };

  it('Class 1 shows only Class 1 skills; Class 2 only Class 2 skills', () => {
    const { rerender } = render(<ParentDashboard {...props} grade={1} />);
    expect(screen.getAllByText(/Class 1/).length).toBeGreaterThan(0); // header line (and the Class control's button)
    const rows = () => [...document.querySelectorAll('[data-skill-id]')].map((e) => e.dataset.skillId);
    const readyIn = (g) => Object.values(SKILLS).filter((k) => k.status === 'ready' && k.grade === g).length;
    expect(rows().every((id) => id.startsWith('g1.'))).toBe(true);
    const class1Rows = rows().length;

    rerender(<ParentDashboard {...props} grade={2} />);
    expect(screen.getAllByText(/Class 2/).length).toBeGreaterThan(0);
    expect(rows().every((id) => id.startsWith('g2.'))).toBe(true);
    // Each class lists its own ready skills (skillMap.js), not the union in both.
    expect(class1Rows).toBe(readyIn(1));
    expect(rows().length).toBe(readyIn(2));
  });
});

describe('ParentDashboard — importing practice days (DECISIONS 2026-10-20)', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });
  const envelope = (extra = {}) => ({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    skills: { [SKILL_ID]: emptySkillState(SKILL_ID, 3) },
    ...extra,
  });
  async function importFile(body) {
    const file = new File([JSON.stringify(body)], 'backup.json', { type: 'application/json' });
    render(<ParentDashboard {...baseProps} hasPasscode={false} />);
    fireEvent.change(screen.getByLabelText(/Import backup/), { target: { files: [file] } });
    await screen.findByText(/This will replace all progress on this device/);
    fireEvent.click(screen.getByRole('button', { name: 'Replace progress' }));
  }
  const days = () => JSON.parse(localStorage.getItem('tinku:v1:practiceDays') ?? '{"days":[]}').days;

  it('a backup that carries practice days restores them (replacing this device\'s list)', async () => {
    localStorage.setItem('tinku:v1:practiceDays', JSON.stringify({ version: 1, days: ['2026-01-01'] }));
    await importFile(envelope({ practiceDays: ['2026-10-19', '2026-10-20'] }));
    await waitFor(() => expect(days()).toEqual(['2026-10-19', '2026-10-20']));
  });

  it('an older backup with no practice days leaves this device\'s own list alone', async () => {
    localStorage.setItem('tinku:v1:practiceDays', JSON.stringify({ version: 1, days: ['2026-10-18'] }));
    await importFile(envelope());
    await waitFor(() => expect(loadAllSkillStates()[SKILL_ID]).toEqual(emptySkillState(SKILL_ID, 3)));
    expect(days()).toEqual(['2026-10-18']);
  });

  it('a backup with damaged practice days is refused and changes nothing', async () => {
    localStorage.setItem('tinku:v1:practiceDays', JSON.stringify({ version: 1, days: ['2026-10-18'] }));
    const file = new File([JSON.stringify(envelope({ practiceDays: ['nope'] }))], 'backup.json', { type: 'application/json' });
    render(<ParentDashboard {...baseProps} hasPasscode={false} />);
    fireEvent.change(screen.getByLabelText(/Import backup/), { target: { files: [file] } });
    expect(await screen.findByText(/looks damaged/)).toBeTruthy();
    expect(days()).toEqual(['2026-10-18']);
  });
});

describe('ParentDashboard — days practised, and the Class control (DECISIONS 2026-10-20)', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });
  const props = { ...baseProps, hasPasscode: false, onGradeChange: () => {} };

  it('shows nothing about days until a session has been finished', () => {
    render(<ParentDashboard {...props} grade={1} />);
    expect(screen.queryByTestId('practice-days')).toBeNull();
  });

  it('shows the total and the first-week figure once there are practice days', () => {
    localStorage.setItem('tinku:v1:practiceDays', JSON.stringify({ version: 1, days: ['2026-10-18', '2026-10-19', '2026-10-20'] }));
    render(<ParentDashboard {...props} grade={1} />);
    const block = screen.getByTestId('practice-days');
    expect(block.textContent).toMatch(/Days practised:\s*3/);
    expect(block.textContent).toMatch(/First week:\s*3 of 7 days/);
  });

  it('puts the Class control in its own section, separate from the test settings', () => {
    render(<ParentDashboard {...props} grade={2} />);
    expect(screen.getByRole('button', { name: 'Class 2' }).getAttribute('aria-pressed')).toBe('true');
    // Theme and warm-up remain test instruments; the class control is not among them.
    const testHeading = screen.getByText('Test settings');
    expect(testHeading.parentElement.parentElement.textContent).not.toMatch(/Class 1/);
  });

  it('exports the practice days along with the progress', async () => {
    saveSkillState(SKILL_ID, emptySkillState(SKILL_ID, 3));
    localStorage.setItem('tinku:v1:practiceDays', JSON.stringify({ version: 1, days: ['2026-10-19', '2026-10-20'] }));
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    render(<ParentDashboard {...props} grade={1} />);
    fireEvent.click(screen.getByRole('button', { name: /Export progress/ }));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
    const exported = JSON.parse(await lastCreatedBlobText(createObjectURL));
    expect(exported.practiceDays).toEqual(['2026-10-19', '2026-10-20']);
    vi.unstubAllGlobals();
  });
});
