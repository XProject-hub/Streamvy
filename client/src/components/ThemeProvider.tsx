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
  
  // Remove existing theme classes
  root.classList.remove("light", "dark");
  
  // Add the new theme class
  root.classList.add(theme);
  
  // Set the data-theme attribute
  root.setAttribute("data-theme", theme);
  
  if (theme === "dark") {
    // Set dark mode HSL values
    document.documentElement.style.setProperty("--background", "240 10% 3.9%");
    document.documentElement.style.setProperty("--foreground", "0 0% 98%");
    document.documentElement.style.setProperty("--card", "240 10% 3.9%");
    document.documentElement.style.setProperty("--card-foreground", "0 0% 98%");
    document.documentElement.style.setProperty("--popover", "240 10% 3.9%");
    document.documentElement.style.setProperty("--popover-foreground", "0 0% 98%");
    document.documentElement.style.setProperty("--primary", "0 0% 98%");
    document.documentElement.style.setProperty("--primary-foreground", "240 5.9% 10%");
    document.documentElement.style.setProperty("--secondary", "240 3.7% 15.9%");
    document.documentElement.style.setProperty("--secondary-foreground", "0 0% 98%");
    document.documentElement.style.setProperty("--muted", "240 3.7% 15.9%");
    document.documentElement.style.setProperty("--muted-foreground", "240 5% 64.9%");
    document.documentElement.style.setProperty("--accent", "240 3.7% 15.9%");
    document.documentElement.style.setProperty("--accent-foreground", "0 0% 98%");
    document.documentElement.style.setProperty("--destructive", "0 62.8% 30.6%");
    document.documentElement.style.setProperty("--destructive-foreground", "0 0% 98%");
    document.documentElement.style.setProperty("--border", "240 3.7% 15.9%");
    document.documentElement.style.setProperty("--input", "240 3.7% 15.9%");
    document.documentElement.style.setProperty("--ring", "240 4.9% 83.9%");
  } else {
    // Set light mode HSL values
    document.documentElement.style.setProperty("--background", "0 0% 100%");
    document.documentElement.style.setProperty("--foreground", "240 10% 3.9%");
    document.documentElement.style.setProperty("--card", "0 0% 100%");
    document.documentElement.style.setProperty("--card-foreground", "240 10% 3.9%");
    document.documentElement.style.setProperty("--popover", "0 0% 100%");
    document.documentElement.style.setProperty("--popover-foreground", "240 10% 3.9%");
    document.documentElement.style.setProperty("--primary", "240 5.9% 10%");
    document.documentElement.style.setProperty("--primary-foreground", "0 0% 98%");
    document.documentElement.style.setProperty("--secondary", "240 4.8% 95.9%");
    document.documentElement.style.setProperty("--secondary-foreground", "240 5.9% 10%");
    document.documentElement.style.setProperty("--muted", "240 4.8% 95.9%");
    document.documentElement.style.setProperty("--muted-foreground", "240 3.8% 46.1%");
    document.documentElement.style.setProperty("--accent", "240 4.8% 95.9%");
    document.documentElement.style.setProperty("--accent-foreground", "240 5.9% 10%");
    document.documentElement.style.setProperty("--destructive", "0 84.2% 60.2%");
    document.documentElement.style.setProperty("--destructive-foreground", "0 0% 98%");
    document.documentElement.style.setProperty("--border", "240 5.9% 90%");
    document.documentElement.style.setProperty("--input", "240 5.9% 90%");
    document.documentElement.style.setProperty("--ring", "240 5.9% 10%");
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
