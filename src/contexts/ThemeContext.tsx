"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";

type Theme = "light" | "dark" | "midnight";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme, persist?: boolean) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem("theme") as Theme;
    if (storedTheme) {
      return storedTheme;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  // Function to apply theme to HTML element
  const applyThemeToHtml = useCallback((selectedTheme: Theme) => {
    document.documentElement.setAttribute("data-theme", selectedTheme);
  }, []);

  // Apply theme to HTML element when theme state changes
  useEffect(() => {
    applyThemeToHtml(theme);
  }, [theme, applyThemeToHtml]);

  // Update theme state and optionally persist
  const setTheme = useCallback(
    (newTheme: Theme, persist: boolean = true) => {
      setThemeState(newTheme);
      applyThemeToHtml(newTheme);
      if (persist) {
        localStorage.setItem("theme", newTheme);
      } else {
        localStorage.removeItem("theme"); // Remove if not persisting (e.g., using profile theme)
      }
    },
    [applyThemeToHtml],
  );

  // Simple toggle between light/dark/midnight
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      if (prevTheme === "light") return "dark";
      if (prevTheme === "dark") return "midnight";
      return "light";
    });
  }, [setTheme]);

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
