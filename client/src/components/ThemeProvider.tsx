import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Define extended theme types to include system preference
type ThemeMode = "dark" | "light" | "system";
type ThemeAppearance = "dark" | "light";

interface ThemeProviderProps {
  children: ReactNode;
}

type ThemeProviderState = {
  mode: ThemeMode;
  appearance: ThemeAppearance;
  setTheme: (mode: ThemeMode) => void;
};

const initialState: ThemeProviderState = {
  mode: "system",
  appearance: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// Component definition
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [appearance, setAppearance] = useState<ThemeAppearance>("light");

  // Function to determine if we should use dark mode
  const getSystemPreference = (): ThemeAppearance => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches 
      ? "dark" 
      : "light";
  };

  // Function to apply theme appearance to document root
  const applyAppearance = (appearance: ThemeAppearance) => {
    // Log before change
    console.log("Applying appearance:", appearance, "- Current classes:", document.documentElement.classList.toString());
    
    // Add the class to the document element
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(appearance);
    
    // Update state
    setAppearance(appearance);
    
    // Log after change
    console.log("Theme appearance applied:", appearance, "- New classes:", document.documentElement.classList.toString());
  };

  // Function to change theme mode
  const setTheme = (newMode: ThemeMode) => {
    console.log("Setting theme mode to:", newMode);
    localStorage.setItem("themeMode", newMode);
    setMode(newMode);
    
    // Apply appropriate appearance based on mode
    if (newMode === "system") {
      applyAppearance(getSystemPreference());
    } else {
      applyAppearance(newMode);
    }
  };

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      if (mode === "system") {
        applyAppearance(getSystemPreference());
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  // Initialize theme on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("themeMode") as ThemeMode | null;
    
    if (savedMode) {
      setMode(savedMode);
      
      if (savedMode === "system") {
        applyAppearance(getSystemPreference());
      } else {
        applyAppearance(savedMode as ThemeAppearance);
      }
    } else {
      // Default to system
      setMode("system");
      applyAppearance(getSystemPreference());
      localStorage.setItem("themeMode", "system");
    }
  }, []);

  return (
    <ThemeProviderContext.Provider value={{ mode, appearance, setTheme }}>
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
