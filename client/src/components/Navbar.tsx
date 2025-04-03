import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ThemeToggleSimple } from "./ThemeToggleSimple";

export function Navbar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    { name: "Live TV", path: "/live-tv" },
    { name: "Movies", path: "/movies" },
    { name: "Series", path: "/series" },
    { name: "Premium", path: "/premium" },
    { name: "Payments Demo", path: "/payment-methods-demo" }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center flex-shrink-0 text-primary-600 dark:text-primary-400 mr-8 cursor-pointer">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l7 4.5-7 4.5z" />
              </svg>
              <span className="ml-2 text-xl font-bold">StreamHive</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <div key={item.path} className={`cursor-pointer ${
                location === item.path 
                  ? "text-primary-600 dark:text-primary-400 font-medium" 
                  : "text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              }`}>
                <Link href={item.path}>
                  {item.name}
                </Link>
              </div>
            ))}
            
            {user?.isAdmin && (
              <div className={`cursor-pointer ${
                location.startsWith("/admin") 
                  ? "text-primary-600 dark:text-primary-400 font-medium" 
                  : "text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              }`}>
                <Link href="/admin">
                  Admin
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden sm:block">
            <form onSubmit={handleSearch}>
              <Input 
                type="text" 
                placeholder="Search for TV, movies, and more..." 
                className="w-64 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
            </form>
          </div>
          
          {/* Theme Toggle */}
          <ThemeToggleSimple />
          
          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden flex justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        {navItems.map((item, index) => (
          <div key={index} className="flex-1">
            <Link href={item.path}>
              <div className={`text-center py-1 ${
                location === item.path 
                  ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-500" 
                  : "text-gray-500 dark:text-gray-300"
              }`}>
                <span className="text-xs">{item.name}</span>
              </div>
            </Link>
          </div>
        ))}
        {/* Mobile Search */}
        <div className="flex-1">
          <Link href="/search">
            <div className="text-center py-1 text-gray-500 dark:text-gray-300">
              <span className="text-xs">Search</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
