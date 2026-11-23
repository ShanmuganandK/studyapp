// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { saveSkillState, loadAllSkillStates } from '../../services/progressStore';
import { emptySkillState } from '../../engine/mastery';
import { recordPracticeDay, loadPracticeDays } from '../../services/practiceDays';
import { BACKUP_FORMAT, buildExportEnvelope } from '../../services/progressBackup';

const saveTextFile = vi.fn(async () => {});
vi.mock('../../services/fileTransfer', () => ({
  saveTextFile: (...args) => saveTextFile(...args),
}));

import useProgressBackup from '../useProgressBackup';

const makeFile = (text) => ({ text: async () => text });

describe('useProgressBackup', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });
  afterEach(cleanup);

  it('tracks hasProgress on mount and exports skills + practice days', async () => {
    const empty = renderHook(() => useProgressBackup());
    expect(empty.result.current.hasProgress).toBe(false);

    saveSkillState('g1.add.within10', emptySkillState('g1.add.within10', 3));
    recordPracticeDay('2026-11-20');

    const withData = renderHook(() => useProgressBackup());
    expect(withData.result.current.hasProgress).toBe(true);

    await act(async () => {
      await withData.result.current.exportProgress();
    });
    expect(saveTextFile).toHaveBeenCalledOnce();
    const [filename, content] = saveTextFile.mock.calls[0];
    expect(filename).toMatch(/^tinku-math-progress-.*\.json$/);
    const parsed = JSON.parse(content);
    expect(parsed.skills['g1.add.within10']).toBeTruthy();
    expect(parsed.practiceDays).toContain('2026-11-20');
  });

  it('surfaces friendly error messages for invalid or unreadable backup files', async () => {
    const { result } = renderHook(() => useProgressBackup());

    await act(async () => {
      await result.current.stageImportFile({ text: async () => { throw new Error('io'); } });
    });
    expect(result.current.importError).toBe("That doesn't look like a Tinku Math backup file.");
    expect(result.current.pendingImport).toBeNull();

    await act(async () => {
      await result.current.stageImportFile(makeFile(JSON.stringify({ wrong: true })));
    });
    expect(result.current.importError).toBe("That file isn't a Tinku Math backup file.");

    await act(async () => {
      await result.current.stageImportFile(makeFile(JSON.stringify({ format: BACKUP_FORMAT, version: 99, skills: {} })));
    });
    expect(result.current.importError).toBe('That backup was made by a newer version of the app.');
  });

  it('stages a valid backup and applies or cancels cleanly', async () => {
    const envelope = buildExportEnvelope(
      {
        'g1.add.within10': emptySkillState('g1.add.within10', 3),
        'unknown.skill': emptySkillState('unknown.skill', 3),
      },
      new Date('2026-11-21T00:00:00Z'),
      ['2026-11-19', '2026-11-20'],
    );

    const { result } = renderHook(() => useProgressBackup());
    await act(async () => {
      await result.current.stageImportFile(makeFile(JSON.stringify(envelope)));
    });
    expect(result.current.importError).toBeNull();
    expect(result.current.pendingImport).toEqual({ skillCount: 1, ignoredSkillCount: 1 });

    act(() => result.current.cancelImport());
    expect(result.current.pendingImport).toBeNull();
    expect(loadAllSkillStates()).toEqual({});

    await act(async () => {
      await result.current.stageImportFile(makeFile(JSON.stringify(envelope)));
    });
    act(() => result.current.confirmImport());
    expect(result.current.pendingImport).toBeNull();
    expect(loadAllSkillStates()['g1.add.within10']).toBeTruthy();
    expect(loadPracticeDays()).toEqual(['2026-11-19', '2026-11-20']);
  });
});
