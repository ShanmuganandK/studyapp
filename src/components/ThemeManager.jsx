import { useState } from 'react';
import RecipeQuizScreen from './RecipeQuizScreen';
import SkillSelectScreen from './SkillSelectScreen';
import SkillPathScreen from './SkillPathScreen';
import Layout from './Layout';
import ParentGateModal from './ParentGateModal';
import ParentDashboard from './ParentDashboard';
import { useAuth } from '../contexts/AuthContext';
import useTestSettings from '../hooks/useTestSettings';

// EXPERIMENT (screen-3b): SkillPathScreen is the current default Home (kid-test in progress).
// `?home=cards` switches to the card-list variant (SkillSelectScreen) for A/B comparison —
// same production build serves both variants without a deploy.
// To RETIRE the path and restore card-list as default: swap the ternary below, remove the
// SkillPathScreen import + the `path-pulse` keyframe in index.css, and delete SkillPathScreen.jsx.
const USE_CARD_HOME =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('home') === 'cards';

/**
 * Wonder-band default grade. Grade is a parent-set profile property (DECISIONS: no child
 * grade-wall); until that parent flow returns we default a profile-less (anonymous) child to
 * Grade 1. All `ready` skills are Grade 1 today, and the engine falls back to all ready skills
 * regardless, so a brand-new user always lands cleanly on the skill screen.
 */
const DEFAULT_GRADE = 1;

export default function ThemeManager() {
  const { user, currentProfile, parentSettings, clearPasscode } = useAuth();

  // Parent test panel (TRACKER #10): theme + grade, behind the gate. useTestSettings also owns
  // the side-effect that applies the theme class to <body> (so the portalled parent gate re-themes
  // — see the hook). NOTE the name: THIS file manages VIEWS, not colour themes; theming logic lives
  // in the hook, not here. The name collision is now live — flagged for a later rename decision.
  const { theme, grade: testGrade, setTheme, setGrade } = useTestSettings();

  // A real parent profile (deferred) wins if it ever returns; else the test-panel grade; else 1.
  // currentProfile is always null on the current build, so testGrade is the effective grade today.
  const grade = currentProfile?.grade ?? testGrade ?? DEFAULT_GRADE;

  // The only child-reachable path: skill-selection → quiz → session-end (inside the quiz).
  const [currentView, setCurrentView] = useState('skills');
  const [activeSkillId, setActiveSkillId] = useState(null);
  const [isGateOpen, setIsGateOpen] = useState(false);
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

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate} scrollLocked={isGateOpen}>
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

      {currentView === 'skills' &&
        (USE_CARD_HOME ? (
          <SkillSelectScreen grade={grade} onSelectSkill={handleSelectSkill} />
        ) : (
          <SkillPathScreen grade={grade} onSelectSkill={handleSelectSkill} />
        ))}

      {currentView === 'quiz' && activeSkillId && (
        <RecipeQuizScreen grade={grade} skillId={activeSkillId} onBack={handleBackToSkills} />
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
        />
      )}
    </Layout>
  );
}
