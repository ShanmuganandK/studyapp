import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Star, Lock, Unlock } from 'lucide-react';
import { SYLLABUS } from '../data/syllabus';

const Syllabus = ({ onSelectModule }) => {
    const [expandedGrade, setExpandedGrade] = useState('grade-1');
    const [expandedTopic, setExpandedTopic] = useState(null);

    const toggleGrade = (gradeId) => {
        setExpandedGrade(expandedGrade === gradeId ? null : gradeId);
    };

    const toggleTopic = (topicId) => {
        setExpandedTopic(expandedTopic === topicId ? null : topicId);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-indigo-900 mb-6">Learning Path</h2>

            {SYLLABUS.map((grade) => (
                <div key={grade.id} className="border-2 border-indigo-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <button
                        onClick={() => toggleGrade(grade.id)}
                        className={`w-full flex items-center justify-between p-4 ${expandedGrade === grade.id ? 'bg-indigo-50' : 'bg-white'}`}
                    >
                        <span className="font-bold text-lg text-indigo-800">{grade.title}</span>
                        {expandedGrade === grade.id ? <ChevronDown className="text-indigo-400" /> : <ChevronRight className="text-indigo-400" />}
                    </button>

                    {expandedGrade === grade.id && (
                        <div className="p-2 space-y-2 bg-indigo-50/50">
                            {grade.topics.map((topic) => (
                                <div key={topic.id} className="bg-white rounded-xl border border-indigo-100 overflow-hidden">
                                    <button
                                        onClick={() => toggleTopic(topic.id)}
                                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                                    >
                                        <span className="font-semibold text-indigo-700">{topic.title}</span>
                                        {expandedTopic === topic.id ? <ChevronDown size={16} className="text-indigo-300" /> : <ChevronRight size={16} className="text-indigo-300" />}
                                    </button>

                                    {expandedTopic === topic.id && (
                                        <div className="px-3 pb-3 pt-1 space-y-2">
                                            {topic.subtopics.map((subtopic) => (
                                                <button
                                                    key={subtopic.id}
                                                    onClick={() => onSelectModule(subtopic)}
                                                    className="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-700">
                                                            <Star size={16} fill="currentColor" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-900 text-left">
                                                            {subtopic.title}
                                                        </span>
                                                    </div>
                                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                                        <Unlock size={12} className="text-green-600" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Syllabus;
