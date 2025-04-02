import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Series, Episode, StreamSource, insertEpisodeSchema } from "@shared/schema";
import { 
  Plus, Edit, Trash2, Search, AlertTriangle, Film,
  Play, Tv, Video, ChevronLeft, ChevronRight, List, Users,
  BarChart2
} from "lucide-react";
import { Link, useLocation } from "wouter";

// Extend the episode schema for the form
const episodeFormSchema = z.object({
  title: z.string().min(1, "Episode title is required"),
  description: z.string().optional(),
  seriesId: z.string().refine(val => !isNaN(parseInt(val)), "Series is required"),
  season: z.string().refine(val => !isNaN(parseInt(val)), "Season number is required"),
  episode: z.string().refine(val => !isNaN(parseInt(val)), "Episode number is required"),
  duration: z.string().optional().refine(
    val => !val || !isNaN(parseInt(val)), 
    "Duration must be a number"
  ),
  streamSources: z.array(z.object({
    url: z.string().url("Stream URL must be a valid URL"),
    priority: z.number().int().min(1),
    format: z.string().min(1, "Format is required"),
    label: z.string().optional()
  })).min(1, "At least one stream source is required")
});

type EpisodeFormValues = z.infer<typeof episodeFormSchema>;

export default function AdminEpisodes() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch series and episodes
  const { data: allSeries } = useQuery<Series[]>({
    queryKey: ["/api/series"],
  });
  
  const { data: episodes, isLoading: episodesLoading } = useQuery<Episode[]>({
    queryKey: ["/api/episodes", selectedSeries],
    queryFn: async () => {
      if (!selectedSeries) return [];
      const response = await apiRequest("GET", `/api/episodes/${selectedSeries}`);
      return response.json();
    },
    enabled: !!selectedSeries
  });
  
  // Setup form
  const form = useForm<EpisodeFormValues>({
    resolver: zodResolver(episodeFormSchema),
    defaultValues: {
      title: "",
      description: "",
      seriesId: selectedSeries?.toString() || "",
      season: "1",
      episode: "1",
      duration: "",
      streamSources: [
        { url: "", priority: 1, format: "mp4", label: "Main" }
      ]
    }
  });
  
  // Update form default values when selected series changes
  useEffect(() => {
    if (selectedSeries) {
      form.setValue("seriesId", selectedSeries.toString());
    }
  }, [selectedSeries, form]);
  
  // Create episode mutation
  const createEpisodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/episodes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes", selectedSeries] });
      toast({
        title: "Episode created",
        description: "The episode has been created successfully",
      });
      setIsFormDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create episode",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update episode mutation
  const updateEpisodeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/episodes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes", selectedSeries] });
      toast({
        title: "Episode updated",
        description: "The episode has been updated successfully",
      });
      setIsFormDialogOpen(false);
      setSelectedEpisode(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update episode",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete episode mutation
  const deleteEpisodeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/episodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes", selectedSeries] });
      toast({
        title: "Episode deleted",
        description: "The episode has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedEpisode(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete episode",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: EpisodeFormValues) => {
    // Convert string values to numbers
    const formattedData = {
      ...data,
      seriesId: parseInt(data.seriesId),
      season: parseInt(data.season),
      episode: parseInt(data.episode),
      duration: data.duration ? parseInt(data.duration) : null,
    };
    
    if (selectedEpisode) {
      updateEpisodeMutation.mutate({ id: selectedEpisode.id, data: formattedData });
    } else {
      createEpisodeMutation.mutate(formattedData);
    }
  };
  
  // Open edit dialog with episode data
  const handleEditEpisode = (episode: Episode) => {
    setSelectedEpisode(episode);
    
    // Format the data for the form
    form.reset({
      title: episode.title,
      description: episode.description || "",
      seriesId: episode.seriesId.toString(),
      season: episode.season.toString(),
      episode: episode.episode.toString(),
      duration: episode.duration?.toString() || "",
      streamSources: episode.streamSources as StreamSource[]
    });
    
    setIsFormDialogOpen(true);
  };
  
  // Open create dialog
  const handleAddEpisode = () => {
    if (!selectedSeries) {
      toast({
        title: "Series required",
        description: "Please select a series first before adding an episode",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedEpisode(null);
    form.reset({
      title: "",
      description: "",
      seriesId: selectedSeries.toString(),
      season: "1",
      episode: getNextEpisodeNumber().toString(),
      duration: "",
      streamSources: [
        { url: "", priority: 1, format: "mp4", label: "Main" }
      ]
    });
    setIsFormDialogOpen(true);
  };
  
  // Calculate next episode number
  const getNextEpisodeNumber = (): number => {
    if (!episodes?.length) return 1;
    
    // Find the highest episode number for the current season
    const currentSeason = form.getValues().season;
    const seasonEpisodes = episodes.filter(
      ep => ep.season.toString() === currentSeason
    );
    
    if (!seasonEpisodes.length) return 1;
    return Math.max(...seasonEpisodes.map(ep => ep.episode)) + 1;
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedEpisode) {
      deleteEpisodeMutation.mutate(selectedEpisode.id);
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
        format: "mp4", 
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
  
  // Filter episodes by search query
  const filteredEpisodes = episodes?.filter(episode => 
    episode.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort episodes by season and episode number
  const sortedEpisodes = filteredEpisodes?.sort((a, b) => {
    if (a.season !== b.season) return a.season - b.season;
    return a.episode - b.episode;
  });
  
  // Get series title by ID
  const getSeriesTitle = (id: number) => {
    return allSeries?.find(series => series.id === id)?.title || "Unknown Series";
  };
  
  // Format duration as HH:MM:SS
  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "N/A";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
    { name: "EPG", icon: <Tv className="mr-2 h-5 w-5" />, path: "/admin/epg" }
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
                  item.path === "/admin/episodes" 
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
                <CardTitle className="text-2xl">Episodes Management</CardTitle>
                <CardDescription>
                  Manage episodes for TV series
                </CardDescription>
              </div>
              <Button onClick={handleAddEpisode} disabled={!selectedSeries}>
                <Plus className="mr-2 h-4 w-4" />
                Add Episode
              </Button>
            </CardHeader>
            <CardContent>
              {/* Series selector and search */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/2">
                  <FormLabel>Select Series</FormLabel>
                  <Select 
                    value={selectedSeries?.toString() || ""}
                    onValueChange={(value) => setSelectedSeries(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a series" />
                    </SelectTrigger>
                    <SelectContent>
                      {allSeries?.map((series) => (
                        <SelectItem 
                          key={series.id} 
                          value={series.id.toString()}
                        >
                          {series.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full sm:w-1/2">
                  <FormLabel>Search Episodes</FormLabel>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search episodes..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Episodes table */}
              {!selectedSeries ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
                  <p>Please select a series first to view and manage its episodes.</p>
                </div>
              ) : episodesLoading ? (
                <div className="text-center py-8">Loading episodes...</div>
              ) : sortedEpisodes?.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
                  <p>No episodes found for this series. Add your first episode to get started.</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">S/E</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Sources</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedEpisodes?.map((episode) => (
                        <TableRow key={episode.id}>
                          <TableCell className="font-mono">
                            S{episode.season.toString().padStart(2, '0')}E{episode.episode.toString().padStart(2, '0')}
                          </TableCell>
                          <TableCell className="font-medium">{episode.title}</TableCell>
                          <TableCell>{formatDuration(episode.duration)}</TableCell>
                          <TableCell>{episode.streamSources?.length || 0} sources</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditEpisode(episode)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedEpisode(episode);
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
        </div>
      </div>
      
      {/* Episode Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEpisode ? 'Edit Episode' : 'Add New Episode'}
            </DialogTitle>
            <DialogDescription>
              {selectedEpisode 
                ? 'Update the episode details below' 
                : 'Fill out the form below to add a new episode'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Episode Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter episode title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter episode description" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="season"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Season</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="Season number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="episode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Episode</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="Episode number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="Duration in seconds" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave empty if unknown
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormLabel className="block mb-2">Stream Sources</FormLabel>
                <div className="space-y-4">
                  {form.watch("streamSources").map((_, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md">
                      <FormField
                        control={form.control}
                        name={`streamSources.${index}.url`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input placeholder="Stream URL" {...field} />
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
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mp4">MP4</SelectItem>
                                <SelectItem value="hls">HLS</SelectItem>
                                <SelectItem value="dash">DASH</SelectItem>
                                <SelectItem value="webm">WebM</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-end space-x-2">
                        <FormField
                          control={form.control}
                          name={`streamSources.${index}.label`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Label</FormLabel>
                              <FormControl>
                                <Input placeholder="Source label" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="mb-1"
                          onClick={() => removeStreamSource(index)}
                          disabled={form.watch("streamSources").length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addStreamSource}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Stream Source
                  </Button>
                </div>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">
                  {selectedEpisode ? 'Update Episode' : 'Create Episode'}
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
              Are you sure you want to delete "{selectedEpisode?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}