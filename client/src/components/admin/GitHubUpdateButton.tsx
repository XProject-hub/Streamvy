import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { GitBranchIcon, RefreshCwIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function GitHubUpdateButton() {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      const response = await apiRequest('POST', '/api/admin/update-from-github');
      const data = await response.json();
      
      toast({
        title: "Update Successful",
        description: data.message || "Application updated from GitHub successfully. Reload the page to see changes.",
        variant: "default"
      });
    } catch (error) {
      console.error("GitHub update error:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update from GitHub. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button 
      onClick={handleUpdate} 
      disabled={isUpdating}
      variant="default"
      size="sm"
      className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
    >
      {isUpdating ? (
        <>
          <RefreshCwIcon className="h-4 w-4 animate-spin" />
          <span>Updating...</span>
        </>
      ) : (
        <>
          <GitBranchIcon className="h-4 w-4" />
          <span>Update from GitHub</span>
        </>
      )}
    </Button>
  );
}