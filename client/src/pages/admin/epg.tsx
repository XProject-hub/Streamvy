import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Channel } from "@shared/schema";
import { 
  Plus, Edit, Trash2, Search, AlertTriangle, Calendar,
  Film, Tv, Video, Play, List, BarChart2, Users, Upload, FileText
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

// EPG form schema
const epgFormSchema = z.object({
  name: z.string().min(1, "EPG name is required"),
  url: z.string().url("Must be a valid URL"),
  description: z.string().optional(),
});

// EPG upload schema
const epgUploadSchema = z.object({
  file: z.instanceof(File).refine(file => file.size > 0, "File is required"),
  name: z.string().min(1, "Name is required"),
});

type EPGFormValues = z.infer<typeof epgFormSchema>;
type EPGUploadValues = z.infer<typeof epgUploadSchema>;

// EPG Source interface
interface EPGSource {
  id: number;
  name: string;
  url: string;
  description?: string;
  lastUpdate?: Date;
  channelCount?: number;
}

export default function AdminEPG() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEPG, setSelectedEPG] = useState<EPGSource | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  // Fetch EPG sources
  const { data: epgSources, isLoading: epgLoading } = useQuery<EPGSource[]>({
    queryKey: ["/api/admin/epg/sources"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/epg/sources");
        return response.json();
      } catch (error) {
        console.error("Failed to fetch EPG sources:", error);
        // Return empty array if endpoint doesn't exist yet
        return [];
      }
    }
  });
  
  // Fetch channels for mapping
  const { data: channels } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });
  
  // EPG form setup
  const epgForm = useForm<EPGFormValues>({
    resolver: zodResolver(epgFormSchema),
    defaultValues: {
      name: "",
      url: "",
      description: "",
    }
  });
  
  // Upload form setup
  const uploadForm = useForm<EPGUploadValues>({
    resolver: zodResolver(epgUploadSchema),
    defaultValues: {
      file: undefined,
      name: "",
    }
  });
  
  // Create EPG mutation
  const createEPGMutation = useMutation({
    mutationFn: async (data: EPGFormValues) => {
      const response = await apiRequest("POST", "/api/admin/epg/sources", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/epg/sources"] });
      toast({
        title: "EPG source created",
        description: "The EPG source has been created successfully",
      });
      setIsFormDialogOpen(false);
      epgForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create EPG source",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update EPG mutation
  const updateEPGMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EPGFormValues }) => {
      const response = await apiRequest("PUT", `/api/admin/epg/sources/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/epg/sources"] });
      toast({
        title: "EPG source updated",
        description: "The EPG source has been updated successfully",
      });
      setIsFormDialogOpen(false);
      setSelectedEPG(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update EPG source",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete EPG mutation
  const deleteEPGMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/epg/sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/epg/sources"] });
      toast({
        title: "EPG source deleted",
        description: "The EPG source has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedEPG(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete EPG source",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Upload EPG file mutation
  const uploadEPGMutation = useMutation({
    mutationFn: async (data: EPGUploadValues) => {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("name", data.name);
      
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const increment = Math.random() * 10;
          const newProgress = Math.min(prev + increment, 95);
          return newProgress;
        });
      }, 300);
      
      try {
        const response = await apiRequest("POST", "/api/admin/epg/upload", formData);
        clearInterval(progressInterval);
        setUploadProgress(100);
        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 1000);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/epg/sources"] });
      toast({
        title: "EPG file uploaded",
        description: "The EPG file has been processed successfully",
      });
      setIsUploadDialogOpen(false);
      uploadForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload EPG file",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Refresh EPG data mutation
  const refreshEPGMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/admin/epg/sources/${id}/refresh`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/epg/sources"] });
      toast({
        title: "EPG data refreshed",
        description: "The EPG data has been refreshed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to refresh EPG data",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle EPG form submission
  const onEPGSubmit = (data: EPGFormValues) => {
    if (selectedEPG) {
      updateEPGMutation.mutate({ id: selectedEPG.id, data });
    } else {
      createEPGMutation.mutate(data);
    }
  };
  
  // Handle upload form submission
  const onUploadSubmit = (data: EPGUploadValues) => {
    uploadEPGMutation.mutate(data);
  };
  
  // Open edit dialog with EPG data
  const handleEditEPG = (epg: EPGSource) => {
    setSelectedEPG(epg);
    
    epgForm.reset({
      name: epg.name,
      url: epg.url,
      description: epg.description || "",
    });
    
    setIsFormDialogOpen(true);
  };
  
  // Open create dialog
  const handleAddEPG = () => {
    setSelectedEPG(null);
    epgForm.reset({
      name: "",
      url: "",
      description: "",
    });
    setIsFormDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedEPG) {
      deleteEPGMutation.mutate(selectedEPG.id);
    }
  };
  
  // Handle EPG refresh
  const handleRefreshEPG = (id: number) => {
    refreshEPGMutation.mutate(id);
  };
  
  // Open upload dialog
  const handleUpload = () => {
    uploadForm.reset();
    setIsUploadDialogOpen(true);
  };
  
  // Filter EPG sources by search query
  const filteredEPGSources = epgSources?.filter(epg => 
    epg.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Format date utility function
  const formatDate = (date?: Date) => {
    if (!date) return "Never";
    return format(new Date(date), "MMM d, yyyy h:mm a");
  };

  // Navigation items for admin
  const adminNavItems = [
    { name: "Dashboard", icon: <BarChart2 className="mr-2 h-5 w-5" />, path: "/admin" },
    { name: "Channels", icon: <Tv className="mr-2 h-5 w-5" />, path: "/admin/channels" },
    { name: "Movies", icon: <Film className="mr-2 h-5 w-5" />, path: "/admin/movies" },
    { name: "Series", icon: <Video className="mr-2 h-5 w-5" />, path: "/admin/series" },
    { name: "Episodes", icon: <Play className="mr-2 h-5 w-5" />, path: "/admin/episodes" },
    { name: "Categories", icon: <List className="mr-2 h-5 w-5" />, path: "/admin/categories" },
    { name: "Users", icon: <Users className="mr-2 h-5 w-5" />, path: "/admin/users" },
    { name: "EPG", icon: <Calendar className="mr-2 h-5 w-5" />, path: "/admin/epg" }
  ];
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-1/5 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
          <nav className="space-y-1">
            {adminNavItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  item.path === "/admin/epg" 
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}>
                  {item.icon}
                  {item.name}
                </a>
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="w-full md:w-4/5 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">EPG Management</CardTitle>
                <CardDescription>
                  Manage Electronic Program Guide (EPG) sources and data
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleUpload}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload XML
                </Button>
                <Button onClick={handleAddEPG}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add EPG Source
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and filter */}
              <div className="mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search EPG sources..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* EPG Sources table */}
              {epgLoading ? (
                <div className="text-center py-8">Loading EPG sources...</div>
              ) : filteredEPGSources?.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
                  <p>No EPG sources found. Add your first EPG source to get started.</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Last Update</TableHead>
                        <TableHead>Channels</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEPGSources?.map((epg) => (
                        <TableRow key={epg.id}>
                          <TableCell className="font-medium">{epg.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{epg.url}</TableCell>
                          <TableCell>{formatDate(epg.lastUpdate)}</TableCell>
                          <TableCell>{epg.channelCount || 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRefreshEPG(epg.id)}
                                title="Refresh EPG data"
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditEPG(epg)}
                                title="Edit EPG source"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedEPG(epg);
                                  setIsDeleteDialogOpen(true);
                                }}
                                title="Delete EPG source"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Channel EPG Mapping */}
          <Card>
            <CardHeader>
              <CardTitle>Channel EPG Mapping</CardTitle>
              <CardDescription>
                Map channels to their corresponding EPG IDs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>EPG ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channels?.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {channel.logo && (
                              <img 
                                src={channel.logo} 
                                alt={channel.name}
                                className="h-8 w-auto"
                              />
                            )}
                            <span className="font-medium">{channel.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{channel.epgId || "Not mapped"}</TableCell>
                        <TableCell>
                          {channel.epgId ? (
                            <span className="text-green-600 dark:text-green-400">
                              Mapped
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">
                              Not mapped
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // This would open a dialog to map the channel to an EPG ID
                              toast({
                                title: "Feature coming soon",
                                description: "Channel EPG mapping will be available in a future update",
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* EPG Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedEPG ? 'Edit EPG Source' : 'Add New EPG Source'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              {selectedEPG 
                ? 'Update the EPG source details below' 
                : 'Fill out the form below to add a new EPG source'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...epgForm}>
            <form onSubmit={epgForm.handleSubmit(onEPGSubmit)} className="space-y-6">
              <FormField
                control={epgForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-800 dark:text-gray-200 font-medium">Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter EPG source name" 
                        {...field} 
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={epgForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-800 dark:text-gray-200 font-medium">URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter EPG XML URL" 
                        {...field} 
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-600 dark:text-gray-400">
                      URL to the XMLTV format EPG data
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={epgForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-800 dark:text-gray-200 font-medium">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter description (optional)" 
                        className="resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">
                  {selectedEPG ? 'Update EPG Source' : 'Create EPG Source'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Upload EPG XML File
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              Upload an XMLTV format file to import program guide data
            </DialogDescription>
          </DialogHeader>
          
          <Form {...uploadForm}>
            <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-6">
              <FormField
                control={uploadForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-800 dark:text-gray-200 font-medium">Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter a name for this EPG data" 
                        {...field} 
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={uploadForm.control}
                name="file"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel className="text-gray-800 dark:text-gray-200 font-medium">EPG XML File</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="file"
                        accept=".xml"
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-600 dark:text-gray-400">
                      Select an XMLTV format file to upload
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              
              <DialogFooter className="gap-2 mt-4">
                <DialogClose asChild>
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={isUploading}
                    className="border-gray-300 dark:border-gray-600"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={isUploading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete the EPG source "{selectedEPG?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-red-800 dark:text-red-300 font-medium">Warning</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">
              Deleting this EPG source will remove all associated program data and channel mappings.
            </AlertDescription>
          </Alert>
          
          <DialogFooter className="gap-2 mt-4">
            <DialogClose asChild>
              <Button 
                variant="outline" 
                className="border-gray-300 dark:border-gray-600"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}