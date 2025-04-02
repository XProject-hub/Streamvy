import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Country } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, MoreVertical, Edit, Trash2, Search, Flag, 
  LayoutDashboard, Users, Film, Tv2, Layers, List, Globe, Radio, 
  ChevronDown, ChevronRight, Menu, X
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

export default function CountriesAdminPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [countryName, setCountryName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  
  // Get all countries
  const {
    data: countries = [],
    isLoading,
    isError,
    error
  } = useQuery<Country[]>({
    queryKey: ['/api/countries'],
  });
  
  // Create country mutation
  const createCountryMutation = useMutation({
    mutationFn: async (country: { name: string, code: string }) => {
      const res = await apiRequest('POST', '/api/admin/countries', country);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/countries'] });
      toast({
        title: 'Success',
        description: 'Country created successfully',
      });
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create country: ${err.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Update country mutation
  const updateCountryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { name: string, code: string } }) => {
      const res = await apiRequest('PUT', `/api/admin/countries/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/countries'] });
      toast({
        title: 'Success',
        description: 'Country updated successfully',
      });
      resetForm();
      setIsEditDialogOpen(false);
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update country: ${err.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Delete country mutation
  const deleteCountryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/admin/countries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/countries'] });
      toast({
        title: 'Success',
        description: 'Country deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setCurrentCountry(null);
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete country: ${err.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Reset form fields
  const resetForm = () => {
    setCountryName('');
    setCountryCode('');
    setCurrentCountry(null);
  };
  
  // Handle edit country
  const handleEditCountry = (country: Country) => {
    setCurrentCountry(country);
    setCountryName(country.name);
    setCountryCode(country.code);
    setIsEditDialogOpen(true);
  };
  
  // Handle delete country
  const handleDeleteCountry = (country: Country) => {
    setCurrentCountry(country);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle create country form submission
  const handleCreateCountry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryName || !countryCode) {
      toast({
        title: 'Validation Error',
        description: 'Country name and code are required',
        variant: 'destructive',
      });
      return;
    }
    
    createCountryMutation.mutate({
      name: countryName,
      code: countryCode.toLowerCase(),
    });
  };
  
  // Handle update country form submission
  const handleUpdateCountry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCountry) return;
    
    if (!countryName || !countryCode) {
      toast({
        title: 'Validation Error',
        description: 'Country name and code are required',
        variant: 'destructive',
      });
      return;
    }
    
    updateCountryMutation.mutate({
      id: currentCountry.id,
      data: {
        name: countryName,
        code: countryCode.toLowerCase(),
      },
    });
  };
  
  // Handle delete country confirmation
  const handleConfirmDelete = () => {
    if (!currentCountry) return;
    deleteCountryMutation.mutate(currentCountry.id);
  };
  
  // Filter countries by search term
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
// Admin Layout Component
function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Admin navigation items
  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/admin/channels', label: 'Channels', icon: <Tv2 size={18} /> },
    { path: '/admin/movies', label: 'Movies', icon: <Film size={18} /> },
    { path: '/admin/series', label: 'Series', icon: <Layers size={18} /> },
    { path: '/admin/categories', label: 'Categories', icon: <List size={18} /> },
    { path: '/admin/countries', label: 'Countries', icon: <Globe size={18} /> },
    { path: '/admin/epg', label: 'EPG', icon: <Radio size={18} /> },
    { path: '/admin/users', label: 'Users', icon: <Users size={18} /> },
  ];
  
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile menu */}
      <div className="lg:hidden fixed inset-0 z-40 flex">
        <div 
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-in-out duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`} 
          onClick={() => setMobileMenuOpen(false)}
        ></div>
        
        <div 
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 transition ease-in-out duration-300 transform ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-primary">StreamHive Admin</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    location === item.path
                      ? 'bg-gray-200 dark:bg-gray-700 text-primary'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div>
                <div className="flex text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.username}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.isAdmin ? 'Admin' : 'User'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div 
        className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:w-64' : 'lg:w-20'
        }`}
      >
        <div className="flex flex-col w-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex items-center h-16 flex-shrink-0 px-4 justify-between">
              {sidebarOpen && (
                <h1 className="text-xl font-bold text-primary">StreamHive</h1>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sidebarOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      location === item.path
                        ? 'bg-gray-200 dark:bg-gray-700 text-primary'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.icon}
                    {sidebarOpen && <span className="ml-3">{item.label}</span>}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow">
          <button
            className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Admin Panel</h1>
            </div>
          </div>
        </div>
        
        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
  
  if (isError) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold text-red-500">Error loading countries</h1>
          <p className="text-gray-500">{(error as Error)?.message || 'Unknown error'}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Country Management</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Country
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search countries..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Countries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Countries</CardTitle>
            <CardDescription>
              Manage your streaming platform's country options
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableCaption>A list of all countries in your streaming platform.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Flag</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCountries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        {searchTerm ? 'No countries match your search' : 'No countries added yet'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCountries.map((country) => (
                      <TableRow key={country.id}>
                        <TableCell className="font-medium">{country.name}</TableCell>
                        <TableCell>{country.code.toUpperCase()}</TableCell>
                        <TableCell>
                          <span className="text-2xl">
                            {country.code.toUpperCase().replace(/./g, char => 
                              String.fromCodePoint(char.charCodeAt(0) + 127397)
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditCountry(country)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteCountry(country)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Add Country Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Country</DialogTitle>
              <DialogDescription>
                Add a new country to your streaming platform
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCountry}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="name" className="text-right font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={countryName}
                    onChange={(e) => setCountryName(e.target.value)}
                    className="col-span-3"
                    placeholder="United States"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="code" className="text-right font-medium">
                    Code (2 letters)
                  </label>
                  <Input
                    id="code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="col-span-3"
                    placeholder="us"
                    maxLength={2}
                  />
                </div>
                {countryCode && countryCode.length === 2 && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right font-medium">
                      Flag Preview
                    </label>
                    <div className="col-span-3 text-2xl">
                      {countryCode.toUpperCase().replace(/./g, char => 
                        String.fromCodePoint(char.charCodeAt(0) + 127397)
                      )}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setIsAddDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCountryMutation.isPending}
                >
                  {createCountryMutation.isPending ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                      Creating...
                    </>
                  ) : 'Create Country'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Country Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Country</DialogTitle>
              <DialogDescription>
                Update country information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateCountry}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="edit-name" className="text-right font-medium">
                    Name
                  </label>
                  <Input
                    id="edit-name"
                    value={countryName}
                    onChange={(e) => setCountryName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="edit-code" className="text-right font-medium">
                    Code (2 letters)
                  </label>
                  <Input
                    id="edit-code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="col-span-3"
                    maxLength={2}
                  />
                </div>
                {countryCode && countryCode.length === 2 && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right font-medium">
                      Flag Preview
                    </label>
                    <div className="col-span-3 text-2xl">
                      {countryCode.toUpperCase().replace(/./g, char => 
                        String.fromCodePoint(char.charCodeAt(0) + 127397)
                      )}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setIsEditDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateCountryMutation.isPending}
                >
                  {updateCountryMutation.isPending ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                      Updating...
                    </>
                  ) : 'Update Country'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Country Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Country</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this country? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {currentCountry && (
                <div className="flex items-center p-4 bg-muted rounded-md">
                  <Flag className="mr-2 h-4 w-4" />
                  <span className="font-medium">{currentCountry.name}</span>
                  <span className="ml-2 text-muted-foreground">({currentCountry.code.toUpperCase()})</span>
                  <span className="ml-2 text-2xl">
                    {currentCountry.code.toUpperCase().replace(/./g, char => 
                      String.fromCodePoint(char.charCodeAt(0) + 127397)
                    )}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setCurrentCountry(null);
                  setIsDeleteDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteCountryMutation.isPending}
              >
                {deleteCountryMutation.isPending ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    Deleting...
                  </>
                ) : 'Delete Country'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}