import { useRef, useState } from 'react';
import { SKILLS } from '../recipes/skillMap';
import { loadAllSkillStates, replaceAllSkillStates } from '../services/progressStore';
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
};

export default function useProgressBackup() {
  // Read once on mount — same snapshot pattern ParentDashboard already uses for progressSummary.
  const [hasProgress] = useState(() => Object.keys(loadAllSkillStates()).length > 0);

  const [pendingImport, setPendingImport] = useState(null); // { skillCount, ignoredSkillCount } | null
  const [importError, setImportError] = useState(null);
  const stagedSkillsRef = useRef(null); // validated skills, held until confirmImport

  function exportProgress() {
    const skills = loadAllSkillStates();
    const envelope = buildExportEnvelope(skills);
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
    setPendingImport({
      skillCount: Object.keys(result.skills).length,
      ignoredSkillCount: result.ignoredSkillCount,
    });
  }

  function confirmImport() {
    if (!stagedSkillsRef.current) return;
    replaceAllSkillStates(stagedSkillsRef.current);
    stagedSkillsRef.current = null;
    setPendingImport(null);
  }

  function cancelImport() {
    stagedSkillsRef.current = null;
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
