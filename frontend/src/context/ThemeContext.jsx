/**
 * Contexte de thème (clair/sombre) pour l'application SAI.
 * Persiste le choix de l'utilisateur dans localStorage
 * et applique la classe 'dark' sur l'élément racine du document.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(undefined);

/**
 * Fournisseur de thème.
 * Initialise la préférence depuis localStorage ou la préférence système.
 * Applique automatiquement la classe CSS 'dark' sur <html>.
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('sai_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Synchronise la classe 'dark' sur l'élément racine à chaque changement de thème
  useEffect(() => {
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sai_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook pour accéder au contexte thème.
 * Doit être utilisé à l'intérieur d'un <ThemeProvider>.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé dans ThemeProvider');
  }
  return context;
};
