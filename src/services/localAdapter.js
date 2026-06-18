// Local/Mock Authentication Adapter for offline-first development when Firebase keys are not configured.

let currentUser = {
    uid: "local-dev-user-id",
    displayName: "Local Explorer",
    email: "explorer@local.dev",
};

let authListeners = [];

export const localAdapter = {
    loginWithGoogle: async () => {
        currentUser = {
            uid: "local-dev-user-id",
            displayName: "Local Explorer",
            email: "explorer@local.dev",
        };
        authListeners.forEach(cb => cb(currentUser));
        return currentUser;
    },

    logout: async () => {
        currentUser = null;
        authListeners.forEach(cb => cb(null));
    },

    onAuthStateChanged: (callback) => {
        authListeners.push(callback);
        // Immediately trigger callback with initial user
        setTimeout(() => callback(currentUser), 0);
        return () => {
            authListeners = authListeners.filter(cb => cb !== callback);
        };
    },

    getCurrentUser: () => {
        return currentUser;
    }
};
