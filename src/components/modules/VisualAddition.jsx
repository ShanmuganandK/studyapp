import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Check, X } from 'lucide-react';

const EMOJIS = ['🍎', '🍌', '🐶', '🐱', '⚽', '🚗'];

const VisualAddition = ({ onBack }) => {
    const [num1, setNum1] = useState(2);
    const [num2, setNum2] = useState(3);
    const [emoji, setEmoji] = useState(EMOJIS[0]);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect', null

    const generateProblem = () => {
        setNum1(Math.floor(Math.random() * 5) + 1);
        setNum2(Math.floor(Math.random() * 5) + 1);
        setEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
        setUserAnswer('');
        setFeedback(null);
    };

    const checkAnswer = () => {
        const sum = num1 + num2;
        if (parseInt(userAnswer) === sum) {
            setFeedback('correct');
        } else {
            setFeedback('incorrect');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-indigo-900">Visual Addition</h2>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-8">

                {/* Visuals */}
                <div className="flex items-center gap-4 text-4xl sm:text-5xl">
                    <div className="flex gap-1 flex-wrap justify-center max-w-[120px]">
                        {Array.from({ length: num1 }).map((_, i) => (
                            <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>{emoji}</span>
                        ))}
                    </div>
                    <span className="text-gray-400 font-bold">+</span>
                    <div className="flex gap-1 flex-wrap justify-center max-w-[120px]">
                        {Array.from({ length: num2 }).map((_, i) => (
                            <span key={i} className="animate-bounce" style={{ animationDelay: `${(num1 + i) * 0.1}s` }}>{emoji}</span>
                        ))}
                    </div>
                </div>

                {/* Equation */}
                <div className="text-3xl font-bold text-indigo-900 flex items-center gap-4">
                    <span>{num1}</span>
                    <span>+</span>
                    <span>{num2}</span>
                    <span>=</span>
                    <input
                        type="number"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className={`w-20 h-16 text-center border-4 rounded-xl text-3xl focus:outline-none ${feedback === 'correct' ? 'border-green-400 bg-green-50 text-green-700' :
                                feedback === 'incorrect' ? 'border-red-400 bg-red-50 text-red-700' :
                                    'border-indigo-200 focus:border-indigo-500'
                            }`}
                        placeholder="?"
                    />
                </div>

                {/* Feedback & Controls */}
                <div className="space-y-4 w-full max-w-xs">
                    <button
                        onClick={checkAnswer}
                        disabled={!userAnswer || feedback === 'correct'}
                        className={`w-full py-4 rounded-xl font-bold text-xl shadow-lg transform transition active:scale-95 ${feedback === 'correct' ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                    >
                        {feedback === 'correct' ? 'Awesome! 🎉' : 'Check Answer'}
                    </button>

                    {feedback === 'correct' && (
                        <button
                            onClick={generateProblem}
                            className="w-full py-3 rounded-xl font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={20} /> Next Problem
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default VisualAddition;
