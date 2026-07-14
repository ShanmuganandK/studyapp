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
    //
    // `crypto.subtle` only exists in a SECURE context (HTTPS or localhost). On a non-secure dev
    // origin (e.g. a LAN IP over HTTP) it's undefined, which would throw and silently break both
    // set and verify. The gate is a DETERRENT, not a security boundary (DECISIONS 2026-07-14), so
    // we fall back to a simple non-crypto hash there — the PIN still works, just without SHA. The
    // `plain:` prefix keeps the two schemes from ever colliding on a single origin.
    const hashPasscode = async (code) => {
        if (globalThis.crypto?.subtle) {
            const data = new TextEncoder().encode(code);
            const digest = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(digest))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');
        }
        // Non-secure context fallback (deterrent only): FNV-1a-style string hash.
        let h = 0x811c9dc5;
        for (let i = 0; i < code.length; i++) {
            h ^= code.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return 'plain:' + (h >>> 0).toString(16);
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

    // Remove the passcode entirely — the parent zone then opens ungated until a new code is set
    // (the deterrent's no-code state). Used by "Remove passcode" and the forgot-passcode recovery.
    // Persists to the SAME settings key; no new storage. Never touches child progress.
    const clearPasscode = () => {
        if (!user) return;
        const newSettings = { ...parentSettings, passcodeHash: null };
        setParentSettings(newSettings);
        localStorage.setItem(getSettingsKey(user.uid), JSON.stringify(newSettings));
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
        verifyPasscode,
        clearPasscode
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
