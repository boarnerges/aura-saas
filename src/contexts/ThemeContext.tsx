"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";

export type Theme = "light" | "dark" | "midnight";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme, persist?: boolean) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // 1. Initialize with a default to avoid the "localStorage is not defined" server error
  const [theme, setThemeState] = useState<Theme>("light");

  // Function to apply theme to HTML element
  const applyThemeToHtml = useCallback((selectedTheme: Theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", selectedTheme);
    }
  }, []);

  // 2. This effect runs ONLY on the client after the first render
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme;
    if (storedTheme) {
      setThemeState(storedTheme);
      applyThemeToHtml(storedTheme);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const initialTheme = prefersDark ? "dark" : "light";
      setThemeState(initialTheme);
      applyThemeToHtml(initialTheme);
    }
  }, [applyThemeToHtml]);

  // Update theme state and optionally persist
  const setTheme = useCallback(
    (newTheme: Theme, persist: boolean = true) => {
      setThemeState(newTheme);
      applyThemeToHtml(newTheme);
      if (typeof window !== "undefined") {
        if (persist) {
          localStorage.setItem("theme", newTheme);
        } else {
          localStorage.removeItem("theme");
        }
      }
    },
    [applyThemeToHtml],
  );

  const toggleTheme = useCallback(() => {
    const themes: Theme[] = ["light", "dark", "midnight"];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
