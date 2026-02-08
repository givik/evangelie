'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');
    const [fontSize, setFontSize] = useState(1);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [language, setLanguage] = useState('new');

    // Load settings from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('reader_theme');
            const storedFontSize = parseFloat(localStorage.getItem('reader_fontSize'));

            if (storedTheme) setTheme(storedTheme);
            if (!isNaN(storedFontSize)) {
                setFontSize(storedFontSize);
            } else if (window.innerWidth <= 768) {
                setFontSize(1.1);
            }
            setSettingsLoaded(true);
        }
    }, []);

    // Update theme data attribute
    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('reader_theme', newTheme);
            return newTheme;
        });
    };

    const updateFontSize = (change) => {
        setFontSize((prev) => {
            const newSize = Math.max(0.9, Math.min(1.7, prev + change));
            localStorage.setItem('reader_fontSize', newSize);
            return newSize;
        });
    };

    const updateLanguage = (change) => {
        setLanguage((prev) => {
            const newLanguage = prev === 'new' ? 'old' : 'new';
            localStorage.setItem('reader_language', newLanguage);
            return newLanguage;
        });
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                toggleTheme,
                fontSize,
                updateFontSize,
                settingsLoaded,
                language,
                updateLanguage,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
