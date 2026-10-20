import { useRef, useState } from 'react';
import { SKILLS } from '../recipes/skillMap';
import { loadAllSkillStates, replaceAllSkillStates } from '../services/progressStore';
import { saveTextFile } from '../services/fileTransfer';
import { loadPracticeDays, replacePracticeDays } from '../services/practiceDays';
import { buildExportEnvelope, exportFilename, parseImportPayload } from '../services/progressBackup';

/**
 * useProgressBackup — orchestrates parent-zone progress export/import (TRACKER "Now" #3) so
 * ParentDashboard stays presentational. Wires the pure envelope logic (progressBackup.js) and
 * the persistence seam (progressStore.js) into React state, same role useQuizSession plays for
 * the session flow.
 *
 * Error copy lives HERE (not in progressBackup.js, which stays copy-free like mastery.js, and
 * not scattered inline in the component) — this is the orchestration/presentation boundary.
 */
const ERROR_MESSAGES = {
  'not-json': "That doesn't look like a Tinku Math backup file.",
  'wrong-format': "That file isn't a Tinku Math backup file.",
  'unsupported-version': 'That backup was made by a newer version of the app.',
  'malformed-skills': 'That backup file looks damaged.',
  'malformed-practice-days': 'That backup file looks damaged.',
};

export default function useProgressBackup() {
  // Read once on mount — same snapshot pattern ParentDashboard already uses for progressSummary.
  const [hasProgress] = useState(() => Object.keys(loadAllSkillStates()).length > 0);

  const [pendingImport, setPendingImport] = useState(null); // { skillCount, ignoredSkillCount } | null
  const [importError, setImportError] = useState(null);
  const stagedSkillsRef = useRef(null); // validated skills, held until confirmImport
  const stagedDaysRef = useRef(null); // validated practice days (null = the file had none), held with it

  // Web: downloads the file. Android: opens the share sheet (services/fileTransfer.js).
  async function exportProgress() {
    const skills = loadAllSkillStates();
    const envelope = buildExportEnvelope(skills, new Date(), loadPracticeDays());
    await saveTextFile(exportFilename(), JSON.stringify(envelope, null, 2));
  }

  async function stageImportFile(file) {
    setImportError(null);
    setPendingImport(null);
    let text;
    try {
      text = await file.text();
    } catch {
      setImportError(ERROR_MESSAGES['not-json']);
      return;
    }

    const result = parseImportPayload(text, Object.keys(SKILLS));
    if (!result.valid) {
      setImportError(ERROR_MESSAGES[result.error]);
      return;
    }

    stagedSkillsRef.current = result.skills;
    stagedDaysRef.current = result.practiceDays;
    setPendingImport({
      skillCount: Object.keys(result.skills).length,
      ignoredSkillCount: result.ignoredSkillCount,
    });
  }

  function confirmImport() {
    if (!stagedSkillsRef.current) return;
    replaceAllSkillStates(stagedSkillsRef.current);
    // A backup that carries practice days restores them too; an older backup without any leaves this device's own list alone.
    if (stagedDaysRef.current) replacePracticeDays(stagedDaysRef.current);
    stagedSkillsRef.current = null;
    stagedDaysRef.current = null;
    setPendingImport(null);
  }

  function cancelImport() {
    stagedSkillsRef.current = null;
    stagedDaysRef.current = null;
    setPendingImport(null);
    setImportError(null);
  }

  return {
    hasProgress,
    exportProgress,
    pendingImport,
    importError,
    stageImportFile,
    confirmImport,
    cancelImport,
  };
}
