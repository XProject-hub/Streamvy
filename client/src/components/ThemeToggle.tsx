import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  // Direct theme toggle for better debugging
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    console.log("Toggling theme from", theme, "to", newTheme);
    setTheme(newTheme);
  };

  // Log current theme for debugging
  useEffect(() => {
    console.log("Current theme in ThemeToggle:", theme);
  }, [theme]);

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={toggleTheme}
        className="relative h-8 w-8 rounded-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
      >
        {theme === "light" ? (
          <Sun className="h-4 w-4 text-yellow-500" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-500" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}