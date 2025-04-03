import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggleSimple() {
  const [isDark, setIsDark] = useState(false);

  // Apply theme function
  const applyTheme = (isDarkMode: boolean) => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    console.log("Theme toggled to:", isDarkMode ? "dark" : "light");
  };

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      applyTheme(true);
    } else {
      setIsDark(false);
      applyTheme(false);
    }
  }, []);

  // Toggle theme handler
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(newIsDark);
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme}
      className="h-8 w-8 rounded-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
    >
      {isDark ? (
        <Moon className="h-4 w-4 text-indigo-500" />
      ) : (
        <Sun className="h-4 w-4 text-yellow-500" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}