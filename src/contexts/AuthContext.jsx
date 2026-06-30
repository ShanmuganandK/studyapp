import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [currentProfile, setCurrentProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [parentSettings, setParentSettings] = useState({ passcodeHash: null });

    // Persist key helper
    const getProfilesKey = (uid) => `math_kids_profiles_${uid}`;
    const getLastProfileKey = (uid) => `math_kids_last_profile_${uid}`;
    const getSettingsKey = (uid) => `math_kids_settings_${uid}`;

    // Hash the parent PIN before persisting — never store it in cleartext (the device's
    // localStorage is readable by anyone with the device / devtools). SHA-256 via Web Crypto;
    // verify by comparing hashes. Note: a 4-digit PIN is low-entropy, so this is a
    // proportionate kid-gate hardening, not strong cryptographic protection.
    const hashPasscode = async (code) => {
        const data = new TextEncoder().encode(code);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    };

    useEffect(() => {
        const unsubscribe = authService.onAuthStateChanged((user) => {
            setUser(user);
            if (user) {
                // Load profiles
                const savedProfiles = localStorage.getItem(getProfilesKey(user.uid));
                if (savedProfiles) {
                    setProfiles(JSON.parse(savedProfiles));
                }

                // Load Settings
                const savedSettings = localStorage.getItem(getSettingsKey(user.uid));
                if (savedSettings) {
                    setParentSettings(JSON.parse(savedSettings));
                }

                // Auto-restore last active profile
                const lastProfileId = localStorage.getItem(getLastProfileKey(user.uid));
                if (lastProfileId && savedProfiles) {
                    const parsedProfiles = JSON.parse(savedProfiles);
                    const lastProfile = parsedProfiles.find(p => p.id === lastProfileId);
                    if (lastProfile) {
                        setCurrentProfile(lastProfile);
                    }
                }
            } else {
                setProfiles([]);
                setCurrentProfile(null);
                setParentSettings({ passcodeHash: null });
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async () => {
        try {
            await authService.login();
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            // Clear local state
            setUser(null);
            setProfiles([]);
            setCurrentProfile(null);
            setParentSettings({ passcode: null });
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const addProfile = (name, grade) => {
        if (!user) return;

        const newProfile = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            grade,
            createdAt: Date.now()
        };

        const updatedProfiles = [...profiles, newProfile];
        setProfiles(updatedProfiles);

        // Save to LocalStorage
        localStorage.setItem(getProfilesKey(user.uid), JSON.stringify(updatedProfiles));

        // Auto-select newly created profile
        selectProfile(newProfile);
    };

    const selectProfile = (profile) => {
        setCurrentProfile(profile);
        if (user && profile) {
            localStorage.setItem(getLastProfileKey(user.uid), profile.id);
        }
    };

    const switchProfile = () => {
        setCurrentProfile(null);
        if (user) {
            localStorage.removeItem(getLastProfileKey(user.uid));
        }
    };

    const updatePasscode = async (newPasscode) => {
        if (!user) return;
        const passcodeHash = await hashPasscode(newPasscode);
        const newSettings = { ...parentSettings, passcodeHash };
        setParentSettings(newSettings);
        localStorage.setItem(getSettingsKey(user.uid), JSON.stringify(newSettings));
    };

    const verifyPasscode = async (inputCode) => {
        if (!parentSettings.passcodeHash) return true; // Open if no code set
        const inputHash = await hashPasscode(inputCode);
        return parentSettings.passcodeHash === inputHash;
    };

    const value = {
        user,
        profiles,
        currentProfile,
        parentSettings,
        loading,
        login,
        logout,
        addProfile,
        selectProfile,
        switchProfile,
        updatePasscode,
        verifyPasscode
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
