/**
 * Mastery Engine
 * Implements a simplified "Leitner System" + "Streak Mastery" for kids.
 * 
 * Logic:
 * - Tracks 'streak' (consecutive correct answers) for each question.
 * - 3 Correct in a row = "Mastered" (Gold Star).
 * - Incorrect = Reset streak to 0.
 * - Stores progress in localStorage.
 */

const STORAGE_KEY = 'math_kids_mastery_v1';

// Load progress from local storage
const loadProgress = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        console.error("Failed to load mastery progress", e);
        return {};
    }
};

// Save progress to local storage
const saveProgress = (progress) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
        console.error("Failed to save mastery progress", e);
    }
};

export const MasteryEngine = {
    /**
     * Records the result of a question attempt.
     * @param {string} questionId - Unique ID of the question
     * @param {boolean} isCorrect - Whether the answer was correct
     * @returns {object} - Updated status for the question { streak, isMastered, justMastered }
     */
    recordAttempt: (questionId, isCorrect) => {
        const progress = loadProgress();
        const current = progress[questionId] || { streak: 0, status: 'learning' };

        let newStreak = current.streak;
        let newStatus = current.status;
        let justMastered = false;

        if (isCorrect) {
            newStreak += 1;
            // Mastery Threshold: 3 consecutive correct answers
            if (newStreak >= 3 && newStatus !== 'mastered') {
                newStatus = 'mastered';
                justMastered = true;
            }
        } else {
            newStreak = 0; // Reset streak on failure
            newStatus = 'learning'; // Demote to learning if it was mastered
        }

        progress[questionId] = {
            streak: newStreak,
            status: newStatus,
            lastAttempt: Date.now()
        };

        saveProgress(progress);

        return {
            streak: newStreak,
            isMastered: newStatus === 'mastered',
            justMastered
        };
    },

    /**
     * Gets the current stats for a question.
     * @param {string} questionId 
     */
    getQuestionStats: (questionId) => {
        const progress = loadProgress();
        return progress[questionId] || { streak: 0, status: 'new' };
    },

    /**
     * Returns the total number of stars (mastered questions)
     */
    getTotalStars: () => {
        const progress = loadProgress();
        return Object.values(progress).filter(p => p.status === 'mastered').length;
    },

    /**
     * Smart Recommendation Algorithm
     * Prioritizes:
     * 1. Active "Learning" questions (streak > 0 but < 3)
     * 2. New questions (never attempted)
     * 3. Mastered questions (Review - 10% chance)
     * 
     * @param {Array} allQuestions - Array of question objects with 'id'
     * @param {number} count - Number of questions to return
     */
    getRecommendedQuestions: (allQuestions, count = 5) => {
        const progress = loadProgress();

        // Categorize questions
        const learning = [];
        const newQs = [];
        const mastered = [];

        allQuestions.forEach(q => {
            const p = progress[q.id];
            if (!p) {
                newQs.push(q);
            } else if (p.status === 'mastered') {
                mastered.push(q);
            } else {
                learning.push(q);
            }
        });

        const selected = [];

        // 1. Prioritize Learning (Finish what you started)
        // Shuffle learning questions to mix them up
        learning.sort(() => Math.random() - 0.5);
        selected.push(...learning.slice(0, count));

        // 2. Fill remaining slots with New questions
        if (selected.length < count) {
            newQs.sort(() => Math.random() - 0.5);
            selected.push(...newQs.slice(0, count - selected.length));
        }

        // 3. If still need more (or occasionally), add Review
        // Force add a review question if we have space and mastered questions exist
        if (selected.length < count && mastered.length > 0) {
            mastered.sort((a, b) => {
                // Prioritize reviewing items not seen in a while
                const timeA = progress[a.id]?.lastAttempt || 0;
                const timeB = progress[b.id]?.lastAttempt || 0;
                return timeA - timeB; // Oldest first
            });
            selected.push(...mastered.slice(0, count - selected.length));
        }

        return selected;
    }
};
