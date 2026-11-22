/**
 * Utility for randomizing quiz elements
 */

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * Returns a new array, does not mutate the original.
 * @param {Array} array 
 * @returns {Array} Shuffled array
 */
export const shuffleArray = (array) => {
    if (!array || !Array.isArray(array)) return [];
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

/**
 * Shuffles options for a question and ensures the correct answer string is preserved.
 * Useful when you have a list of options where the first one is correct in your source data.
 * @param {Array} options - List of option strings
 * @param {string} correctAnswer - The correct answer string
 * @returns {Object} { options: [], correctAnswer: string }
 */
export const randomizeOptions = (options, correctAnswer) => {
    // Just shuffle the options array
    // The correctAnswer string remains the same, so string comparison still works
    return {
        options: shuffleArray(options),
        correctAnswer: correctAnswer
    };
};

/**
 * Returns a random integer between min and max (inclusive)
 */
export const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
