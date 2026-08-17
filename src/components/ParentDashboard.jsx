import { useState } from 'react';
import { Lock, MessageCircle, Download, Upload } from 'lucide-react';
import Mascot from './Mascot';
import MasteryPips from './MasteryPips';
import { loadAllSkillStates } from '../services/progressStore';
import { progressSummary } from '../engine/progressSummary';
import { MASTERY } from '../config/masteryConfig';
import { feedbackWhatsAppUrl } from '../config/constants';
import useProgressBackup from '../hooks/useProgressBackup';
import PrivacyNotice from './PrivacyNotice';
import PrivacyPolicy from './PrivacyPolicy';

// ─── Local helpers ────────────────────────────────────────────────────────────

function levelLabel(level) {
  if (level >= MASTERY.MASTERED_LEVEL) return 'Mastered ⭐';
  if (level >= MASTERY.UNLOCK_LEVEL) return 'Doing great';
  return 'Learning';
}

function levelLabelColour(level) {
  if (level >= MASTERY.MASTERED_LEVEL) return 'text-accent';
  if (level >= MASTERY.UNLOCK_LEVEL) return 'text-primary';
  return 'text-learn-ink';
}


function SkillRow({ skill }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-primary-soft last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {skill.icon && (
          <span className="text-2xl flex-shrink-0" aria-hidden="true">
            {skill.icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{skill.displayName}</p>
          {skill.subtitle && (
            <p className="text-xs text-muted">{skill.subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
        <MasteryPips level={skill.level} />
        {skill.level > 0 && (
          <span className={`text-xs font-medium ${levelLabelColour(skill.level)}`}>
            {levelLabel(skill.level)}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold text-muted uppercase tracking-wide px-4 pt-4 pb-0.5">
      {children}
    </p>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ParentDashboard — encouraging progress snapshot for parents, behind the parent gate.
 * Reads local mastery data (no account, no cloud). Logic lives in progressSummary.js;
 * this component only renders.
 *
 * Tone: positive, never judgmental. No grades, percentages, rankings, or guilt.
 *
 * @param {() => void}  onSetPasscode    - triggers the parent gate in "set passcode" mode
 * @param {() => void}  onRemovePasscode - clears the stored passcode (zone then opens ungated)
 * @param {boolean}     hasPasscode      - whether a passcode is already set
 * @param {string|null} userEmail        - logged-in email, or null
 */
export default function ParentDashboard({ onSetPasscode, onRemovePasscode, hasPasscode, userEmail }) {
  // Single storage read on mount; remounts when navigating back from child view.
  const [summary] = useState(() => {
    const skillStates = loadAllSkillStates();
    const today = new Date().toISOString().slice(0, 10);
    return progressSummary(skillStates, today);
  });

  const { mastered, inProgress, notStarted, masteredCount, lastActivity } = summary;
  const totalReady = mastered.length + inProgress.length + notStarted.length;

  // Inline "Remove passcode?" confirm — avoids an accidental one-tap removal of the gate.
  const [confirmRemove, setConfirmRemove] = useState(false);

  const {
    hasProgress,
    exportProgress,
    pendingImport,
    importError,
    stageImportFile,
    confirmImport,
    cancelImport,
  } = useProgressBackup();

  // Full policy swaps in over the dashboard rather than routing or opening a browser tab:
  // Designed-for-Families wants it reachable in-app, and in the Capacitor wrap an external
  // link would drop the parent out of the app entirely. Local state — nothing above the
  // parent zone needs to know this view exists.
  const [showPolicy, setShowPolicy] = useState(false);

  if (showPolicy) {
    return <PrivacyPolicy onBack={() => setShowPolicy(false)} />;
  }

  return (
    <div className="flex flex-col min-h-full bg-bg overflow-y-auto">

      {/* ── Warm header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center pt-6 pb-4 px-4 text-center">
        <Mascot emotion="happy" size={80} />
        <h1 className="font-display text-xl font-extrabold text-primary-ink mt-3">
          Your child's progress
        </h1>
        <p className="text-sm text-muted mt-0.5">Tinku Math</p>
      </div>

      <div className="px-4 pb-8 space-y-4">

        {/* ── Wins highlight ──────────────────────────────────────────────── */}
        <div className="bg-accent-soft rounded-card shadow-card p-4">
          {masteredCount > 0 ? (
            <>
              <p className="font-bold text-primary-ink text-base">
                {masteredCount === 1
                  ? '1 skill mastered! 🎉'
                  : `${masteredCount} skills mastered! 🎉`}
              </p>
              <p className="text-sm text-ink mt-0.5">
                {masteredCount === totalReady
                  ? 'All ready skills complete — wonderful work!'
                  : 'Keep it up — great progress so far!'}
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-primary-ink text-base">Just getting started ✨</p>
              <p className="text-sm text-ink mt-0.5">
                Every bit of practice helps — great things take a little time!
              </p>
            </>
          )}
        </div>

        {/* ── Currently working on ─────────────────────────────────────────── */}
        {inProgress.length > 0 && (
          <div className="bg-learn-soft rounded-card p-4">
            <p className="text-xs font-semibold text-learn-ink uppercase tracking-wide mb-2">
              Currently working on
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {inProgress.map((s) => (
                <span key={s.skillId} className="text-sm text-ink font-medium">
                  {s.icon} {s.displayName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Skills list ──────────────────────────────────────────────────── */}
        <div className="bg-bg-card rounded-card border border-primary-soft overflow-hidden">
          {mastered.length > 0 && (
            <>
              <SectionLabel>Mastered</SectionLabel>
              <div className="px-4">
                {mastered.map((s) => <SkillRow key={s.skillId} skill={s} />)}
              </div>
            </>
          )}

          {inProgress.length > 0 && (
            <>
              <SectionLabel>In progress</SectionLabel>
              <div className="px-4">
                {inProgress.map((s) => <SkillRow key={s.skillId} skill={s} />)}
              </div>
            </>
          )}

          {notStarted.length > 0 && (
            <>
              <SectionLabel>Not started yet</SectionLabel>
              <div className="px-4 pb-2">
                {notStarted.map((s) => <SkillRow key={s.skillId} skill={s} />)}
              </div>
            </>
          )}
        </div>

        {/* ── Light activity signal ────────────────────────────────────────── */}
        <div className="text-center py-1">
          {lastActivity ? (
            <p className="text-xs text-muted">
              Last practised:{' '}
              <span className="text-ink font-medium">{lastActivity}</span>
            </p>
          ) : (
            <p className="text-xs text-muted">
              No practice sessions yet — pick a skill to get started!
            </p>
          )}
        </div>

        {/* ── Privacy reassurance ──────────────────────────────────────────── */}
        <PrivacyNotice variant="card" onReadPolicy={() => setShowPolicy(true)} />

        {/* ── Settings footer ──────────────────────────────────────────────── */}
        <div className="border-t border-primary-soft pt-4 space-y-3">
          <button
            onClick={onSetPasscode}
            className="w-full bg-primary text-white rounded-button shadow-button font-semibold py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Lock size={18} />
            {hasPasscode ? 'Change Passcode' : 'Set Parent Passcode'}
          </button>

          {/* Remove passcode — only when one is set. Two-step inline confirm (no modal system):
              removing the code leaves the parent zone open ungated until a new code is set. */}
          {hasPasscode && (
            confirmRemove ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setConfirmRemove(false); onRemovePasscode(); }}
                  className="flex-1 bg-encourage text-encourage-ink rounded-button font-semibold py-2.5 text-sm active:scale-95 transition-transform"
                >
                  Remove passcode
                </button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="flex-1 border border-primary-soft text-muted rounded-button font-semibold py-2.5 text-sm active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRemove(true)}
                className="w-full py-2.5 text-sm text-muted hover:text-encourage-ink transition-colors"
              >
                Remove passcode
              </button>
            )
          )}

          {/* Progress backup — export/import as a local JSON file (TRACKER "Now" #3). Zero
              server, zero account: REPLACE-not-merge import behind a two-step confirm. */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">
              Progress backup
            </p>

            {pendingImport ? (
              <div className="bg-learn-soft rounded-card p-3 space-y-2">
                <p className="text-sm text-ink">
                  This will replace all progress on this device with the backup (
                  {pendingImport.skillCount} skill{pendingImport.skillCount === 1 ? '' : 's'}
                  {pendingImport.ignoredSkillCount > 0
                    ? `, ${pendingImport.ignoredSkillCount} skipped — not in this app version`
                    : ''}
                  ). This can't be undone.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={confirmImport}
                    className="flex-1 bg-primary text-white rounded-button font-semibold py-2.5 text-sm active:scale-95 transition-transform"
                  >
                    Replace progress
                  </button>
                  <button
                    onClick={cancelImport}
                    className="flex-1 border border-primary-soft text-muted rounded-button font-semibold py-2.5 text-sm active:scale-95 transition-transform"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={exportProgress}
                  disabled={!hasProgress}
                  className="w-full border border-primary-soft text-ink rounded-button font-semibold py-2.5 text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                >
                  <Download size={16} />
                  Export progress
                </button>
                {!hasProgress && (
                  <p className="text-xs text-muted text-center">
                    Play a few questions first — there'll be something to save!
                  </p>
                )}

                <label className="w-full border border-primary-soft text-ink rounded-button font-semibold py-2.5 text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer">
                  <Upload size={16} />
                  Import backup
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = ''; // allow re-selecting the same filename later
                      if (file) stageImportFile(file);
                    }}
                  />
                </label>
                {importError && (
                  <p className="text-xs text-encourage-ink text-center">{importError}</p>
                )}
              </>
            )}
          </div>

          <a
            href={feedbackWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-muted hover:text-learn-ink transition-colors"
          >
            <MessageCircle size={16} />
            Report a bug / Give feedback
          </a>

          {userEmail && (
            <p className="text-xs text-muted text-center">
              Logged in as {userEmail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
