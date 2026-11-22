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

/**
 * Mastery Engine
 * Implements a simplified "Leitner System" + "Streak Mastery" for kids.
 * Now supports multiple profiles.
 */

const getStorageKey = (profileId) => `math_kids_mastery_${profileId}`;

// Load progress from local storage
const loadProgress = (profileId) => {
    try {
        if (!profileId) return {};
        const stored = localStorage.getItem(getStorageKey(profileId));
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        console.error("Failed to load mastery progress", e);
        return {};
    }
};

// Save progress to local storage
const saveProgress = (profileId, progress) => {
    try {
        if (!profileId) return;
        localStorage.setItem(getStorageKey(profileId), JSON.stringify(progress));
    } catch (e) {
        console.error("Failed to save mastery progress", e);
    }
};

export const MasteryEngine = {
    /**
     * Records the result of a question attempt.
     */
    recordAttempt: (questionId, isCorrect, profileId) => {
        if (!profileId) return { streak: 0, isMastered: false };

        const progress = loadProgress(profileId);
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

        saveProgress(profileId, progress);

        return {
            streak: newStreak,
            isMastered: newStatus === 'mastered',
            justMastered
        };
    },

    /**
     * Gets the current stats for a question.
     */
    getQuestionStats: (questionId, profileId) => {
        const progress = loadProgress(profileId);
        return progress[questionId] || { streak: 0, status: 'new' };
    },

    /**
     * Returns the total number of stars (mastered questions)
     */
    getTotalStars: (profileId) => {
        const progress = loadProgress(profileId);
        return Object.values(progress).filter(p => p.status === 'mastered').length;
    },

    /**
     * Smart Recommendation Algorithm
     */
    getRecommendedQuestions: (allQuestions, count = 5, profileId) => {
        const progress = loadProgress(profileId);

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
        learning.sort(() => Math.random() - 0.5);
        selected.push(...learning.slice(0, count));

        // 2. Fill remaining slots with New questions
        if (selected.length < count) {
            newQs.sort(() => Math.random() - 0.5);
            selected.push(...newQs.slice(0, count - selected.length));
        }

        // 3. If still need more, add Review
        if (selected.length < count && mastered.length > 0) {
            mastered.sort((a, b) => {
                const timeA = progress[a.id]?.lastAttempt || 0;
                const timeB = progress[b.id]?.lastAttempt || 0;
                return timeA - timeB; // Oldest first
            });
            selected.push(...mastered.slice(0, count - selected.length));
        }

        return selected;
    }
};
