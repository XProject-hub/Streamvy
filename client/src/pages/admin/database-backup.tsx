import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Database, Server, HardDrive, RefreshCw } from "lucide-react";
import { Redirect } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { AdminLayout } from "@/components/AdminLayout";

export default function DatabaseBackupPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [backupLastGenerated, setBackupLastGenerated] = useState<string | null>(null);

  // Generate backup mutation
  const generateBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/generate-backup");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup Generated Successfully",
        description: "The database backup has been created and is ready for download.",
      });
      // Set the last generated timestamp
      setBackupLastGenerated(new Date().toLocaleString());
    },
    onError: (error: any) => {
      toast({
        title: "Backup Generation Failed",
        description: error.message || "There was an error generating the database backup.",
        variant: "destructive",
      });
    },
  });

  // Show loader while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not logged in or not an admin, redirect to auth page
  if (!user || !user.isAdmin) {
    return <Redirect to="/auth" />;
  }

  const handleGenerateBackup = () => {
    generateBackupMutation.mutate();
  };

  const handleDownloadBackup = () => {
    toast({
      title: "Starting database backup download",
      description: "Your browser will prompt to save the file.",
    });
    
    // Create a link and click it to trigger download
    const link = document.createElement('a');
    link.href = '/api/admin/download-backup';
    link.download = 'streamvy_backup.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout activePath="/admin/database-backup">
      <h1 className="text-2xl font-bold mb-6">Database Management</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Database Backup
            </CardTitle>
            <CardDescription>
              Generate and download SQL dumps of the Streamvy database for backup or migration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Backups contain all tables, data, and schema information for the Streamvy database.
                They're essential for disaster recovery and server migrations.
              </p>
              
              <Alert variant="default" className="mb-4">
                <RefreshCw className="h-4 w-4" />
                <AlertTitle>Backup Best Practices</AlertTitle>
                <AlertDescription>
                  <p className="text-sm mb-1">For production environments, consider setting up automated backups with:</p>
                  <ul className="list-disc pl-5 text-xs space-y-1">
                    <li>Daily backups using a cron job with <code className="bg-muted px-1 rounded">pg_dump</code></li>
                    <li>Offsite storage (S3, Google Cloud Storage, etc.)</li>
                    <li>Retention policies to manage backup storage</li>
                  </ul>
                  <p className="text-xs mt-2">Example cron: <code className="bg-muted px-1 rounded text-xs">0 2 * * * /path/to/backup-script.sh</code> (runs daily at 2 AM)</p>
                </AlertDescription>
              </Alert>
              
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex flex-col space-y-2">
                    <h3 className="font-medium flex items-center">
                      <HardDrive className="mr-2 h-4 w-4" />
                      Step 1: Generate Backup
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      First, create a fresh backup of your current database state.
                    </p>
                    
                    <Button 
                      onClick={handleGenerateBackup}
                      disabled={generateBackupMutation.isPending}
                      className="w-full sm:w-auto"
                      variant="secondary"
                    >
                      {generateBackupMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                          Generating Backup...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" /> 
                          Generate Fresh Backup
                        </>
                      )}
                    </Button>
                    
                    {backupLastGenerated && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        Last generated: {backupLastGenerated}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Separator />
              
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex flex-col space-y-2">
                    <h3 className="font-medium flex items-center">
                      <Download className="mr-2 h-4 w-4" />
                      Step 2: Download Backup
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Download the backup file to your local computer.
                    </p>
                    
                    <Button 
                      onClick={handleDownloadBackup}
                      className="w-full sm:w-auto"
                      variant="default"
                    >
                      <Download className="mr-2 h-4 w-4" /> 
                      Download Backup File
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Alert>
                <Server className="h-4 w-4" />
                <AlertTitle>Server Migration</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>Use this SQL file when migrating to a new server with one of these PostgreSQL commands:</p>
                  <div className="text-sm space-y-1 mt-2">
                    <p className="font-medium">Recommended (bypasses peer authentication):</p>
                    <code className="bg-muted px-1 rounded block py-1 text-xs">psql -h localhost -U username -d database_name {'<'} streamvy_backup.sql</code>
                  </div>
                  <div className="text-sm space-y-1 mt-2">
                    <p className="font-medium">With password prompt:</p>
                    <code className="bg-muted px-1 rounded block py-1 text-xs">psql -h localhost -p 5432 -U username -W -d database_name {'<'} streamvy_backup.sql</code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: If you encounter "Peer authentication failed" errors, using <code className="bg-muted px-1 rounded">-h localhost</code> usually resolves the issue by forcing password authentication.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}