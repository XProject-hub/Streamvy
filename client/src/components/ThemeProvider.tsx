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

// Component definition
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "light"
  );

  // Function to apply theme to document root
  function applyTheme(theme: Theme) {
    // Add the class to the document element
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    
    // Log theme change
    console.log("Theme changed to:", theme);
  }

  // Function to change theme
  const setTheme = (newTheme: Theme) => {
    console.log("Setting theme to:", newTheme);
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    
    if (savedTheme && (savedTheme === "dark" || savedTheme === "light")) {
      console.log("Applying saved theme:", savedTheme);
      applyTheme(savedTheme);
      setThemeState(savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = prefersDark ? "dark" : "light";
      console.log("No saved theme, using system preference:", initialTheme);
      applyTheme(initialTheme);
      setThemeState(initialTheme);
      localStorage.setItem("theme", initialTheme);
    }
  }, []);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
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
