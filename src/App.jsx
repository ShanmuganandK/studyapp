import React, { useState } from 'react'
import Layout from './components/Layout'
import Syllabus from './components/Syllabus'
import VisualFractions from './components/modules/VisualFractions'
import VisualAddition from './components/modules/VisualAddition'
import QuizEngine from './components/QuizEngine'

function App() {
  const [currentView, setCurrentView] = useState('home'); // home, syllabus, module
  const [activeModule, setActiveModule] = useState(null);

  const handleStart = () => {
    setCurrentView('syllabus');
  };

  const handleSelectModule = (module) => {
    setActiveModule(module);
    setCurrentView('module');
  };

  const handleBackToSyllabus = () => {
    setActiveModule(null);
    setCurrentView('syllabus');
  };

  return (
    <Layout>
      {currentView === 'home' && (
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-3xl font-extrabold text-indigo-900 text-center leading-tight">
            Math Kids <br />
            <span className="text-indigo-600 text-xl">CBSE Learning</span>
          </h1>
          <button
            onClick={handleStart}
            className="bg-green-400 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 text-lg"
          >
            Start Learning
          </button>
        </div>
      )}

      {currentView === 'syllabus' && (
        <Syllabus onSelectModule={handleSelectModule} />
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
