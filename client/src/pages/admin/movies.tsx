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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Movie, Category, StreamSource, insertMovieSchema } from "@shared/schema";
import { Plus, Edit, Trash2, Search, AlertTriangle } from "lucide-react";

// Extend the movie schema for the form
const movieFormSchema = z.object({
  title: z.string().min(1, "Movie title is required"),
  poster: z.string().url("Poster must be a valid URL").or(z.literal("")),
  year: z.string().refine(val => !val || !isNaN(parseInt(val)), "Year must be a number").optional(),
  rating: z.string().optional(),
  duration: z.string().refine(val => !val || !isNaN(parseInt(val)), "Duration must be a number").optional(),
  categoryId: z.string().refine(val => !isNaN(parseInt(val)), "Category is required"),
  streamSources: z.array(z.object({
    url: z.string().url("Stream URL must be a valid URL"),
    priority: z.number().int().min(1),
    format: z.string().min(1, "Format is required"),
    label: z.string().optional()
  })).min(1, "At least one stream source is required"),
  isPremium: z.boolean().default(false)
});

type MovieFormValues = z.infer<typeof movieFormSchema>;

export default function AdminMovies() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch movies and categories
  const { data: movies, isLoading: moviesLoading } = useQuery<Movie[]>({
    queryKey: ["/api/movies"],
  });
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Setup form
  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieFormSchema),
    defaultValues: {
      title: "",
      poster: "",
      year: "",
      rating: "",
      duration: "",
      categoryId: "",
      streamSources: [
        { url: "", priority: 1, format: "hls", label: "HD" }
      ],
      isPremium: false
    }
  });
  
  // Create movie mutation
  const createMovieMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/movies", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movies"] });
      toast({
        title: "Movie created",
        description: "The movie has been created successfully",
      });
      setIsFormDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create movie",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update movie mutation
  const updateMovieMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/movies/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movies"] });
      toast({
        title: "Movie updated",
        description: "The movie has been updated successfully",
      });
      setIsFormDialogOpen(false);
      setSelectedMovie(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update movie",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete movie mutation
  const deleteMovieMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/movies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movies"] });
      toast({
        title: "Movie deleted",
        description: "The movie has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedMovie(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete movie",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: MovieFormValues) => {
    // Convert string values to numbers
    const formattedData = {
      ...data,
      year: data.year ? parseInt(data.year) : undefined,
      duration: data.duration ? parseInt(data.duration) : undefined,
      categoryId: parseInt(data.categoryId),
    };
    
    if (selectedMovie) {
      updateMovieMutation.mutate({ id: selectedMovie.id, data: formattedData });
    } else {
      createMovieMutation.mutate(formattedData);
    }
  };
  
  // Open edit dialog with movie data
  const handleEditMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    
    // Format the data for the form
    form.reset({
      title: movie.title,
      poster: movie.poster || "",
      year: movie.year?.toString() || "",
      rating: movie.rating || "",
      duration: movie.duration?.toString() || "",
      categoryId: movie.categoryId ? movie.categoryId.toString() : "",
      streamSources: movie.streamSources as StreamSource[],
      isPremium: movie.isPremium || false
    });
    
    setIsFormDialogOpen(true);
  };
  
  // Open create dialog
  const handleAddMovie = () => {
    setSelectedMovie(null);
    form.reset({
      title: "",
      poster: "",
      year: "",
      rating: "",
      duration: "",
      categoryId: "",
      streamSources: [
        { url: "", priority: 1, format: "hls", label: "HD" }
      ],
      isPremium: false
    });
    setIsFormDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedMovie) {
      deleteMovieMutation.mutate(selectedMovie.id);
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
        label: `SD` 
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
  
  // Filter movies by search query
  const filteredMovies = movies?.filter(movie => 
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get category name by ID
  const getCategoryName = (id?: number) => {
    if (!id) return "N/A";
    return categories?.find(cat => cat.id === id)?.name || "Unknown";
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Movies Management</CardTitle>
            <CardDescription>
              Manage all movies in the system
            </CardDescription>
          </div>
          <Button onClick={handleAddMovie}>
            <Plus className="mr-2 h-4 w-4" />
            Add Movie
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search and filter */}
          <div className="mb-4 flex gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search movies..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Movies table */}
          {moviesLoading ? (
            <div className="text-center py-8">Loading movies...</div>
          ) : filteredMovies?.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
              <p>No movies found. Add your first movie to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poster</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovies?.map((movie) => (
                    <TableRow key={movie.id}>
                      <TableCell>
                        {movie.poster ? (
                          <img 
                            src={movie.poster} 
                            alt={movie.title} 
                            className="h-16 w-auto object-contain"
                          />
                        ) : (
                          <div className="h-16 w-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-xs">No poster</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{movie.title}</TableCell>
                      <TableCell>{movie.year || "N/A"}</TableCell>
                      <TableCell>{movie.rating || "N/A"}</TableCell>
                      <TableCell>{movie.duration ? `${movie.duration} min` : "N/A"}</TableCell>
                      <TableCell>{getCategoryName(movie.categoryId)}</TableCell>
                      <TableCell>
                        {movie.isPremium ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Premium
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Free
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMovie(movie)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedMovie(movie);
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
      
      {/* Movie Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMovie ? 'Edit Movie' : 'Add New Movie'}
            </DialogTitle>
            <DialogDescription>
              {selectedMovie 
                ? 'Update the movie details below' 
                : 'Fill out the form below to add a new movie'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Movie Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter movie title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input placeholder="Year of release" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 8.5" {...field} />
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
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 120" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="poster"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poster URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter poster URL" {...field} />
                      </FormControl>
                      <FormDescription>
                        Direct URL to the movie poster image
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
              </div>
              
              <FormField
                control={form.control}
                name="isPremium"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Premium Content</FormLabel>
                      <FormDescription>
                        Mark this movie as premium content (subscribers only)
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
                              <SelectItem value="webm">WebM</SelectItem>
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
                              <Input placeholder="HD/SD" {...field} />
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
                  disabled={createMovieMutation.isPending || updateMovieMutation.isPending}
                >
                  {createMovieMutation.isPending || updateMovieMutation.isPending 
                    ? "Saving..." 
                    : selectedMovie ? "Update Movie" : "Add Movie"}
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
              Are you sure you want to delete the movie "{selectedMovie?.title}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Deleting this movie will remove all associated stream sources.
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
              disabled={deleteMovieMutation.isPending}
            >
              {deleteMovieMutation.isPending ? "Deleting..." : "Delete Movie"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
