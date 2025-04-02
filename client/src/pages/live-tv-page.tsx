import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ContentCard } from "@/components/ContentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Channel, Program, Country } from "@shared/schema";
import { Button } from "@/components/ui/button";

export default function LiveTvPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  
  // Fetch channels
  const { data: channels, isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });
  
  // Fetch current programs
  const { data: currentPrograms } = useQuery<Program[]>({
    queryKey: ["/api/programs/current"],
  });
  
  // Fetch countries
  const { data: countries } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });
  
  // Filter channels by category and country
  const filteredChannels = channels?.filter(channel => {
    const matchesCategory = selectedCategoryId ? channel.categoryId === selectedCategoryId : true;
    const matchesCountry = selectedCountryId ? channel.countryId === selectedCountryId : true;
    return matchesCategory && matchesCountry;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-3xl font-bold mb-6">Live TV Channels</h1>
      
      {/* Categories */}
      <CategoryFilter 
        onCategorySelect={setSelectedCategoryId}
        selectedCategoryId={selectedCategoryId}
      />
      
      {/* Country Filter Pills */}
      <div className="flex items-center space-x-2 mb-6 overflow-x-auto py-2">
        <Button 
          variant={selectedCountryId === null ? "default" : "outline"}
          className="rounded-full whitespace-nowrap"
          onClick={() => setSelectedCountryId(null)}
        >
          All Countries
        </Button>
        
        {countries?.map((country) => (
          <Button
            key={country.id}
            variant={selectedCountryId === country.id ? "default" : "outline"}
            className="rounded-full whitespace-nowrap flex items-center"
            onClick={() => setSelectedCountryId(country.id === selectedCountryId ? null : country.id)}
          >
            <img 
              src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`} 
              className="w-4 h-4 mr-1" 
              alt={country.name} 
            />
            {country.name}
          </Button>
        ))}
      </div>
      
      {/* Channels Grid */}
      {channelsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="rounded-lg overflow-hidden">
              <Skeleton className="aspect-video" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredChannels?.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            No channels found with the selected filters.
          </p>
          <Button 
            variant="link" 
            onClick={() => {
              setSelectedCategoryId(null);
              setSelectedCountryId(null);
            }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredChannels?.map((channel) => {
            const program = currentPrograms?.find(p => p.channelId === channel.id);
            
            return (
              <ContentCard
                key={channel.id}
                id={channel.id}
                title={channel.name}
                image={channel.logo}
                category={program?.title || "Live TV"}
                subDetail={program?.description || "Live Channel"}
                type="channel"
                isLive={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
