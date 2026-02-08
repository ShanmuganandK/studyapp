import React, { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Syllabus from './components/Syllabus'
import VisualFractions from './components/modules/VisualFractions'
import VisualAddition from './components/modules/VisualAddition'
import QuizEngine from './components/QuizEngine'
import AdventureLadder from './components/AdventureLadder'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import ProfileSelector from './components/ProfileSelector'

function AppContent() {
  const { user, currentProfile, loading } = useAuth();
  const [currentView, setCurrentView] = useState('syllabus');
  const [activeModule, setActiveModule] = useState(null);

  // Reset view when profile changes
  useEffect(() => {
    if (currentProfile) {
      setCurrentView('syllabus');
      setActiveModule(null);
    }
  }, [currentProfile]);

  if (loading) return <div className="min-h-screen bg-indigo-900 flex items-center justify-center text-white">Loading...</div>;

  if (!user) {
    return <Login />;
  }

  if (!currentProfile) {
    return <ProfileSelector />;
  }

  const handleSelectModule = (module) => {
    setActiveModule(module);
    setCurrentView('module');
  };

  const handleBackToSyllabus = () => {
    setActiveModule(null);
    setCurrentView('syllabus'); // Go back to syllabus (Home) by default
  };

  const handleNavigate = (view) => {
    if (view === 'parent') {
      const answer = prompt("Parent Gate: What is 10 + 5?");
      if (answer !== '15') {
        alert("Incorrect! Access denied.");
        return;
      }
    }
    setActiveModule(null);
    setCurrentView(view);
  };

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {currentView === 'ladder' && (
        <AdventureLadder onSelectModule={handleSelectModule} />
      )}

      {currentView === 'syllabus' && (
        <Syllabus onSelectModule={handleSelectModule} />
      )}

      {currentView === 'parent' && (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <h2 className="text-2xl font-bold text-indigo-900 mb-4">Parent Zone 🔒</h2>
          <p className="text-gray-600 mb-6">Settings coming soon!</p>
          <div className="bg-indigo-50 p-4 rounded-xl mb-6 text-left w-full">
            <p className="text-sm font-bold text-gray-500">Current Profile</p>
            <p className="text-xl font-bold text-indigo-900">{currentProfile.name}</p>
            <p className="text-sm text-indigo-600 capitalize">{currentProfile.grade}</p>
          </div>

          <button
            onClick={() => window.location.reload()} // Simple way to "switch profile" for now or use context
            className="bg-indigo-100 text-indigo-700 px-6 py-3 rounded-full font-bold w-full hover:bg-indigo-200 transition-colors"
          >
            Switch Profile
          </button>
        </div>
      )}

      {currentView === 'module' && activeModule && (
        <>
          {activeModule.type === 'visual-fractions' && (
            <VisualFractions onBack={handleBackToSyllabus} />
          )}
          {activeModule.type === 'visual-addition' && (
            <VisualAddition onBack={handleBackToSyllabus} />
          )}
          {activeModule.type === 'quiz' && (
            <QuizEngine onBack={handleBackToSyllabus} module={activeModule} />
          )}
        </>
      )}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
