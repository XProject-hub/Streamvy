import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Channel, Program } from "@shared/schema";
import { Loader2, ChevronLeft, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import Hls from "hls.js";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StreamSource {
  url: string;
  priority: number;
  label?: string;
}

export default function ChannelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [streamSources, setStreamSources] = useState<StreamSource[]>([]);

  const { data: channel, isLoading, error } = useQuery<Channel>({
    queryKey: [`/api/channels/${id}`],
  });

  // Fetch channel programs
  const { data: programs, isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: [`/api/channels/${id}/programs`],
    enabled: !!id,
  });

  // Parse stream sources when channel data loads
  useEffect(() => {
    if (channel?.streamSources) {
      try {
        const sources = typeof channel.streamSources === 'string' 
          ? JSON.parse(channel.streamSources as string) 
          : channel.streamSources as StreamSource[];
          
        // Sort by priority if available
        const sortedSources = Array.isArray(sources)
          ? sources.sort((a, b) => (a.priority || 999) - (b.priority || 999))
          : [{ url: sources as string, priority: 1 }];
          
        setStreamSources(sortedSources);
      } catch (err) {
        console.error("Error parsing stream sources:", err);
        setHasError(true);
      }
    }
  }, [channel]);

  // Play video when stream sources are available
  useEffect(() => {
    if (!streamSources.length || !videoRef.current) return;
    
    setHasError(false);
    const video = videoRef.current;
    
    // Get current stream URL
    const currentSource = streamSources[currentSourceIndex];
    if (!currentSource || !currentSource.url) {
      setHasError(true);
      return;
    }
    
    const streamUrl = currentSource.url;
    
    // Check if the URL is an HLS stream (.m3u8)
    if (streamUrl.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.error("Error playing video:", err);
            // Try next source if available
            if (currentSourceIndex < streamSources.length - 1) {
              setCurrentSourceIndex(prev => prev + 1);
            } else {
              setHasError(true);
            }
          });
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data);
        if (data.fatal) {
          // Try next source if available
          if (currentSourceIndex < streamSources.length - 1) {
            setCurrentSourceIndex(prev => prev + 1);
          } else {
            setHasError(true);
          }
        }
      });
      
      return () => {
        hls.destroy();
      };
    } else {
      // For regular video formats
      video.src = streamUrl;
      video.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Error playing video:", err);
          // Try next source if available
          if (currentSourceIndex < streamSources.length - 1) {
            setCurrentSourceIndex(prev => prev + 1);
          } else {
            setHasError(true);
          }
        });
    }
  }, [streamSources, currentSourceIndex]);

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="container py-8">
        <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">Error Loading Channel</h2>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error?.message || "Channel not found"}
          </p>
          <Button onClick={() => setLocation("/live-tv")}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Live TV
          </Button>
        </div>
      </div>
    );
  }

  // Separate programs into current, upcoming, and past
  const now = new Date();
  const currentProgram = programs?.find(
    program => new Date(program.startTime) <= now && new Date(program.endTime) >= now
  );
  
  const upcomingPrograms = programs
    ?.filter(program => new Date(program.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5); // Show only next 5 upcoming programs
  
  const formatTime = (date: Date) => {
    return format(new Date(date), "h:mm a");
  };

  return (
    <div className="container py-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="mb-6">
          <Button variant="outline" onClick={() => setLocation("/live-tv")}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Live TV
          </Button>
        </div>
        
        {/* Channel header - centered */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {channel.logo && (
            <img 
              src={channel.logo} 
              alt={channel.name} 
              className="w-16 h-16 object-contain rounded-md"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{channel.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">Live Channel</p>
            {channel.status && (
              <span className={`inline-block px-2 py-1 text-xs rounded mt-2 ${
                channel.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                channel.status === 'offline' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {channel.status === 'online' ? 'LIVE' : 
                 channel.status === 'offline' ? 'DOWN' : 'UNKNOWN'}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Video player - perfectly centered */}
      <div className="w-full max-w-4xl mx-auto mb-6">
        <div className="relative bg-black w-full aspect-video rounded-lg overflow-hidden shadow-lg">
          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <div className="text-white mb-4">
                <h3 className="text-xl font-semibold mb-2">Stream Error</h3>
                <p>We're having trouble playing this stream. It may be temporarily unavailable.</p>
              </div>
              <Button onClick={() => setLocation("/live-tv")}>
                Back to Live TV
              </Button>
            </div>
          ) : !isPlaying ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : null}
          
          <video 
            ref={videoRef} 
            controls 
            className="w-full h-full"
            playsInline
            poster={channel.logo || undefined}
          />
        </div>
      </div>
      
      {/* Stream source indicators - centered */}
      {streamSources.length > 1 && (
        <div className="w-full max-w-4xl mx-auto mb-8 flex justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Stream sources:</span>
            <div className="flex gap-1">
              {streamSources.map((_, index) => (
                <div 
                  key={index} 
                  className={`w-2 h-2 rounded-full ${
                    index === currentSourceIndex 
                      ? 'bg-primary' 
                      : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                  title={`Source ${index + 1}${index === currentSourceIndex ? ' (active)' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* EPG Section - centered */}
      <div className="w-full max-w-4xl mx-auto mt-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Program Guide</h2>
        
        {programsLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : programs?.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500 dark:text-gray-400">
                No program information available for this channel.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Currently Playing */}
            {currentProgram && (
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Now Playing</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      LIVE
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{currentProgram.title}</h3>
                    {currentProgram.episodeTitle && (
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {currentProgram.episodeTitle}
                      </p>
                    )}
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="mr-1 h-4 w-4" />
                      <span>
                        {formatTime(currentProgram.startTime)} - {formatTime(currentProgram.endTime)}
                      </span>
                    </div>
                    {currentProgram.description && (
                      <p className="text-gray-600 dark:text-gray-300 mt-2">
                        {currentProgram.description}
                      </p>
                    )}
                    {currentProgram.category && (
                      <Badge variant="secondary" className="mt-2">
                        {currentProgram.category}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Upcoming Programs */}
            {upcomingPrograms && upcomingPrograms.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Coming Up Next</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {upcomingPrograms.map((program) => (
                      <div 
                        key={program.id}
                        className="py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{program.title}</h4>
                            {program.episodeTitle && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {program.episodeTitle}
                              </p>
                            )}
                            {program.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                {program.description}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                            {formatTime(program.startTime)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}