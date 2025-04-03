import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ContentCard } from "@/components/ContentCard";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Channel, Movie, Series, Category, Program } from "@shared/schema";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const { user } = useAuth();
  
  // Fetch featured content (current programs for live TV)
  const { data: currentPrograms } = useQuery<Program[]>({
    queryKey: ["/api/programs/current"],
  });
  
  // Fetch channels
  const { data: channels, isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });
  
  // Fetch movies
  const { data: movies, isLoading: moviesLoading } = useQuery<Movie[]>({
    queryKey: ["/api/movies"],
  });
  
  // Fetch series
  const { data: series, isLoading: seriesLoading } = useQuery<Series[]>({
    queryKey: ["/api/series"],
  });
  
  // Filter content by category if selected
  const filteredChannels = selectedCategoryId
    ? channels?.filter(channel => channel.categoryId === selectedCategoryId)
    : channels;
    
  const filteredMovies = selectedCategoryId
    ? movies?.filter(movie => movie.categoryId === selectedCategoryId)
    : movies;
    
  const filteredSeries = selectedCategoryId
    ? series?.filter(s => s.categoryId === selectedCategoryId)
    : series;
  
  // Get featured content (first live program if available)
  const featuredProgram = currentPrograms?.[0];
  const featuredChannel = featuredProgram 
    ? channels?.find(c => c.id === featuredProgram.channelId)
    : undefined;

  return (
    <div className="bg-gray-100 dark:bg-gray-900">
      {/* Featured Content */}
      {featuredChannel && featuredProgram && (
        <section className="relative bg-gray-900">
          <VideoPlayer
            title={featuredProgram.title}
            description={featuredProgram.description}
            streamSources={featuredChannel.streamSources}
            isLive={true}
          />
        </section>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Categories */}
        <CategoryFilter 
          onCategorySelect={setSelectedCategoryId}
          selectedCategoryId={selectedCategoryId}
        />
        
        {/* Live TV Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Live TV</h2>
            <Link href="/live-tv" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
              View All
            </Link>
          </div>
          
          {/* Channel grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredChannels?.slice(0, 5).map((channel) => {
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
        </div>
        
        {/* Movies Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Popular Movies</h2>
            <Link href="/movies" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
              View All
            </Link>
          </div>
          
          {/* Movies grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMovies?.slice(0, 5).map((movie) => (
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
        </div>
        
        {/* Series Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Trending Series</h2>
            <Link href="/series" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
              View All
            </Link>
          </div>
          
          {/* Series grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredSeries?.slice(0, 5).map((s) => (
              <ContentCard
                key={s.id}
                id={s.id}
                title={s.title}
                image={s.poster}
                category={`${s.seasons} Seasons`}
                subDetail={s.startYear ? (s.endYear ? `${s.startYear}-${s.endYear}` : `${s.startYear}-`) : ""}
                rating={s.rating}
                type="series"
                aspectRatio="poster"
                quality={s.isPremium ? "PREMIUM" : "HD"}
              />
            ))}
          </div>
        </div>
        
        {/* Premium Subscribe Section */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-500 rounded-xl p-6 mb-10">
          <div className="md:flex items-center justify-between">
            <div className="mb-4 md:mb-0 md:max-w-xl">
              <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Premium</h2>
              <p className="text-white text-opacity-90">
                Get access to exclusive PPV events, enjoy faster streams, and watch with no ads. 
                Starting at just $5.99/month.
              </p>
            </div>
            <div>
              <button 
                style={{
                  backgroundColor: '#ff5500', 
                  color: '#ffffff',
                  padding: '8px 24px',
                  borderRadius: '6px',
                  border: '2px solid #ffffff',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
