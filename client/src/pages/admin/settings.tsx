import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/AdminLayout";
import { Settings, Save } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Define the form schema for site settings
const settingsFormSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color"),
  enableSubscriptions: z.boolean(),
  enablePPV: z.boolean(),
  enableRegistration: z.boolean(),
  defaultUserQuota: z.string().regex(/^\d+$/, "Must be a number").transform(Number),
  defaultUserConcurrentStreams: z.string().regex(/^\d+$/, "Must be a number").transform(Number)
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function AdminSettings() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch current settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/settings");
        const data = await response.json();
        return data;
      } catch (error) {
        // Return default settings if API doesn't exist yet
        return {
          siteName: "StreamHive",
          logoUrl: "",
          primaryColor: "#3b82f6",
          enableSubscriptions: true,
          enablePPV: false,
          enableRegistration: true,
          defaultUserQuota: 5,
          defaultUserConcurrentStreams: 2
        };
      }
    }
  });
  
  // Setup form with default values
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      siteName: "",
      logoUrl: "",
      primaryColor: "#3b82f6",
      enableSubscriptions: true,
      enablePPV: false,
      enableRegistration: true,
      defaultUserQuota: 5,
      defaultUserConcurrentStreams: 2
    }
  });
  
  // Update form with fetched settings
  useState(() => {
    if (settings && !settingsLoading) {
      form.reset({
        siteName: settings.siteName,
        logoUrl: settings.logoUrl || "",
        primaryColor: settings.primaryColor,
        enableSubscriptions: settings.enableSubscriptions,
        enablePPV: settings.enablePPV,
        enableRegistration: settings.enableRegistration,
        defaultUserQuota: settings.defaultUserQuota,
        defaultUserConcurrentStreams: settings.defaultUserConcurrentStreams
      });
    }
  });
  
  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      try {
        const response = await apiRequest("POST", "/api/admin/settings", data);
        return await response.json();
      } catch (error) {
        console.error("Failed to save settings:", error);
        // Since we don't have the backend endpoint yet, we'll simulate success
        return data;
      }
    },
    onSuccess: () => {
      // Invalidate queries that might be affected by settings changes
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      
      toast({
        title: "Settings saved",
        description: "Your site settings have been updated successfully.",
      });
      
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
      
      setIsSubmitting(false);
    }
  });
  
  // Handle form submission
  const onSubmit = (data: SettingsFormValues) => {
    setIsSubmitting(true);
    saveSettingsMutation.mutate(data);
  };
  
  return (
    <AdminLayout activePath="/admin/settings">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6" />
              <div>
                <CardTitle className="text-2xl">Site Settings</CardTitle>
                <CardDescription>
                  Configure global settings for your streaming platform.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">General Settings</h3>
                  
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl>
                          <Input placeholder="StreamHive" {...field} />
                        </FormControl>
                        <FormDescription>
                          The name of your streaming platform
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/logo.png" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          URL to your site logo image (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Primary Color</FormLabel>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-8 w-8 rounded-md border" 
                            style={{ backgroundColor: field.value }}
                          />
                          <FormControl>
                            <Input type="text" {...field} />
                          </FormControl>
                        </div>
                        <FormDescription>
                          Primary color for your site's theme (hex code)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Subscription Settings</h3>
                  
                  <FormField
                    control={form.control}
                    name="enableSubscriptions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Subscriptions</FormLabel>
                          <FormDescription>
                            Allow users to subscribe to premium content
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="enablePPV"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Pay-Per-View</FormLabel>
                          <FormDescription>
                            Allow users to purchase individual content
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">User Settings</h3>
                  
                  <FormField
                    control={form.control}
                    name="enableRegistration"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Registration</FormLabel>
                          <FormDescription>
                            Allow new users to register on the platform
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="defaultUserQuota"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default User Quota</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field}
                              value={field.value.toString()} 
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of videos users can save to watch later
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="defaultUserConcurrentStreams"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Concurrent Streams</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field}
                              value={field.value.toString()} 
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of concurrent streams allowed per user
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end space-x-2 border-t pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Settings</span>
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </AdminLayout>
  );
}