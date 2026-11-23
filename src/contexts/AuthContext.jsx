import { useState, useEffect } from 'react';
import { AuthContext } from './useAuth';
import { authService } from '../services/authService';
import {
  loadParentSettings,
  saveParentSettings,
  loadProfiles,
  saveProfiles,
  loadLastProfileId,
  saveLastProfileId,
  clearLastProfileId,
} from '../services/authSettingsStore';
import logger from '../utils/logger';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [parentSettings, setParentSettings] = useState({ passcodeHash: null });

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
      const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
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
    const unsubscribe = authService.onAuthStateChanged((nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const savedProfiles = loadProfiles(nextUser.uid);
        setProfiles(savedProfiles);

        const lastProfileId = loadLastProfileId(nextUser.uid);
        if (lastProfileId) {
          const lastProfile = savedProfiles.find((p) => p.id === lastProfileId);
          if (lastProfile) {
            setCurrentProfile(lastProfile);
          }
        }
      } else {
        setProfiles([]);
        setCurrentProfile(null);
      }

      // The parent passcode is a device-local, anonymous DETERRENT — it must work with or
      // without a signed-in account (the current build has no anonymous sign-in, so `user`
      // is null on a fresh device). Namespace it under the uid when present, else 'anon',
      // and load it regardless of auth state so it survives reloads.
      setParentSettings(loadParentSettings(nextUser?.uid ?? 'anon'));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await authService.login();
    } catch (error) {
      logger.error('Login failed', error);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setProfiles([]);
      setCurrentProfile(null);
      setParentSettings({ passcodeHash: null });
    } catch (error) {
      logger.error('Logout failed', error);
    }
  };

  const selectProfile = (profile) => {
    setCurrentProfile(profile);
    if (user && profile) {
      saveLastProfileId(user.uid, profile.id);
    }
  };

  const addProfile = (name, grade) => {
    if (!user) return;

    const newProfile = {
      id: `${Date.now()}-${profiles.length + 1}`,
      name,
      grade,
      createdAt: Date.now(),
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    saveProfiles(user.uid, updatedProfiles);
    selectProfile(newProfile);
  };

  const switchProfile = () => {
    setCurrentProfile(null);
    if (user) {
      clearLastProfileId(user.uid);
    }
  };

  const updatePasscode = async (newPasscode) => {
    const passcodeHash = await hashPasscode(newPasscode);
    const newSettings = { ...parentSettings, passcodeHash };
    setParentSettings(newSettings);
    saveParentSettings(user?.uid ?? 'anon', newSettings);
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
    const newSettings = { ...parentSettings, passcodeHash: null };
    setParentSettings(newSettings);
    saveParentSettings(user?.uid ?? 'anon', newSettings);
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
    clearPasscode,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
