import grade1Math from './cbse/grade1/math/questions.json';
import grade2Math from './cbse/grade2/math/questions.json';

// In a real production app with lazy loading, we might use dynamic imports here.
// For now, we statically consolidate them into a lookup map to support the hierarchy.

const questionDatabase = {
    cbse: {
        grade1: {
            math: grade1Math
        },
        grade2: {
            math: grade2Math
        }
    }
};

const DEFAULT_QUESTIONS = [
    {
        question: "What is 1 + 1?",
        options: ["1", "2", "3", "4"],
        correctAnswer: "2"
    }
];

export const getQuestionsFromHierarchy = (syllabus = 'cbse', gradeId, subjectId = 'math', topicId) => {
    try {
        // Normalize IDs to match keys (e.g., 'grade-1' -> 'grade1')
        // This simple normalization assumes the ID format 'grade-X' 
        const gradeKey = gradeId.replace('-', '');

        const syllabusData = questionDatabase[syllabus];
        if (!syllabusData) return DEFAULT_QUESTIONS;

        const gradeData = syllabusData[gradeKey];
        if (!gradeData) return DEFAULT_QUESTIONS;

        const subjectData = gradeData[subjectId];
        if (!subjectData) return DEFAULT_QUESTIONS;

        const topicQuestions = subjectData[topicId];

        return topicQuestions || DEFAULT_QUESTIONS;
    } catch (error) {
        console.error("Error fetching questions:", error);
        return DEFAULT_QUESTIONS;
    }
};
