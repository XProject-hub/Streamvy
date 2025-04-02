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
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Channel, Category, Country, StreamSource, insertChannelSchema } from "@shared/schema";
import { Plus, Edit, Trash2, Search, AlertTriangle } from "lucide-react";

// Extend the channel schema for the form
const channelFormSchema = z.object({
  name: z.string().min(1, "Channel name is required"),
  logo: z.string().url("Logo must be a valid URL"),
  categoryId: z.string().refine(val => !isNaN(parseInt(val)), "Category is required"),
  countryId: z.string().refine(val => !isNaN(parseInt(val)), "Country is required"),
  epgId: z.string().optional(),
  streamSources: z.array(z.object({
    url: z.string().url("Stream URL must be a valid URL"),
    priority: z.number().int().min(1),
    format: z.string().min(1, "Format is required"),
    label: z.string().optional()
  })).min(1, "At least one stream source is required")
});

type ChannelFormValues = z.infer<typeof channelFormSchema>;

export default function AdminChannels() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch channels, categories, and countries
  const { data: channels, isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  const { data: countries } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });
  
  // Setup form
  const form = useForm<ChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: {
      name: "",
      logo: "",
      categoryId: "",
      countryId: "",
      epgId: "",
      streamSources: [
        { url: "", priority: 1, format: "hls", label: "Main" }
      ]
    }
  });
  
  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/channels", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: "Channel created",
        description: "The channel has been created successfully",
      });
      setIsFormDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create channel",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update channel mutation
  const updateChannelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/channels/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: "Channel updated",
        description: "The channel has been updated successfully",
      });
      setIsFormDialogOpen(false);
      setSelectedChannel(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update channel",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete channel mutation
  const deleteChannelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/channels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: "Channel deleted",
        description: "The channel has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedChannel(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete channel",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: ChannelFormValues) => {
    // Convert string IDs to numbers
    const formattedData = {
      ...data,
      categoryId: parseInt(data.categoryId),
      countryId: parseInt(data.countryId),
    };
    
    if (selectedChannel) {
      updateChannelMutation.mutate({ id: selectedChannel.id, data: formattedData });
    } else {
      createChannelMutation.mutate(formattedData);
    }
  };
  
  // Open edit dialog with channel data
  const handleEditChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    
    // Format the data for the form
    form.reset({
      name: channel.name,
      logo: channel.logo || "",
      categoryId: channel.categoryId ? channel.categoryId.toString() : "",
      countryId: channel.countryId ? channel.countryId.toString() : "",
      epgId: channel.epgId || "",
      streamSources: channel.streamSources as StreamSource[]
    });
    
    setIsFormDialogOpen(true);
  };
  
  // Open create dialog
  const handleAddChannel = () => {
    setSelectedChannel(null);
    form.reset({
      name: "",
      logo: "",
      categoryId: "",
      countryId: "",
      epgId: "",
      streamSources: [
        { url: "", priority: 1, format: "hls", label: "Main" }
      ]
    });
    setIsFormDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedChannel) {
      deleteChannelMutation.mutate(selectedChannel.id);
    }
  };
  
  // Add stream source field
  const addStreamSource = () => {
    const currentSources = form.getValues().streamSources;
    form.setValue("streamSources", [
      ...currentSources,
      { 
        url: "", 
        priority: currentSources.length + 1, 
        format: "hls", 
        label: `Backup ${currentSources.length}` 
      }
    ]);
  };
  
  // Remove stream source field
  const removeStreamSource = (index: number) => {
    const currentSources = form.getValues().streamSources;
    if (currentSources.length > 1) {
      const updatedSources = currentSources.filter((_, i) => i !== index);
      // Update priorities
      updatedSources.forEach((source, i) => {
        source.priority = i + 1;
      });
      form.setValue("streamSources", updatedSources);
    }
  };
  
  // Filter channels by search query
  const filteredChannels = channels?.filter(channel => 
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get category and country names by ID
  const getCategoryName = (id?: number) => {
    if (!id) return "N/A";
    return categories?.find(cat => cat.id === id)?.name || "Unknown";
  };
  
  const getCountryName = (id?: number) => {
    if (!id) return "N/A";
    return countries?.find(country => country.id === id)?.name || "Unknown";
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Channels Management</CardTitle>
            <CardDescription>
              Manage all live TV channels in the system
            </CardDescription>
          </div>
          <Button onClick={handleAddChannel}>
            <Plus className="mr-2 h-4 w-4" />
            Add Channel
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search and filter */}
          <div className="mb-4 flex gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search channels..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Channels table */}
          {channelsLoading ? (
            <div className="text-center py-8">Loading channels...</div>
          ) : filteredChannels?.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
              <p>No channels found. Add your first channel to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>EPG ID</TableHead>
                    <TableHead>Sources</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChannels?.map((channel) => (
                    <TableRow key={channel.id}>
                      <TableCell>
                        {channel.logo ? (
                          <img 
                            src={channel.logo} 
                            alt={channel.name} 
                            className="h-8 w-auto object-contain"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-xs">No logo</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{channel.name}</TableCell>
                      <TableCell>{getCategoryName(channel.categoryId)}</TableCell>
                      <TableCell>{getCountryName(channel.countryId)}</TableCell>
                      <TableCell>{channel.epgId || "N/A"}</TableCell>
                      <TableCell>{channel.streamSources?.length || 0} sources</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditChannel(channel)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedChannel(channel);
                              setIsDeleteDialogOpen(true);
                            }}
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
      
      {/* Channel Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedChannel ? 'Edit Channel' : 'Add New Channel'}
            </DialogTitle>
            <DialogDescription>
              {selectedChannel 
                ? 'Update the channel details below' 
                : 'Fill out the form below to add a new channel'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter channel name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter logo URL" {...field} />
                      </FormControl>
                      <FormDescription>
                        Direct URL to the channel logo image
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="countryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries?.map((country) => (
                            <SelectItem 
                              key={country.id} 
                              value={country.id.toString()}
                            >
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="epgId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EPG ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter EPG ID" {...field} />
                    </FormControl>
                    <FormDescription>
                      ID used to match program guide data
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Stream Sources</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addStreamSource}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Source
                  </Button>
                </div>
                
                {form.watch("streamSources").map((_, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 mb-4 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`streamSources.${index}.url`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stream URL</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter stream URL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`streamSources.${index}.format`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Format</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hls">HLS (m3u8)</SelectItem>
                              <SelectItem value="mp4">MP4</SelectItem>
                              <SelectItem value="dash">DASH</SelectItem>
                              <SelectItem value="ts">TS</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`streamSources.${index}.priority`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`streamSources.${index}.label`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label</FormLabel>
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Input placeholder="Main/Backup" {...field} />
                            </FormControl>
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeStreamSource(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFormDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createChannelMutation.isPending || updateChannelMutation.isPending}
                >
                  {createChannelMutation.isPending || updateChannelMutation.isPending 
                    ? "Saving..." 
                    : selectedChannel ? "Update Channel" : "Add Channel"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the channel "{selectedChannel?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Deleting this channel will remove all associated data, including program information.
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteChannelMutation.isPending}
            >
              {deleteChannelMutation.isPending ? "Deleting..." : "Delete Channel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
