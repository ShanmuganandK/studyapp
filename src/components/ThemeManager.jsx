import React, { useState } from 'react';
import RecipeQuizScreen from './RecipeQuizScreen';
import SkillSelectScreen from './SkillSelectScreen';
import Layout from './Layout';
import ParentGateModal from './ParentGateModal';
import ParentDashboard from './ParentDashboard';
import { useAuth } from '../contexts/AuthContext';

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

      {currentView === 'skills' && (
        <SkillSelectScreen onSelectSkill={handleSelectSkill} />
      )}

      {currentView === 'quiz' && activeSkillId && (
        <RecipeQuizScreen grade={grade} skillId={activeSkillId} onBack={handleBackToSkills} />
      )}

      {currentView === 'parent' && (
        <ParentDashboard
          onSetPasscode={() => { setIsGateSettingMode(true); setIsGateOpen(true); }}
          hasPasscode={!!parentSettings?.passcode}
          userEmail={user?.email ?? null}
        />
      )}
    </Layout>
  );
}
