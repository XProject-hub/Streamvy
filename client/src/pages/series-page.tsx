import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ContentCard } from "@/components/ContentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Series, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export default function SeriesPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const { user } = useAuth();
  
  // Fetch series
  const { data: seriesData, isLoading } = useQuery<Series[]>({
    queryKey: ["/api/series"],
  });
  
  // Filter series by category and premium status
  const filteredSeries = seriesData?.filter(series => {
    const matchesCategory = selectedCategoryId ? series.categoryId === selectedCategoryId : true;
    const matchesPremium = showPremiumOnly ? series.isPremium : true;
    return matchesCategory && matchesPremium;
  });
  
  // Sort by rating (highest first)
  const sortedSeries = [...(filteredSeries || [])].sort((a, b) => {
    const ratingA = parseFloat(a.rating || "0");
    const ratingB = parseFloat(b.rating || "0");
    return ratingB - ratingA;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-3xl font-bold mb-6">TV Series</h1>
      
      {/* Categories */}
      <CategoryFilter 
        onCategorySelect={setSelectedCategoryId}
        selectedCategoryId={selectedCategoryId}
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
      
      {/* Series Grid */}
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
      ) : sortedSeries?.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            No series found with the selected filters.
          </p>
          <Button 
            variant="link" 
            onClick={() => {
              setSelectedCategoryId(null);
              setShowPremiumOnly(false);
            }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sortedSeries?.map((series) => (
            <ContentCard
              key={series.id}
              id={series.id}
              title={series.title}
              image={series.poster}
              category={`${series.seasons} Seasons`}
              subDetail={series.startYear ? (series.endYear ? `${series.startYear}-${series.endYear}` : `${series.startYear}-`) : ""}
              rating={series.rating}
              type="series"
              aspectRatio="poster"
              quality={series.isPremium ? "PREMIUM" : "HD"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
