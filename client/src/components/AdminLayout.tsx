import React from "react";
import { Link } from "wouter";
import { 
  BarChart2, 
  Tv, 
  Film, 
  Video, 
  Play, 
  List, 
  Globe, 
  Calendar, 
  Users,
  Settings,
  Database,
  HardDrive
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

export function AdminLayout({ children, activePath = "/admin" }: AdminLayoutProps) {
  const adminNavItems = [
    { name: "Dashboard", icon: <BarChart2 className="mr-2 h-5 w-5" />, path: "/admin" },
    { name: "Channels", icon: <Tv className="mr-2 h-5 w-5" />, path: "/admin/channels" },
    { name: "Movies", icon: <Film className="mr-2 h-5 w-5" />, path: "/admin/movies" },
    { name: "Series", icon: <Video className="mr-2 h-5 w-5" />, path: "/admin/series" },
    { name: "Episodes", icon: <Play className="mr-2 h-5 w-5" />, path: "/admin/episodes" },
    { name: "Categories", icon: <List className="mr-2 h-5 w-5" />, path: "/admin/categories" },
    { name: "Countries", icon: <Globe className="mr-2 h-5 w-5" />, path: "/admin/countries" },
    { name: "EPG", icon: <Calendar className="mr-2 h-5 w-5" />, path: "/admin/epg" },
    { name: "Users", icon: <Users className="mr-2 h-5 w-5" />, path: "/admin/users" },
    { name: "Settings", icon: <Settings className="mr-2 h-5 w-5" />, path: "/admin/settings" },
    { name: "Database Backup", icon: <Database className="mr-2 h-5 w-5" />, path: "/admin/database-backup" }
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
                  item.path === activePath 
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