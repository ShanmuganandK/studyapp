import { getGeneratedQuestions } from './generators/mathGenerators';
import grade1Static from '../data/static/grade1.json';
import { getQuestionsForTopic as getLegacyQuestions } from '../data/questions';
import { randomizeOptions } from './randomizer';

/**
 * The main entry point for getting questions.
 * Routes to either:
 * 1. Infinite Generator (for Math)
 * 2. Static JSON (for non-math topics)
 * 3. Legacy File (for Grade 2/fallback)
 */
export const getQuestions = (topicId) => {
    let questions = [];

    // 1. Try Generators for Arithmetic/Numbers
    // We check if the topic ID matches known math patterns for Grade 1
    if (topicId.includes('g1-t4') || topicId.includes('g1-t5') || topicId.includes('g1-t3-s3')) {
        // g1-t4: Addition
        // g1-t5: Subtraction
        // g1-t3-s3: Before/After
        questions = getGeneratedQuestions(topicId, 5); // Generate 5 questions
    }
    // 2. Try Static JSON for Grade 1
    else if (grade1Static[topicId]) {
        questions = grade1Static[topicId];
    }
    // 3. Fallback to Legacy (Grade 2 + others)
    else {
        questions = getLegacyQuestions(topicId);
    }

    // Apply Randomization to ALL questions before returning
    // This ensures even static questions get their options shuffled every time
    return questions.map(q => {
        // If the question object structure differs (legacy vs new), handle it
        // Our generators and static JSON use { question, options, correctAnswer }
        // Legacy uses the same.
        const randomized = randomizeOptions(q.options, q.correctAnswer);
        return {
            ...q,
            options: randomized.options,
            correctAnswer: randomized.correctAnswer
        };
    });
};
