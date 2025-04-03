import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "./ThemeProvider";

export function ThemeToggleSimple() {
  const { mode, appearance, setTheme } = useTheme();
  
  // Quick toggle function (cycles between light/dark directly)
  const quickToggle = () => {
    const newMode = appearance === 'dark' ? 'light' : 'dark';
    setTheme(newMode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={(e) => e.stopPropagation()}
          className="h-8 w-8 rounded-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 transition-colors duration-300"
        >
          {mode === 'system' ? (
            <Monitor className="h-4 w-4 text-blue-500" />
          ) : appearance === 'dark' ? (
            <Moon className="h-4 w-4 text-indigo-500" />
          ) : (
            <Sun className="h-4 w-4 text-yellow-500" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
          <Sun className="mr-2 h-4 w-4 text-yellow-500" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4 text-indigo-500" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
          <Monitor className="mr-2 h-4 w-4 text-blue-500" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}