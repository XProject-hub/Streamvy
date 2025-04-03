import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect } from "react";

export function ThemeToggle() {
  const { mode, appearance, setTheme } = useTheme();
  
  // Direct theme toggle for better debugging
  const toggleTheme = () => {
    // If we're in system mode, first switch to explicit mode matching current appearance
    if (mode === "system") {
      const newTheme = appearance === "light" ? "dark" : "light";
      console.log("Switching from system mode to explicit theme:", newTheme);
      setTheme(newTheme);
    } else {
      // Normal toggle between light and dark
      const newTheme = mode === "light" ? "dark" : "light";
      console.log("Toggling theme from", mode, "to", newTheme);
      setTheme(newTheme);
    }
  };

  // Log current theme for debugging
  useEffect(() => {
    console.log("Current theme in ThemeToggle:", { mode, appearance });
  }, [mode, appearance]);

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={toggleTheme}
        className="relative h-8 w-8 rounded-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
      >
        {mode === 'system' ? (
          <Monitor className="h-4 w-4 text-blue-500" />
        ) : mode === "light" ? (
          <Sun className="h-4 w-4 text-yellow-500" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-500" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}