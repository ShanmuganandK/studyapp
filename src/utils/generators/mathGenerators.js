import { getRandomInt, shuffleArray } from '../randomizer';

/**
 * Generates an addition question.
 * @param {number} min - Min number to add
 * @param {number} max - Max number to add
 */
export const generateAdditionQuestion = (min = 1, max = 9) => {
    const num1 = getRandomInt(min, max);
    const num2 = getRandomInt(min, max);
    const sum = num1 + num2;

    const distraction1 = sum + getRandomInt(1, 3);
    const distraction2 = sum - getRandomInt(1, 3);
    const distraction3 = sum + getRandomInt(4, 5);

    // Filter out duplicates and negative numbers
    let options = [sum, distraction1, distraction2, distraction3];
    options = options.map(n => Math.abs(n)); // Avoid negatives
    options = [...new Set(options)]; // Remove duplicates

    // Fill up if we lost duplicates
    while (options.length < 4) {
        options.push(getRandomInt(min + min, max + max + 5));
        options = [...new Set(options)];
    }

    const shuffledOptions = shuffleArray(options);

    return {
        question: `${num1} + ${num2} = ?`,
        options: shuffledOptions.map(String),
        correctAnswer: String(sum)
    };
};

/**
 * Generates a "What comes after" question
 */
export const generateAfterQuestion = (max = 20) => {
    const num = getRandomInt(1, max - 1);
    const answer = num + 1;

    const options = shuffleArray([
        answer,
        answer + 1,
        answer - 2,
        answer + 5
    ].map(n => Math.abs(n)));

    return {
        question: `What comes after ${num}?`,
        options: options.map(String),
        correctAnswer: String(answer)
    };
};

/**
 * Route specific topic IDs to generator logic
 */
export const getGeneratedQuestions = (topicId, count = 5) => {
    const questions = [];

    for (let i = 0; i < count; i++) {
        let q;
        if (topicId.includes('addition')) {
            q = generateAdditionQuestion(1, 9);
        } else if (topicId.includes('subtraction')) {
            // Placeholder logic for now, reusing addition logic but inverted could be next
            q = generateAdditionQuestion(1, 9);
        } else {
            // Default fallbacks
            q = generateAfterQuestion(20);
        }
        questions.push(q);
    }

    return questions;
};
