import { getGeneratedQuestions } from './generators/mathGenerators';
import { getQuestionsFromHierarchy } from '../data/index'; // New loader
import { randomizeOptions } from './randomizer';

/**
 * The main entry point for getting questions.
 * Routes to either:
 * 1. Infinite Generator (for Math)
 * 2. Static JSON via Hierarchical Loader (Standard/Pro)
 */
export const getQuestions = (topicId) => {
    let questions = [];

    // 1. Try Generators for Arithmetic/Numbers (Grade 1 Math Generators)
    // We check if the topic ID matches known math patterns for Grade 1
    if (topicId.includes('g1-t4') || topicId.includes('g1-t5') || topicId.includes('g1-t3-s3')) {
        // g1-t4: Addition, g1-t5: Subtraction, g1-t3-s3: Before/After
        questions = getGeneratedQuestions(topicId, 5); // Generate 5 questions
    }
    else {
        // 2. Hierarchical Loader
        // Infer grade from topicId (e.g., 'g1-...' -> 'grade-1', 'g2-...' -> 'grade-2')
        // In a future UI update, syllabus/grade/subject would be passed in arguments.
        const gradeId = topicId.startsWith('g1') ? 'grade-1' : 'grade-2';

        // Fetch from the new CBSE/Grade/Subject folder structure
        questions = getQuestionsFromHierarchy('cbse', gradeId, 'math', topicId);
    }

    // Apply Randomization to ALL questions before returning
    // This ensures even static questions get their options shuffled every time
    return (questions || [])
        .filter(q => q && Array.isArray(q.options)) // Filter out invalid questions
        .map(q => {
            const randomized = randomizeOptions(q.options, q.correctAnswer);
            return {
                ...q,
                options: randomized.options,
                correctAnswer: randomized.correctAnswer
            };
        });
};
