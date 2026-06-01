import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

type ThemeMode = "dark" | "light" | "system";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPreference(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    return stored ?? "dark";
  });

  const isDark =
    theme === "dark" || (theme === "system" && getSystemPreference());

  const applyTheme = useCallback((dark: boolean) => {
    const root = document.documentElement;
    if (dark) {
      root.classList.remove("light");
    } else {
      root.classList.add("light");
    }
  }, []);

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark, applyTheme]);

  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, applyTheme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, isDark }),
    [theme, setTheme, isDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
