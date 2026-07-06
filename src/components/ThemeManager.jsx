import React, { useState } from 'react';
import RecipeQuizScreen from './RecipeQuizScreen';
import SkillSelectScreen from './SkillSelectScreen';
import SkillPathScreen from './SkillPathScreen';
import Layout from './Layout';
import ParentGateModal from './ParentGateModal';
import ParentDashboard from './ParentDashboard';
import { useAuth } from '../contexts/AuthContext';

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
  const { user, currentProfile, parentSettings } = useAuth();
  const grade = currentProfile?.grade ?? DEFAULT_GRADE;

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

  const handleGateSuccess = () => {
    setIsGateOpen(false);
    if (!isGateSettingMode) {
      // Navigate to parent zone if we were just verifying
      setActiveSkillId(null);
      setCurrentView('parent');
    } else {
      alert("Passcode set successfully!");
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      <ParentGateModal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        onSuccess={handleGateSuccess}
        isSettingMode={isGateSettingMode}
      />

      {currentView === 'skills' &&
        (USE_CARD_HOME ? (
          <SkillSelectScreen onSelectSkill={handleSelectSkill} />
        ) : (
          <SkillPathScreen onSelectSkill={handleSelectSkill} />
        ))}

      {currentView === 'quiz' && activeSkillId && (
        <RecipeQuizScreen grade={grade} skillId={activeSkillId} onBack={handleBackToSkills} />
      )}

      {currentView === 'parent' && (
        <ParentDashboard
          onSetPasscode={() => { setIsGateSettingMode(true); setIsGateOpen(true); }}
          hasPasscode={!!parentSettings?.passcodeHash}
          userEmail={user?.email ?? null}
        />
      )}
    </Layout>
  );
}
