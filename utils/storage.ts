const STORAGE_PREFIX = 'react-unicorn-';

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (item === null) {
            return defaultValue;
        }
        return JSON.parse(item);
    } catch (e) {
        console.error(`Error loading key "${key}" from storage`, e);
        return defaultValue;
    }
};

export const saveToStorage = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (e) {
        console.error(`Error saving key "${key}" to storage`, e);
    }
};
