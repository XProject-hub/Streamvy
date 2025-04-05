import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CategoryFilter } from "@/components/CategoryFilter";
import { CountryFilter } from "@/components/CountryFilter";
import { ContentCard } from "@/components/ContentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Channel, Program, Country } from "@shared/schema";
import { Button } from "@/components/ui/button";

export default function LiveTvPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  
  // Fetch channels - update query depending on if country is selected
  const { data: channels, isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: selectedCountryId 
      ? ["/api/channels/country", selectedCountryId] 
      : ["/api/channels"],
    queryFn: async () => {
      const url = selectedCountryId 
        ? `/api/channels/country/${selectedCountryId}` 
        : "/api/channels";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch channels");
      }
      return response.json();
    }
  });
  
  // Fetch current programs
  const { data: currentPrograms } = useQuery<Program[]>({
    queryKey: ["/api/programs/current"],
  });
  
  // Fetch countries for flags
  const { data: countries } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });
  
  // Create a map of countryId to country for efficient lookups
  const countryMap = useMemo(() => {
    if (!countries) return new Map<number, Country>();
    
    const map = new Map<number, Country>();
    countries.forEach(country => {
      map.set(country.id, country);
    });
    
    return map;
  }, [countries]);
  
  // Filter channels by category
  const filteredChannels = channels?.filter(channel => {
    const matchesCategory = selectedCategoryId ? channel.categoryId === selectedCategoryId : true;
    return matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-3xl font-bold mb-6">Live TV Channels</h1>
      
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
            const now = new Date();
            const isLiveProgram = program && 
              new Date(program.startTime) <= now && 
              new Date(program.endTime) >= now;
            
            return (
              <ContentCard
                key={channel.id}
                id={channel.id}
                title={channel.name}
                image={channel.logo as string | undefined}
                category={program?.title || "Live TV"}
                subDetail={program?.description || "Live Channel"}
                type="channel"
                isLive={true}
                status={(channel.status || 'unknown') as 'online' | 'offline' | 'unknown'}
                countryCode={
                  channel.countryId && countryMap.get(channel.countryId) 
                    ? (typeof countryMap.get(channel.countryId)?.code === 'string' 
                      ? countryMap.get(channel.countryId)?.code as string 
                      : undefined) 
                    : undefined
                }
                countryFlag={
                  channel.countryId && countryMap.get(channel.countryId) 
                    ? (typeof countryMap.get(channel.countryId)?.flag === 'string' 
                      ? countryMap.get(channel.countryId)?.flag as string 
                      : undefined) 
                    : undefined
                }
                // Program progress info
                programStartTime={isLiveProgram ? program.startTime : undefined}
                programEndTime={isLiveProgram ? program.endTime : undefined}
                isCurrentProgram={isLiveProgram}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
