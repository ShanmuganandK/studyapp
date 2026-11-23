import React, { useState, useEffect } from 'react';
import { SYLLABUS } from '../data/syllabus';
import { getQuestions } from '../utils/questionFactory';
import { MasteryEngine } from '../utils/masteryEngine';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Star, Play, CheckCircle } from 'lucide-react';

const AdventureLadder = ({ onSelectModule }) => {
    const { currentProfile } = useAuth();
    const [totalStars, setTotalStars] = useState(0);
    const [moduleStats, setModuleStats] = useState({});

    useEffect(() => {
        if (!currentProfile) return;

        // Calculate stats for all modules
        const stats = {};
        let total = 0;

        SYLLABUS.forEach(grade => {
            grade.topics.forEach(topic => {
                topic.subtopics.forEach(subtopic => {
                    // Get questions for this subtopic
                    const questions = getQuestions(subtopic.id) || [];

                    // Count mastered questions
                    let masteredCount = 0;
                    questions.forEach((q, index) => {
                        const qId = `${subtopic.id}-${index}`;
                        const qStats = MasteryEngine.getQuestionStats(qId, currentProfile.id);
                        if (qStats.status === 'mastered') {
                            masteredCount++;
                        }
                    });

                    stats[subtopic.id] = {
                        mastered: masteredCount,
                        total: questions.length,
                        isUnlocked: true // Unlock everything for now
                    };

                    total += masteredCount;
                });
            });
        });

        setModuleStats(stats);
        setTotalStars(total);
    }, [currentProfile]);

    const handleStageClick = (subtopic) => {
        onSelectModule({ ...subtopic, type: 'quiz' });
    };

    return (
        <div className="flex flex-col items-center w-full pb-20">
            {/* Header / Stats */}
            <div className="w-full bg-indigo-600 text-white p-4 rounded-b-3xl shadow-lg mb-6 sticky top-0 z-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Adventure Map</h2>
                        <p className="text-indigo-200 text-sm">Keep climbing!</p>
                    </div>
                    <div className="flex items-center gap-2 bg-indigo-800 px-3 py-1 rounded-full">
                        <Star className="text-yellow-400 fill-yellow-400" size={20} />
                        <span className="font-bold">{totalStars}</span>
                    </div>
                </div>
            </div>

            {/* Ladder */}
            <div className="relative w-full max-w-xs flex flex-col items-center gap-8">
                {/* Vertical Line */}
                <div className="absolute left-1/2 top-4 bottom-4 w-2 bg-indigo-100 -translate-x-1/2 rounded-full -z-10"></div>

                {SYLLABUS.map((grade) => (
                    <div key={grade.id} className="w-full flex flex-col items-center gap-6">
                        {/* Grade Header */}
                        <div className="bg-white border-2 border-indigo-100 px-4 py-1 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-widest mt-4">
                            {grade.title}
                        </div>

                        {grade.topics.map((topic) => (
                            <div key={topic.id} className="w-full flex flex-col items-center gap-4">
                                {topic.subtopics.map((subtopic, index) => {
                                    const stats = moduleStats[subtopic.id] || { mastered: 0, total: 0, isUnlocked: true };
                                    const isUnlocked = stats.isUnlocked;
                                    const alignLeft = index % 2 === 0;

                                    // Calculate stars to show (max 3)
                                    const starCount = Math.min(stats.mastered, 3);

                                    return (
                                        <div
                                            key={subtopic.id}
                                            onClick={() => isUnlocked && handleStageClick(subtopic)}
                                            className={`relative w-full flex ${alignLeft ? 'justify-start' : 'justify-end'} px-4`}
                                        >
                                            {/* Node */}
                                            <div className={`
                                                w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center text-center p-2 shadow-xl transform transition-all duration-300
                                                ${isUnlocked
                                                    ? 'bg-white border-indigo-500 cursor-pointer hover:scale-105 active:scale-95'
                                                    : 'bg-gray-100 border-gray-300 opacity-70 grayscale'}
                                            `}>
                                                <div className="mb-1">
                                                    {isUnlocked ? (
                                                        <Play size={20} className="text-indigo-500 fill-indigo-100" />
                                                    ) : (
                                                        <Lock size={20} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-700 leading-tight line-clamp-2">
                                                    {subtopic.title}
                                                </span>

                                                {/* Stars Indicator */}
                                                <div className="flex gap-0.5 mt-1">
                                                    {[...Array(3)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={10}
                                                            className={`${i < starCount ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Connector Dot on Line */}
                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-300 rounded-full border-2 border-white shadow-sm"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdventureLadder;
