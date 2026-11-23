import { useState } from 'react';
import RecipeQuizScreen from './RecipeQuizScreen';
import SkillPathScreen from './SkillPathScreen';
import Layout from './Layout';
import ParentGateModal from './ParentGateModal';
import ParentDashboard from './ParentDashboard';
import GradePickerScreen from './GradePickerScreen';
import { useAuth } from '../contexts/useAuth';
import useTestSettings from '../hooks/useTestSettings';
import useAndroidBackButton from '../hooks/useAndroidBackButton';

/**
 * Wonder-band default grade. Grade is a parent-set profile property (DECISIONS: no child
 * grade-wall); until that parent flow returns we default a profile-less (anonymous) child to
 * Grade 1. All `ready` skills are Grade 1 today, and the engine falls back to all ready skills
 * regardless, so a brand-new user always lands cleanly on the skill screen.
 */
const DEFAULT_GRADE = 1;

/** Top-level view router (`'skills' | 'quiz' | 'parent'`). Theme side-effects live in `useTestSettings`. */
export default function AppRouter() {
  const { user, currentProfile, parentSettings, clearPasscode } = useAuth();

  // Parent test panel (TRACKER #10): theme + grade, behind the gate. useTestSettings also owns
  // the side-effect that applies the theme class to <body> (so the portalled parent gate re-themes
  // — see the hook).
  const {
    theme,
    grade: testGrade,
    bridgeEnabled,
    gradeChosen,
    setTheme,
    setGrade,
    setBridgeEnabled,
    chooseInitialGrade,
  } = useTestSettings();

  // A real parent profile (deferred) wins if it ever returns; else the test-panel grade; else 1.
  // currentProfile is always null on the current build, so testGrade is the effective grade today.
  const grade = currentProfile?.grade ?? testGrade ?? DEFAULT_GRADE;

  // The only child-reachable path: skill-selection → quiz → session-end (inside the quiz).
  const [currentView, setCurrentView] = useState('skills');
  const [activeSkillId, setActiveSkillId] = useState(null);
  const [isGateOpen, setIsGateOpen] = useState(false);
  // True while the quiz is on its summary screen: the bottom nav is hidden during questions only.
  const [sessionDone, setSessionDone] = useState(false);
  const [isGateSettingMode, setIsGateSettingMode] = useState(false);

  const handleSelectSkill = (skillId) => {
    setActiveSkillId(skillId);
    setCurrentView('quiz');
  };

  const handleBackToSkills = () => {
    setActiveSkillId(null);
    setCurrentView('skills');
  };

  const handleNavigate = (view) => {
    if (view === 'parent') {
      setIsGateSettingMode(false);
      setIsGateOpen(true);
      return;
    }
    setActiveSkillId(null);
    setCurrentView(view);
  };

  const closeGate = () => {
    setIsGateOpen(false);
    setIsGateSettingMode(false); // never let the "setting" flag leak into the next open
  };

  const handleGateSuccess = () => {
    setIsGateOpen(false);
    setIsGateSettingMode(false);
    setActiveSkillId(null);
    setCurrentView('parent');
  };

  // Android Back button (no-op on web): close the gate → leave quiz/parent → exit from the list.
  useAndroidBackButton({ isGateOpen, currentView }, { closeGate, goToSkills: handleBackToSkills });

  // First-run grade picker (DECISIONS 2026-09-23): shown ONLY when this device has never had
  // test settings written — replaces the whole app output (no Layout/nav chrome, no other UI).
  // chooseInitialGrade sets `grade` and `gradeChosen` together, so the very next render falls
  // through to the normal `currentView === 'skills'` branch below, already on the chosen grade —
  // no separate "go to skill path" step needed.
  if (!gradeChosen) {
    return <GradePickerScreen onChoose={chooseInitialGrade} />;
  }

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate} scrollLocked={isGateOpen} hideNav={currentView === 'quiz' && !sessionDone}>
      {/* Mounted only while open so it starts fresh each time — its internal mode initialises
          from isSettingMode with no stale-state lag (fixes the first-click-no-op race). */}
      {isGateOpen && (
        <ParentGateModal
          isOpen
          onClose={closeGate}
          onSuccess={handleGateSuccess}
          isSettingMode={isGateSettingMode}
        />
      )}

      {currentView === 'skills' && (
        <SkillPathScreen grade={grade} onSelectSkill={handleSelectSkill} />
      )}

      {currentView === 'quiz' && activeSkillId && (
        <RecipeQuizScreen
          // Keyed by skill so "Next with Tinku →" (a new skillId) remounts a fresh session.
          key={activeSkillId}
          grade={grade}
          skillId={activeSkillId}
          onBack={handleBackToSkills}
          onNextSkill={handleSelectSkill}
          bridgeEnabled={bridgeEnabled}
          onSessionComplete={setSessionDone}
        />
      )}

      {currentView === 'parent' && (
        <ParentDashboard
          onSetPasscode={() => { setIsGateSettingMode(true); setIsGateOpen(true); }}
          onRemovePasscode={clearPasscode}
          hasPasscode={!!parentSettings?.passcodeHash}
          userEmail={user?.email ?? null}
          theme={theme}
          onThemeChange={setTheme}
          grade={testGrade}
          onGradeChange={setGrade}
          bridgeEnabled={bridgeEnabled}
          onBridgeEnabledChange={setBridgeEnabled}
        />
      )}
    </Layout>
  );
}
