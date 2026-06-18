// src/utils/StampEngine.js

const STAMP_STORAGE_KEY = 'passport_stamps';

export const StampEngine = {
  getStoredData() {
    try {
      const data = localStorage.getItem(STAMP_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to read from localStorage', e);
      return {};
    }
  },

  saveData(data) {
    try {
      localStorage.setItem(STAMP_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  },

  unlockStamp(topicId, grade) {
    const data = this.getStoredData();
    if (!data[grade]) {
      data[grade] = [];
    }
    
    if (!data[grade].includes(topicId)) {
      data[grade].push(topicId);
      this.saveData(data);
      return true; // Newly unlocked
    }
    return false; // Already unlocked
  },

  getPocketedStamps(grade) {
    const data = this.getStoredData();
    return data[grade] || [];
  }
};

export default StampEngine;
