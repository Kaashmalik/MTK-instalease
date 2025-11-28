'use client';

import { createContext, useContext, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Get system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Apply theme to document
const applyThemeToDOM = (newTheme: Theme): 'light' | 'dark' => {
  if (typeof document === 'undefined') return 'light';
  
  const root = document.documentElement;
  const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
  
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  
  // Update meta theme-color for mobile browsers
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', resolved === 'dark' ? '#1f2937' : '#ffffff');
  }
  
  return resolved;
};

// Theme store for external sync
let themeListeners: Array<() => void> = [];
let currentTheme: Theme = 'system';
let currentResolved: 'light' | 'dark' = 'light';

const themeStore = {
  getTheme: () => currentTheme,
  getResolved: () => currentResolved,
  setTheme: (newTheme: Theme) => {
    currentTheme = newTheme;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('instalease-theme', newTheme);
    }
    currentResolved = applyThemeToDOM(newTheme);
    themeListeners.forEach(listener => listener());
  },
  subscribe: (listener: () => void) => {
    themeListeners.push(listener);
    return () => {
      themeListeners = themeListeners.filter(l => l !== listener);
    };
  },
  init: () => {
    if (typeof localStorage !== 'undefined') {
      currentTheme = (localStorage.getItem('instalease-theme') as Theme) || 'system';
    }
    currentResolved = applyThemeToDOM(currentTheme);
  }
};

// Initialize theme store immediately on module load
if (typeof window !== 'undefined') {
  themeStore.init();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use external store for theme state
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getTheme,
    () => 'system' as Theme
  );
  
  const resolvedTheme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getResolved,
    () => 'light' as const
  );

  const setTheme = useCallback((newTheme: Theme) => {
    themeStore.setTheme(newTheme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (currentTheme === 'system') {
        currentResolved = applyThemeToDOM('system');
        themeListeners.forEach(listener => listener());
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Memoize context value
  const contextValue = useMemo(() => ({
    theme,
    setTheme,
    resolvedTheme
  }), [theme, setTheme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
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
