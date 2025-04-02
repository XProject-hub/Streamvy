import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CategoryFilter } from "@/components/CategoryFilter";
import { CountryFilter } from "@/components/CountryFilter";
import { ContentCard } from "@/components/ContentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Movie, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export default function MoviesPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const { user } = useAuth();
  
  // Fetch movies - update query depending on if country is selected
  const { data: movies, isLoading } = useQuery<Movie[]>({
    queryKey: selectedCountryId 
      ? ["/api/movies/country", selectedCountryId] 
      : ["/api/movies"],
    queryFn: async () => {
      const url = selectedCountryId 
        ? `/api/movies/country/${selectedCountryId}` 
        : "/api/movies";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }
      return response.json();
    }
  });
  
  // Filter movies by category and premium status
  const filteredMovies = movies?.filter(movie => {
    const matchesCategory = selectedCategoryId ? movie.categoryId === selectedCategoryId : true;
    const matchesPremium = showPremiumOnly ? movie.isPremium : true;
    return matchesCategory && matchesPremium;
  });
  
  // Sort by rating (highest first)
  const sortedMovies = [...(filteredMovies || [])].sort((a, b) => {
    const ratingA = parseFloat(a.rating || "0");
    const ratingB = parseFloat(b.rating || "0");
    return ratingB - ratingA;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-3xl font-bold mb-6">Movies</h1>
      
      {/* Categories */}
      <CategoryFilter 
        onCategorySelect={setSelectedCategoryId}
        selectedCategoryId={selectedCategoryId}
      />
      
      {/* Countries */}
      <CountryFilter
        onCountrySelect={setSelectedCountryId}
        selectedCountryId={selectedCountryId}
      />
      
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          {user && (
            <div className="flex items-center space-x-2">
              <Switch
                id="premium-filter"
                checked={showPremiumOnly}
                onCheckedChange={setShowPremiumOnly}
              />
              <Label htmlFor="premium-filter">Premium Only</Label>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">Latest</Button>
          <Button variant="default" size="sm">Top Rated</Button>
          <Button variant="outline" size="sm">Popular</Button>
        </div>
      </div>
      
      {/* Movies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="rounded-lg overflow-hidden">
              <Skeleton className="aspect-[2/3]" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedMovies?.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            No movies found with the selected filters.
          </p>
          <Button 
            variant="link" 
            onClick={() => {
              setSelectedCategoryId(null);
              setSelectedCountryId(null);
              setShowPremiumOnly(false);
            }}
            className="mt-2"
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sortedMovies?.map((movie) => (
            <ContentCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              image={movie.poster}
              category={movie.year?.toString() || ""}
              subDetail={`${movie.duration} min`}
              rating={movie.rating}
              type="movie"
              aspectRatio="poster"
              quality={movie.isPremium ? "PREMIUM" : "HD"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
