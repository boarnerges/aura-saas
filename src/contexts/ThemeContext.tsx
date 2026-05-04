"use client";

import React, {
  createContext,
  useEffect,
  useContext,
  useCallback,
  useSyncExternalStore,
} from "react";

export type Theme = "light" | "dark" | "midnight";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme, persist?: boolean) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes: Theme[] = ["light", "dark", "midnight"];
const themeChangeEvent = "aura-theme-change";

function isTheme(value: string | null): value is Theme {
  return themes.includes(value as Theme);
}

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const activeTheme = document.documentElement.getAttribute("data-theme");
  if (isTheme(activeTheme)) return activeTheme;

  const storedTheme = localStorage.getItem("theme");
  if (isTheme(storedTheme)) return storedTheme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribeToThemeUpdates(callback: () => void) {
  window.addEventListener(themeChangeEvent, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(themeChangeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

function applyThemeToHtml(selectedTheme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", selectedTheme);
  }
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useSyncExternalStore<Theme>(
    subscribeToThemeUpdates,
    getPreferredTheme,
    () => "light",
  );

  useEffect(() => {
    applyThemeToHtml(theme);
  }, [theme]);

  const setTheme = useCallback(
    (newTheme: Theme, persist: boolean = true) => {
      applyThemeToHtml(newTheme);
      if (typeof window !== "undefined") {
        if (persist) {
          localStorage.setItem("theme", newTheme);
        } else {
          localStorage.removeItem("theme");
        }
        window.dispatchEvent(new Event(themeChangeEvent));
      }
    },
    [],
  );

  const toggleTheme = useCallback(() => {
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
