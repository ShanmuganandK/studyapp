import React, { useState, useEffect } from 'react';
import AdventureLadder from './AdventureLadder';
import PassportDashboard from './PassportDashboard';
import QuizEngine from './QuizEngine';
import RecipeQuizScreen from './RecipeQuizScreen';
import Layout from './Layout';
import { flags } from '../config/flags';
import Syllabus from './Syllabus';
import ParentGateModal from './ParentGateModal';
import VisualFractions from './modules/VisualFractions';
import VisualAddition from './modules/VisualAddition';
import { useAuth } from '../contexts/AuthContext';
import { Lock } from 'lucide-react';

const ProfileSetup = ({ onComplete }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-slate-700">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Explorer!</h1>
        <p className="text-slate-400 mb-8">What grade are you in?</p>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((grade) => (
            <button
              key={grade}
              onClick={() => onComplete(grade)}
              className="py-6 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-50 text-white font-bold text-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center"
            >
              Grade {grade}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ThemeManager() {
  const { user, currentProfile, parentSettings } = useAuth();
  const [userGrade, setUserGrade] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [currentView, setCurrentView] = useState('ladder');
  const [activeModule, setActiveModule] = useState(null);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isGateSettingMode, setIsGateSettingMode] = useState(false);

  useEffect(() => {
    // Read from offline-first localStorage
    const grade = localStorage.getItem('userGrade');
    if (grade) {
      setUserGrade(parseInt(grade, 10));
    }
    setLoading(false);
  }, []);

  const handleGradeSelection = (grade) => {
    localStorage.setItem('userGrade', grade.toString());
    setUserGrade(grade);
    setCurrentView('ladder');
  };

  const handleSelectModule = (module) => {
    setActiveModule(module);
    setCurrentView('module');
  };

  const handleBackToDashboard = () => {
    setActiveModule(null);
    setCurrentView('ladder');
  };

  const handleNavigate = (view) => {
    if (view === 'parent') {
      setIsGateSettingMode(false);
      setIsGateOpen(true);
      return;
    }
    setActiveModule(null);
    setCurrentView(view);
  };

  const handleGateSuccess = () => {
    setIsGateOpen(false);
    if (!isGateSettingMode) {
      // Navigate to parent zone if we were just verifying
      setActiveModule(null);
      setCurrentView('parent');
    } else {
      alert("Passcode set successfully!");
    }
  };

  if (loading) return null;

  // Step 1: Render ProfileSetup if no userGrade is present
  if (!userGrade) {
    return <ProfileSetup onComplete={handleGradeSelection} />;
  }

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      <ParentGateModal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        onSuccess={handleGateSuccess}
        isSettingMode={isGateSettingMode}
      />

      {currentView === 'syllabus' && (
        <Syllabus onSelectModule={handleSelectModule} />
      )}

      {currentView === 'ladder' && (
        userGrade <= 2 ? (
          <AdventureLadder onSelectModule={handleSelectModule} />
        ) : (
          <PassportDashboard userGrade={userGrade} onSelectTopic={handleSelectModule} />
        )
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
                <p className="text-sm text-indigo-600 capitalize">Grade {userGrade}</p>
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

            <button
              onClick={() => {
                localStorage.removeItem('userGrade');
                window.location.reload();
              }}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95"
            >
              Switch Grade / Profile
            </button>
          </div>

          {user && (
            <p className="text-xs text-gray-400 mt-8">
              Logged in as {user.email}
            </p>
          )}
        </div>
      )}

      {currentView === 'module' && activeModule && (
        <>
          {activeModule.type === 'visual-fractions' && (
            <VisualFractions onBack={handleBackToDashboard} />
          )}
          {activeModule.type === 'visual-addition' && (
            <VisualAddition onBack={handleBackToDashboard} />
          )}
          {activeModule.type === 'quiz' && (
            // Strangler-fig branch: flag ON → new recipe engine; OFF → legacy quiz (untouched).
            flags.useRecipeEngine ? (
              <RecipeQuizScreen grade={userGrade} onBack={handleBackToDashboard} />
            ) : (
              <QuizEngine onBack={handleBackToDashboard} module={activeModule} />
            )
          )}
        </>
      )}
    </Layout>
  );
}
