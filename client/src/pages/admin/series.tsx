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
import { Series, Category, insertSeriesSchema } from "@shared/schema";
import { Plus, Edit, Trash2, Search, AlertTriangle, FileText } from "lucide-react";
import { Link } from "wouter";

// Extend the series schema for the form
const seriesFormSchema = z.object({
  title: z.string().min(1, "Series title is required"),
  poster: z.string().url("Poster must be a valid URL").or(z.literal("")),
  startYear: z.string().refine(val => !val || !isNaN(parseInt(val)), "Start year must be a number").optional(),
  endYear: z.string().refine(val => !val || !isNaN(parseInt(val)), "End year must be a number").optional(),
  rating: z.string().optional(),
  categoryId: z.string().refine(val => !isNaN(parseInt(val)), "Category is required"),
  seasons: z.string().refine(val => !isNaN(parseInt(val)), "Seasons must be a number"),
  isPremium: z.boolean().default(false)
});

type SeriesFormValues = z.infer<typeof seriesFormSchema>;

export default function AdminSeries() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch series and categories
  const { data: seriesData, isLoading: seriesLoading } = useQuery<Series[]>({
    queryKey: ["/api/series"],
  });
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Setup form
  const form = useForm<SeriesFormValues>({
    resolver: zodResolver(seriesFormSchema),
    defaultValues: {
      title: "",
      poster: "",
      startYear: "",
      endYear: "",
      rating: "",
      categoryId: "",
      seasons: "1",
      isPremium: false
    }
  });
  
  // Create series mutation
  const createSeriesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/series", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/series"] });
      toast({
        title: "Series created",
        description: "The series has been created successfully",
      });
      setIsFormDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create series",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update series mutation
  const updateSeriesMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/series/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/series"] });
      toast({
        title: "Series updated",
        description: "The series has been updated successfully",
      });
      setIsFormDialogOpen(false);
      setSelectedSeries(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update series",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete series mutation
  const deleteSeriesMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/series/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/series"] });
      toast({
        title: "Series deleted",
        description: "The series has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedSeries(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete series",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: SeriesFormValues) => {
    // Convert string values to numbers
    const formattedData = {
      ...data,
      startYear: data.startYear ? parseInt(data.startYear) : undefined,
      endYear: data.endYear ? parseInt(data.endYear) : undefined,
      categoryId: parseInt(data.categoryId),
      seasons: parseInt(data.seasons),
    };
    
    if (selectedSeries) {
      updateSeriesMutation.mutate({ id: selectedSeries.id, data: formattedData });
    } else {
      createSeriesMutation.mutate(formattedData);
    }
  };
  
  // Open edit dialog with series data
  const handleEditSeries = (series: Series) => {
    setSelectedSeries(series);
    
    // Format the data for the form
    form.reset({
      title: series.title,
      poster: series.poster || "",
      startYear: series.startYear?.toString() || "",
      endYear: series.endYear?.toString() || "",
      rating: series.rating || "",
      categoryId: series.categoryId ? series.categoryId.toString() : "",
      seasons: series.seasons?.toString() || "1",
      isPremium: series.isPremium || false
    });
    
    setIsFormDialogOpen(true);
  };
  
  // Open create dialog
  const handleAddSeries = () => {
    setSelectedSeries(null);
    form.reset({
      title: "",
      poster: "",
      startYear: "",
      endYear: "",
      rating: "",
      categoryId: "",
      seasons: "1",
      isPremium: false
    });
    setIsFormDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedSeries) {
      deleteSeriesMutation.mutate(selectedSeries.id);
    }
  };
  
  // Filter series by search query
  const filteredSeries = seriesData?.filter(series => 
    series.title.toLowerCase().includes(searchQuery.toLowerCase())
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
            <CardTitle className="text-2xl">Series Management</CardTitle>
            <CardDescription>
              Manage all TV series in the system
            </CardDescription>
          </div>
          <Button onClick={handleAddSeries}>
            <Plus className="mr-2 h-4 w-4" />
            Add Series
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search and filter */}
          <div className="mb-4 flex gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search series..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Series table */}
          {seriesLoading ? (
            <div className="text-center py-8">Loading series...</div>
          ) : filteredSeries?.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
              <p>No series found. Add your first series to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poster</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Years</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Seasons</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSeries?.map((series) => (
                    <TableRow key={series.id}>
                      <TableCell>
                        {series.poster ? (
                          <img 
                            src={series.poster} 
                            alt={series.title} 
                            className="h-16 w-auto object-contain"
                          />
                        ) : (
                          <div className="h-16 w-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-xs">No poster</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{series.title}</TableCell>
                      <TableCell>
                        {series.startYear ? 
                          (series.endYear ? 
                            `${series.startYear}-${series.endYear}` : 
                            `${series.startYear}-`) : 
                          "N/A"}
                      </TableCell>
                      <TableCell>{series.rating || "N/A"}</TableCell>
                      <TableCell>{series.seasons || 1}</TableCell>
                      <TableCell>{getCategoryName(series.categoryId)}</TableCell>
                      <TableCell>
                        {series.isPremium ? (
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
                            onClick={() => handleEditSeries(series)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            asChild
                          >
                            <Link href={`/admin/series/${series.id}/episodes`}>
                              <FileText className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedSeries(series);
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
      
      {/* Series Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSeries ? 'Edit Series' : 'Add New Series'}
            </DialogTitle>
            <DialogDescription>
              {selectedSeries 
                ? 'Update the series details below' 
                : 'Fill out the form below to add a new series'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Series Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter series title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="startYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Year</FormLabel>
                      <FormControl>
                        <Input placeholder="First season year" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Year</FormLabel>
                      <FormControl>
                        <Input placeholder="Last season year" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave empty for ongoing series
                      </FormDescription>
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
                  name="seasons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seasons</FormLabel>
                      <FormControl>
                        <Input placeholder="Number of seasons" {...field} />
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
                        Direct URL to the series poster image
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
                        Mark this series as premium content (subscribers only)
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
                  disabled={createSeriesMutation.isPending || updateSeriesMutation.isPending}
                >
                  {createSeriesMutation.isPending || updateSeriesMutation.isPending 
                    ? "Saving..." 
                    : selectedSeries ? "Update Series" : "Add Series"}
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
              Are you sure you want to delete the series "{selectedSeries?.title}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Deleting this series will remove all associated episodes and data.
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
              disabled={deleteSeriesMutation.isPending}
            >
              {deleteSeriesMutation.isPending ? "Deleting..." : "Delete Series"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
