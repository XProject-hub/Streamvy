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
import { Country } from "@shared/schema";
import { 
  Plus, Edit, Trash2, Search, AlertTriangle, 
  Globe, Film, Tv, Video, Play, List, BarChart2, 
  Users, Calendar
} from "lucide-react";
import { Link } from "wouter";

// Country form schema
const countryFormSchema = z.object({
  name: z.string().min(1, "Country name is required"),
  code: z.string().min(2, "Valid country code is required").max(2, "Country code must be 2 letters"),
  flag: z.string().url("Must be a valid URL").optional().or(z.literal(''))
});

type CountryFormValues = z.infer<typeof countryFormSchema>;

export default function CountriesAdminPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch countries
  const { data: countries, isLoading: countriesLoading } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });
  
  // Country form setup
  const form = useForm<CountryFormValues>({
    resolver: zodResolver(countryFormSchema),
    defaultValues: {
      name: "",
      code: "",
      flag: ""
    }
  });
  
  // Create country mutation
  const createCountryMutation = useMutation({
    mutationFn: async (data: CountryFormValues) => {
      const response = await apiRequest("POST", "/api/admin/countries", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      toast({
        title: "Country created",
        description: "The country has been created successfully",
      });
      setIsFormDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to create country",
        description: err.message,
        variant: "destructive",
      });
    }
  });
  
  // Update country mutation
  const updateCountryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CountryFormValues }) => {
      const response = await apiRequest("PUT", `/api/admin/countries/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      toast({
        title: "Country updated",
        description: "The country has been updated successfully",
      });
      setIsFormDialogOpen(false);
      setSelectedCountry(null);
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to update country",
        description: err.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete country mutation
  const deleteCountryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/countries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      toast({
        title: "Country deleted",
        description: "The country has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCountry(null);
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to delete country",
        description: err.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: CountryFormValues) => {
    if (selectedCountry) {
      updateCountryMutation.mutate({ id: selectedCountry.id, data });
    } else {
      createCountryMutation.mutate(data);
    }
  };
  
  // Open edit dialog with country data
  const handleEditCountry = (country: Country) => {
    setSelectedCountry(country);
    
    form.reset({
      name: country.name,
      code: country.code,
      flag: country.flag || ""
    });
    
    setIsFormDialogOpen(true);
  };
  
  // Open create dialog
  const handleAddCountry = () => {
    setSelectedCountry(null);
    form.reset({
      name: "",
      code: "",
      flag: ""
    });
    setIsFormDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteCountry = (country: Country) => {
    setSelectedCountry(country);
    setIsDeleteDialogOpen(true);
  };
  
  // Delete country
  const handleDeleteConfirm = () => {
    if (selectedCountry) {
      deleteCountryMutation.mutate(selectedCountry.id);
    }
  };
  
  // Filter countries by search
  const filteredCountries = countries?.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Navigation items for admin
  const adminNavItems = [
    { name: "Dashboard", icon: <BarChart2 className="mr-2 h-5 w-5" />, path: "/admin" },
    { name: "Channels", icon: <Tv className="mr-2 h-5 w-5" />, path: "/admin/channels" },
    { name: "Movies", icon: <Film className="mr-2 h-5 w-5" />, path: "/admin/movies" },
    { name: "Series", icon: <Video className="mr-2 h-5 w-5" />, path: "/admin/series" },
    { name: "Episodes", icon: <Play className="mr-2 h-5 w-5" />, path: "/admin/episodes" },
    { name: "Categories", icon: <List className="mr-2 h-5 w-5" />, path: "/admin/categories" },
    { name: "Countries", icon: <Globe className="mr-2 h-5 w-5" />, path: "/admin/countries" },
    { name: "EPG", icon: <Calendar className="mr-2 h-5 w-5" />, path: "/admin/epg" },
    { name: "Users", icon: <Users className="mr-2 h-5 w-5" />, path: "/admin/users" }
  ];
  
  return (
    <AdminLayout>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Countries Management</CardTitle>
            <CardDescription>
              Manage countries for organizing channels and content
            </CardDescription>
          </div>
          <Button onClick={handleAddCountry}>
            <Plus className="mr-2 h-4 w-4" />
            Add Country
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search and filter */}
          <div className="mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search countries..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Countries table */}
          {countriesLoading ? (
            <div className="text-center py-8">Loading countries...</div>
          ) : filteredCountries?.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
              <p>No countries found. Add your first country to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flag</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCountries?.map((country) => (
                    <TableRow key={country.id}>
                      <TableCell>
                        {country.flag ? (
                          <img 
                            src={country.flag} 
                            alt={`${country.name} flag`} 
                            className="h-8 w-auto" 
                          />
                        ) : (
                          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500 dark:text-gray-400">
                            <Globe className="h-4 w-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{country.name}</TableCell>
                      <TableCell>{country.code.toUpperCase()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCountry(country)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCountry(country)}
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
      
      {/* Country Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCountry ? 'Edit Country' : 'Add New Country'}
            </DialogTitle>
            <DialogDescription>
              {selectedCountry 
                ? 'Update the country details below' 
                : 'Fill out the form below to add a new country'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter country name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="2-letter code (e.g., US)" 
                        {...field} 
                        maxLength={2}
                        onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="flag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flag URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter flag image URL" 
                        {...field} 
                        value={field.value || ""}
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
                  {selectedCountry ? 'Update Country' : 'Add Country'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCountry?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Deleting this country will remove it from all associated channels.
            </AlertDescription>
          </Alert>
          
          <DialogFooter className="gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
            >
              Delete Country
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminNavItems = [
    { name: "Dashboard", icon: <BarChart2 className="mr-2 h-5 w-5" />, path: "/admin" },
    { name: "Channels", icon: <Tv className="mr-2 h-5 w-5" />, path: "/admin/channels" },
    { name: "Movies", icon: <Film className="mr-2 h-5 w-5" />, path: "/admin/movies" },
    { name: "Series", icon: <Video className="mr-2 h-5 w-5" />, path: "/admin/series" },
    { name: "Episodes", icon: <Play className="mr-2 h-5 w-5" />, path: "/admin/episodes" },
    { name: "Categories", icon: <List className="mr-2 h-5 w-5" />, path: "/admin/categories" },
    { name: "Countries", icon: <Globe className="mr-2 h-5 w-5" />, path: "/admin/countries" },
    { name: "EPG", icon: <Calendar className="mr-2 h-5 w-5" />, path: "/admin/epg" },
    { name: "Users", icon: <Users className="mr-2 h-5 w-5" />, path: "/admin/users" }
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-1/5 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
          <nav className="space-y-1">
            {adminNavItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  item.path === "/admin/countries" 
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="w-full md:w-4/5 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}