import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type ThemeMode = 'light' | 'dark' | 'system';

export function ThemeToggleSimple() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isDark, setIsDark] = useState(false);

  // Apply theme function
  const applyTheme = (mode: ThemeMode) => {
    // Remove existing classes
    document.documentElement.classList.remove('light', 'dark');
    
    // Determine if we should use dark mode
    let shouldUseDark = false;
    
    if (mode === 'dark') {
      shouldUseDark = true;
    } else if (mode === 'system') {
      shouldUseDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // Apply the appropriate class
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.add('light');
      setIsDark(false);
    }
    
    // Save the mode preference
    localStorage.setItem('themeMode', mode);
    console.log("Theme set to:", mode, "- dark mode:", shouldUseDark);
  };

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (themeMode === 'system') {
        applyTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Initialize theme on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
    const mode = savedMode || 'system';
    setThemeMode(mode);
    applyTheme(mode);
  }, []);

  // Update theme when mode changes
  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  // Toggle between light and dark directly
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
    applyTheme(newMode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 transition-colors duration-300"
        >
          {themeMode === 'system' ? (
            <Monitor className="h-4 w-4 text-blue-500" />
          ) : isDark ? (
            <Moon className="h-4 w-4 text-indigo-500" />
          ) : (
            <Sun className="h-4 w-4 text-yellow-500" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setThemeMode('light')} className="cursor-pointer">
          <Sun className="mr-2 h-4 w-4 text-yellow-500" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThemeMode('dark')} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4 text-indigo-500" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThemeMode('system')} className="cursor-pointer">
          <Monitor className="mr-2 h-4 w-4 text-blue-500" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}