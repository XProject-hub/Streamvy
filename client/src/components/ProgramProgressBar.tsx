import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgramProgressBarProps {
  startTime: Date | string;
  endTime: Date | string;
  className?: string;
  showText?: boolean;
  showDuration?: boolean;
}

export function ProgramProgressBar({
  startTime,
  endTime,
  className,
  showText = false,
  showDuration = false
}: ProgramProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("");
  
  useEffect(() => {
    // Parse timestamps if they're strings
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
    
    // Function to calculate and update the progress
    const calculateProgress = () => {
      const now = new Date();
      const total = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      
      // Calculate progress percentage (0-100)
      const currentProgress = Math.max(0, Math.min(100, (elapsed / total) * 100));
      setProgress(currentProgress);
      
      // Calculate remaining time
      const remainingMs = Math.max(0, end.getTime() - now.getTime());
      const remainingMins = Math.floor(remainingMs / 60000);
      const remainingHours = Math.floor(remainingMins / 60);
      const mins = remainingMins % 60;
      
      if (remainingHours > 0) {
        setTimeRemaining(`${remainingHours}h ${mins}m remaining`);
      } else if (mins > 0) {
        setTimeRemaining(`${mins}m remaining`);
      } else {
        setTimeRemaining("Ending soon");
      }
    };
    
    // Calculate immediately and then set up interval
    calculateProgress();
    const intervalId = setInterval(calculateProgress, 30000); // Update every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [startTime, endTime]);
  
  // Format the time duration for display
  const formatDuration = () => {
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
    
    const durationMs = end.getTime() - start.getTime();
    const durationMins = Math.floor(durationMs / 60000);
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };
  
  return (
    <div className={cn("space-y-1", className)}>
      <Progress value={progress} className="h-1.5" />
      
      {(showText || showDuration) && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          {showText && (
            <span>{timeRemaining}</span>
          )}
          {showDuration && (
            <span className="ml-auto">{formatDuration()}</span>
          )}
        </div>
      )}
    </div>
  );
}