import React, { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Syllabus from './components/Syllabus'
import VisualFractions from './components/modules/VisualFractions'
import VisualAddition from './components/modules/VisualAddition'
import QuizEngine from './components/QuizEngine'
import AdventureLadder from './components/AdventureLadder'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import ParentGateModal from './components/ParentGateModal'
import { Lock } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-900">
          <h2>Something went wrong.</h2>
          <pre className="text-sm mt-2">{this.state.error?.toString()}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { user, currentProfile, loading, parentSettings } = useAuth();
  const [currentView, setCurrentView] = useState('syllabus');
  const [activeModule, setActiveModule] = useState(null);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isGateSettingMode, setIsGateSettingMode] = useState(false);

  // Reset view when profile changes
  useEffect(() => {
    if (currentProfile) {
      setCurrentView('syllabus');
      setActiveModule(null);
    }
  }, [currentProfile]);

  useEffect(() => {
    console.log("App State:", { currentView, activeModule, user: !!user, currentProfile });
  }, [currentView, activeModule, user, currentProfile]);

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



  // ... (useEffect reset)

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
      // If we were setting a code, just close the modal (success feedback could be added)
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

      {currentView === 'syllabus' && (
        <Syllabus onSelectModule={handleSelectModule} />
      )}

      {currentView === 'ladder' && (
        <AdventureLadder onSelectModule={handleSelectModule} />
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
                {currentProfile?.name?.[0]}
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-indigo-900">{currentProfile?.name}</p>
                <p className="text-sm text-indigo-600 capitalize">{currentProfile?.grade}</p>
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
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95"
            >
              Switch Profile
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-8">
            Logged in as {user?.email}
          </p>
        </div>
      )}

      {/* ... (Modules) ... */}
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
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
