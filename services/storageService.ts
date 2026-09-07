import { NexusProjectState } from '../types';

const STORAGE_KEY = 'karisfa_pm_current_project';

export const saveLocalProject = (state: NexusProjectState): void => {
    try {
        const serialized = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, serialized);
        console.log("Saved to local storage at " + new Date().toLocaleTimeString());
    } catch (e) {
        console.error("Failed to save to local storage", e);
        // Handle quota exceeded
    }
};

export const loadLocalProject = (): NexusProjectState | null => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return null;
        return JSON.parse(data) as NexusProjectState;
    } catch (e) {
        console.error("Failed to load from local storage", e);
        return null;
    }
};

export const clearLocalProject = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};