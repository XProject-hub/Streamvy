import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Channel, Movie, Series, Category, Country, 
  Program, Episode
} from "@shared/schema";
import {
  Users, Tv, Film, Video, BarChart2, 
  Globe, Settings, List, Flag, Activity,
  Play, Calendar
} from "lucide-react";

export default function AdminDashboard() {
  // Fetch counts of various content
  const { data: channels } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });
  
  const { data: movies } = useQuery<Movie[]>({
    queryKey: ["/api/movies"],
  });
  
  const { data: series } = useQuery<Series[]>({
    queryKey: ["/api/series"],
  });
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  const { data: countries } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });
  
  const { data: programs } = useQuery<Program[]>({
    queryKey: ["/api/programs/current"],
  });
  
  // Summary statistics
  const totalChannels = channels?.length || 0;
  const totalMovies = movies?.length || 0;
  const totalSeries = series?.length || 0;
  const totalCategories = categories?.length || 0;
  
  // Mock data for charts (would be replaced with real analytics in production)
  const contentByCategory = categories?.map(category => {
    const categoryChannels = channels?.filter(c => c.categoryId === category.id).length || 0;
    const categoryMovies = movies?.filter(m => m.categoryId === category.id).length || 0;
    const categorySeries = series?.filter(s => s.categoryId === category.id).length || 0;
    
    return {
      name: category.name,
      channels: categoryChannels,
      movies: categoryMovies,
      series: categorySeries,
      total: categoryChannels + categoryMovies + categorySeries
    };
  }) || [];
  
  const contentByType = [
    { name: "Channels", value: totalChannels, color: "#8b5cf6" },
    { name: "Movies", value: totalMovies, color: "#ec4899" },
    { name: "Series", value: totalSeries, color: "#f59e0b" }
  ];
  
  // Navigation items for admin
  const adminNavItems = [
    { name: "Dashboard", icon: <BarChart2 className="mr-2 h-5 w-5" />, path: "/admin" },
    { name: "Channels", icon: <Tv className="mr-2 h-5 w-5" />, path: "/admin/channels" },
    { name: "Movies", icon: <Film className="mr-2 h-5 w-5" />, path: "/admin/movies" },
    { name: "Series", icon: <Video className="mr-2 h-5 w-5" />, path: "/admin/series" },
    { name: "Episodes", icon: <Play className="mr-2 h-5 w-5" />, path: "/admin/episodes" },
    { name: "Categories", icon: <List className="mr-2 h-5 w-5" />, path: "/admin/categories" },
    { name: "EPG", icon: <Calendar className="mr-2 h-5 w-5" />, path: "/admin/epg" },
    { name: "Users", icon: <Users className="mr-2 h-5 w-5" />, path: "/admin/users" },
    { name: "Settings", icon: <Settings className="mr-2 h-5 w-5" />, path: "/admin/settings" }
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
                  item.path === "/admin" 
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
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Channels</p>
                  <p className="text-3xl font-bold">{totalChannels}</p>
                </div>
                <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <Tv className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Movies</p>
                  <p className="text-3xl font-bold">{totalMovies}</p>
                </div>
                <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <Film className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Series</p>
                  <p className="text-3xl font-bold">{totalSeries}</p>
                </div>
                <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <Video className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
                  <p className="text-3xl font-bold">{totalCategories}</p>
                </div>
                <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <List className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Content by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={contentByCategory}
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="channels" fill="#8b5cf6" name="Channels" />
                    <Bar dataKey="movies" fill="#ec4899" name="Movies" />
                    <Bar dataKey="series" fill="#f59e0b" name="Series" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Content Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contentByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {contentByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="bg-primary-600 hover:bg-primary-700 h-auto py-6 flex flex-col items-center justify-center"
              onClick={() => window.location.href = "/admin/channels/add"}
            >
              <Tv className="h-8 w-8 mb-2" />
              <span>Add New Channel</span>
            </Button>
            
            <Button 
              className="bg-secondary-500 hover:bg-secondary-600 h-auto py-6 flex flex-col items-center justify-center"
              onClick={() => window.location.href = "/admin/movies/add"}
            >
              <Film className="h-8 w-8 mb-2" />
              <span>Add New Movie</span>
            </Button>
            
            <Button 
              className="bg-accent-500 hover:bg-accent-600 h-auto py-6 flex flex-col items-center justify-center text-gray-900"
              onClick={() => window.location.href = "/admin/series/add"}
            >
              <Video className="h-8 w-8 mb-2" />
              <span>Add New Series</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
