import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context
const ThemeContext = createContext(null);

// Hook for using the theme context
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  
  // Check for saved theme or system preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);
  
  // Toggle theme between light and dark
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  // Set a specific theme
  const setThemeMode = (mode) => {
    setTheme(mode);
    localStorage.setItem('theme', mode);
  };
  
  // Add theme class to document element
  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('light-theme', 'dark-theme');
    root.classList.add(`${theme}-theme`);
    
    // For Tailwind dark mode
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);
  
  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeMode
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};