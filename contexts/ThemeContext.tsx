import React, { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '../src/hooks/useLocalStorage';

export type Theme = 'dark' | 'sepia' | 'light';

const THEMES: Theme[] = ['dark', 'sepia', 'light'];

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeRaw] = useLocalStorage<Theme>('unicorn-theme', 'dark');

    const setTheme = (t: Theme) => {
        if (THEMES.includes(t)) setThemeRaw(t);
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
}
