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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Category, insertCategorySchema } from "@shared/schema";
import { Plus, Edit, Trash2, Search, AlertTriangle } from "lucide-react";

// Extend the category schema for the form
const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  iconSvg: z.string().optional(),
  gradientFrom: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color").optional(),
  gradientTo: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color").optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function AdminCategories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Setup form
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      iconSvg: "",
      gradientFrom: "#8b5cf6",
      gradientTo: "#ec4899",
    }
  });
  
  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const response = await apiRequest("POST", "/api/admin/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category created",
        description: "The category has been created successfully",
      });
      setIsFormDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create category",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryFormValues }) => {
      const response = await apiRequest("PUT", `/api/admin/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category updated",
        description: "The category has been updated successfully",
      });
      setIsFormDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update category",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete category",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: CategoryFormValues) => {
    if (selectedCategory) {
      updateCategoryMutation.mutate({ id: selectedCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };
  
  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  };
  
  // Open edit dialog with category data
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    
    form.reset({
      name: category.name,
      slug: category.slug,
      iconSvg: category.iconSvg || "",
      gradientFrom: category.gradientFrom || "#8b5cf6",
      gradientTo: category.gradientTo || "#ec4899",
    });
    
    setIsFormDialogOpen(true);
  };
  
  // Open create dialog
  const handleAddCategory = () => {
    setSelectedCategory(null);
    form.reset({
      name: "",
      slug: "",
      iconSvg: "",
      gradientFrom: "#8b5cf6",
      gradientTo: "#ec4899",
    });
    setIsFormDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedCategory) {
      deleteCategoryMutation.mutate(selectedCategory.id);
    }
  };
  
  // Filter categories by search query
  const filteredCategories = categories?.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Categories Management</CardTitle>
            <CardDescription>
              Manage content categories for channels, movies, and series
            </CardDescription>
          </div>
          <Button onClick={handleAddCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4 flex gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search categories..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Categories table */}
          {categoriesLoading ? (
            <div className="text-center py-8">Loading categories...</div>
          ) : filteredCategories?.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
              <p>No categories found. Add your first category to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Has Icon</TableHead>
                    <TableHead>Gradient Colors</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div 
                          className="h-10 w-16 rounded-md flex items-center justify-center"
                          style={{
                            background: category.gradientFrom && category.gradientTo 
                              ? `linear-gradient(to right, ${category.gradientFrom}, ${category.gradientTo})` 
                              : "linear-gradient(to right, #8b5cf6, #ec4899)"
                          }}
                        >
                          {category.iconSvg ? (
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <g dangerouslySetInnerHTML={{ __html: category.iconSvg }}></g>
                            </svg>
                          ) : (
                            <span className="text-xs text-white">No icon</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>
                        {category.iconSvg ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            No
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {category.gradientFrom && (
                            <div 
                              className="h-4 w-4 rounded-full border border-gray-300" 
                              style={{ backgroundColor: category.gradientFrom }}
                              title={category.gradientFrom}
                            ></div>
                          )}
                          {category.gradientTo && (
                            <div 
                              className="h-4 w-4 rounded-full border border-gray-300" 
                              style={{ backgroundColor: category.gradientTo }}
                              title={category.gradientTo}
                            ></div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedCategory(category);
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
      
      {/* Category Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              {selectedCategory 
                ? 'Update the category details below' 
                : 'Fill out the form below to add a new category'}
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
                      <FormLabel className="text-gray-800 dark:text-gray-200 font-medium">Category Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter category name" 
                          {...field} 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto-generate slug if not editing an existing category
                            if (!selectedCategory) {
                              form.setValue("slug", generateSlug(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 dark:text-gray-200 font-medium">Slug</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="category-slug" 
                          {...field} 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        />
                      </FormControl>
                      <FormDescription className="text-gray-600 dark:text-gray-400">
                        URL-friendly identifier (e.g., sports, news)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="iconSvg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-800 dark:text-gray-200 font-medium">Icon SVG Path</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="SVG path data" 
                        {...field} 
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-600 dark:text-gray-400">
                      SVG path data for the category icon (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gradientFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 dark:text-gray-200 font-medium">Gradient Start Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="#8b5cf6" 
                            {...field} 
                            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                          />
                        </FormControl>
                        <div 
                          className="h-10 w-10 rounded border border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: field.value || "#8b5cf6" }}
                        ></div>
                      </div>
                      <FormDescription className="text-gray-600 dark:text-gray-400">
                        Starting hex color for the gradient
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gradientTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 dark:text-gray-200 font-medium">Gradient End Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="#ec4899" 
                            {...field} 
                            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                          />
                        </FormControl>
                        <div 
                          className="h-10 w-10 rounded border border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: field.value || "#ec4899" }}
                        ></div>
                      </div>
                      <FormDescription className="text-gray-600 dark:text-gray-400">
                        Ending hex color for the gradient
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Preview */}
              <div className="border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-md p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Preview</h3>
                <div 
                  className="h-20 w-full rounded-md flex items-center justify-center mb-4 shadow-sm"
                  style={{
                    background: `linear-gradient(to right, ${form.watch("gradientFrom") || "#8b5cf6"}, ${form.watch("gradientTo") || "#ec4899"})`
                  }}
                >
                  {form.watch("iconSvg") ? (
                    <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <g dangerouslySetInnerHTML={{ __html: form.watch("iconSvg") || "" }}></g>
                    </svg>
                  ) : (
                    <span className="text-white font-medium">No icon provided</span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-24">Category:</span> 
                    <span className="font-medium text-gray-900 dark:text-gray-100">{form.watch("name") || "Category Name"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-24">Slug:</span> 
                    <span className="font-medium text-gray-900 dark:text-gray-100">{form.watch("slug") || "category-slug"}</span>
                  </div>
                </div>
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
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending 
                    ? "Saving..." 
                    : selectedCategory ? "Update Category" : "Add Category"}
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
              Are you sure you want to delete the category "{selectedCategory?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-red-800 dark:text-red-300 font-medium">Warning</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">
              Deleting this category may impact content that uses it. Consider reassigning content to another category first.
            </AlertDescription>
          </Alert>
          
          <DialogFooter className="gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-gray-300 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteCategoryMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
