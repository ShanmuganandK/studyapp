import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Trophy, Flame, Star } from 'lucide-react';
import { getQuestions } from '../utils/questionFactory';
import { MasteryEngine } from '../utils/masteryEngine';

const QuizEngine = ({ onBack, module }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [streak, setStreak] = useState(0);
    const [masteryFeedback, setMasteryFeedback] = useState(null); // 'mastered' | 'streak'

    useEffect(() => {
        const generatedQuestions = getQuestions(module.id);
        setQuestions(generatedQuestions);

        // Reset state when module changes
        setCurrentQuestionIndex(0);
        setScore(0);
        setShowResult(false);
        setSelectedOption(null);
        setIsCorrect(null);
        setStreak(0);
    }, [module]);

    const handleOptionSelect = (option) => {
        if (selectedOption) return; // Prevent changing answer
        setSelectedOption(option);

        const currentQuestion = questions[currentQuestionIndex];
        const correct = option === currentQuestion.correctAnswer;

        // Record attempt in Mastery Engine
        // We need a unique ID for the question. Since our questions are dynamically generated/fetched, 
        // we'll create a composite ID: module.id + index (in a real app, questions would have DB IDs)
        const questionId = `${module.id}-${currentQuestionIndex}`;
        const result = MasteryEngine.recordAttempt(questionId, correct);

        if (correct) {
            setIsCorrect(true);
            setScore(score + 1);
            setStreak(result.streak);

            if (result.justMastered) {
                setMasteryFeedback('mastered');
            } else if (result.streak > 1) {
                setMasteryFeedback('streak');
            }
        } else {
            setIsCorrect(false);
            setStreak(0);
            setMasteryFeedback(null);
        }

        // Auto advance after delay
        setTimeout(() => {
            setMasteryFeedback(null); // Clear feedback
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setSelectedOption(null);
                setIsCorrect(null);
            } else {
                setShowResult(true);
            }
        }, 2000); // Slightly longer delay to see feedback
    };

    if (questions.length === 0) return <div>Loading...</div>;

    if (showResult) {
        return (
            <div className="flex flex-col h-full items-center justify-center space-y-6 text-center">
                <Trophy size={64} className="text-yellow-400 animate-bounce" />
                <h2 className="text-3xl font-bold text-indigo-900">Quiz Complete!</h2>
                <p className="text-xl text-gray-600">You scored <span className="font-bold text-indigo-600">{score}</span> out of <span className="font-bold text-indigo-600">{questions.length}</span></p>
                <button
                    onClick={onBack}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg"
                >
                    Back to Adventure
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="flex flex-col h-full relative">
            {/* Mastery Feedback Overlay */}
            {masteryFeedback === 'mastered' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <div className="bg-yellow-400 text-yellow-900 px-6 py-4 rounded-3xl shadow-2xl transform animate-bounce flex flex-col items-center">
                        <Star size={48} className="fill-current" />
                        <span className="text-2xl font-black">MASTERED!</span>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-400 transition-all duration-300"
                            style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>
                {/* Streak Indicator */}
                <div className={`flex items-center gap-1 font-bold ${streak > 1 ? 'text-orange-500' : 'text-gray-300'}`}>
                    <Flame size={20} className={streak > 1 ? 'fill-current animate-pulse' : ''} />
                    <span>{streak}</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <h3 className="text-2xl font-bold text-indigo-900 text-center">{currentQuestion.question}</h3>

                <div className="w-full space-y-3">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleOptionSelect(option)}
                            disabled={selectedOption !== null}
                            className={`w-full p-4 rounded-xl border-2 text-lg font-bold transition-all ${selectedOption === option
                                ? isCorrect
                                    ? 'bg-green-100 border-green-400 text-green-700'
                                    : 'bg-red-100 border-red-400 text-red-700'
                                : 'bg-white border-indigo-100 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {selectedOption === option && (
                                    isCorrect ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuizEngine;
