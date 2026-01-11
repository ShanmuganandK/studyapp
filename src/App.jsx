import React, { useState } from 'react'
import Layout from './components/Layout'
import Syllabus from './components/Syllabus'
import VisualFractions from './components/modules/VisualFractions'
import VisualAddition from './components/modules/VisualAddition'
import QuizEngine from './components/QuizEngine'
import AdventureLadder from './components/AdventureLadder'

function App() {
  const [currentView, setCurrentView] = useState('ladder'); // ladder, syllabus, module, parent
  const [activeModule, setActiveModule] = useState(null);

  const handleSelectModule = (module) => {
    setActiveModule(module);
    setCurrentView('module');
  };

  const handleBackToSyllabus = () => {
    setActiveModule(null);
    setCurrentView('ladder'); // Go back to ladder by default
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
          <p className="text-gray-600 mb-6">Settings and detailed progress reports coming soon!</p>
          <button
            onClick={() => setCurrentView('ladder')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold"
          >
            Back to App
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

export default App
