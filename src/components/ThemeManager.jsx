import React, { useState } from 'react';
import RecipeQuizScreen from './RecipeQuizScreen';
import SkillSelectScreen from './SkillSelectScreen';
import Layout from './Layout';
import ParentGateModal from './ParentGateModal';
import { useAuth } from '../contexts/AuthContext';
import { Lock } from 'lucide-react';

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
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
          <h2 className="text-2xl font-bold text-indigo-900">Parent Zone 🔒</h2>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">Kid Profile</span>
              <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-bold">Active</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {currentProfile?.name?.[0] || 'E'}
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-indigo-900">{currentProfile?.name || 'Explorer'}</p>
                <p className="text-sm text-indigo-600 capitalize">Grade {grade}</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={() => {
                setIsGateSettingMode(true);
                setIsGateOpen(true);
              }}
              className="w-full bg-white border-2 border-indigo-100 text-indigo-700 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
            >
              <Lock size={18} />
              {parentSettings?.passcode ? "Change Passcode" : "Set Parent Passcode"}
            </button>
          </div>

          {user && (
            <p className="text-xs text-gray-400 mt-8">
              Logged in as {user.email}
            </p>
          )}
        </div>
      )}
    </Layout>
  );
}
