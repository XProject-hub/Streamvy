import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeProviderProps {
  children: ReactNode;
}

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// Function to apply theme changes to DOM
const applyTheme = (theme: Theme) => {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.setAttribute("data-theme", theme);
  
  // Apply custom properties that ensure shadcn components display correctly
  if (theme === "dark") {
    document.documentElement.style.setProperty("--background", "#1f2937");
    document.documentElement.style.setProperty("--foreground", "#f9fafb");
    document.documentElement.style.setProperty("--card", "#374151");
    document.documentElement.style.setProperty("--card-foreground", "#f9fafb");
    document.documentElement.style.setProperty("--muted", "#6b7280");
    document.documentElement.style.setProperty("--muted-foreground", "#d1d5db");
  } else {
    document.documentElement.style.setProperty("--background", "#ffffff");
    document.documentElement.style.setProperty("--foreground", "#000000");
    document.documentElement.style.setProperty("--card", "#ffffff");
    document.documentElement.style.setProperty("--card-foreground", "#000000");
    document.documentElement.style.setProperty("--muted", "#f3f4f6");
    document.documentElement.style.setProperty("--muted-foreground", "#6b7280");
  }
  
  console.log("Theme applied:", theme);
};

// Component definition
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "light"
  );

  // Function to change theme
  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    
    if (savedTheme) {
      applyTheme(savedTheme);
      setThemeState(savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = prefersDark ? "dark" : "light";
      applyTheme(initialTheme);
      setThemeState(initialTheme);
      localStorage.setItem("theme", initialTheme);
    }
  }, []);

  // Create context value
  const contextValue = {
    theme,
    setTheme
  };

  return (
    <ThemeProviderContext.Provider value={contextValue}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
