import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Channel } from "@shared/schema";
import { Loader2, ChevronLeft, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import Hls from "hls.js";

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
  const [customUrl, setCustomUrl] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const { data: channel, isLoading, error } = useQuery<Channel>({
    queryKey: [`/api/channels/${id}`],
  });

  // Parse stream sources when channel data loads
  useEffect(() => {
    if (channel?.streamSources) {
      try {
        const sources = typeof channel.streamSources === 'string' 
          ? JSON.parse(channel.streamSources as string) 
          : channel.streamSources as StreamSource[];
          
        // Sort by priority if available
        let sortedSources = Array.isArray(sources)
          ? sources.sort((a, b) => (a.priority || 999) - (b.priority || 999))
          : [{ url: sources as string, priority: 1 }];
        
        // Add fallback streams for demo/development purposes
        // These will only be used if the original streams fail
        sortedSources = [
          ...sortedSources,
          { 
            url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", 
            priority: 900,
            label: "Fallback Stream 1" 
          },
          { 
            url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8", 
            priority: 901,
            label: "Fallback Stream 2" 
          }
        ];
          
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
    
    // Use proxy for streams that may have CORS issues
    // Skip proxy for demo streams that are known to work
    const isDemoStream = currentSource.url.includes('test-streams.mux.dev') || 
                          currentSource.url.includes('akamaized.net');
    
    const streamUrl = isDemoStream
      ? currentSource.url
      : `/api/stream-proxy?url=${encodeURIComponent(currentSource.url)}`;
    
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

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => setLocation("/live-tv")}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Live TV
        </Button>
      </div>
      
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
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
        
        <div className="relative bg-black w-full aspect-video rounded-lg overflow-hidden">
          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <div className="text-white mb-4">
                <h3 className="text-xl font-semibold mb-2">Stream Error</h3>
                <p>We're having trouble playing this stream. It may be temporarily unavailable.</p>
              </div>
              <div className="flex gap-3">
                {streamSources.length > 1 && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setHasError(false);
                      setCurrentSourceIndex((currentSourceIndex + 1) % streamSources.length);
                    }}
                  >
                    Try Next Source
                  </Button>
                )}
                <Button onClick={() => setLocation("/live-tv")}>
                  Back to Live TV
                </Button>
              </div>
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
        
        {/* Stream source indicators */}
        <div className="flex flex-col space-y-4 text-sm">
          {streamSources.length > 1 && (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <span>Stream sources:</span>
                <div className="flex gap-1">
                  {streamSources.map((_, index) => (
                    <div 
                      key={index} 
                      className={`w-2 h-2 rounded-full ${
                        index === currentSourceIndex 
                          ? 'bg-primary' 
                          : 'bg-gray-300 dark:bg-gray-700'
                      } cursor-pointer`}
                      onClick={() => {
                        setHasError(false);
                        setIsPlaying(false);
                        setCurrentSourceIndex(index);
                      }}
                      title={`Source ${index + 1}${index === currentSourceIndex ? ' (active)' : ''}`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Active source info */}
              {streamSources[currentSourceIndex] && (
                <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Active: {streamSources[currentSourceIndex].label || `Source ${currentSourceIndex + 1}`}
                  {currentSourceIndex >= streamSources.length - 2 && (
                    <span className="ml-2 text-amber-500">(Using fallback stream)</span>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Custom stream input */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setShowCustomInput(!showCustomInput)}
            >
              <Link className="h-4 w-4" />
              {showCustomInput ? 'Hide Custom Stream' : 'Try Custom Stream'}
            </Button>
            
            {showCustomInput && (
              <div className="mt-2 space-y-2">
                <div className="flex w-full items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Enter m3u8 stream URL to test"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    variant="secondary" 
                    size="sm"
                    disabled={!customUrl}
                    onClick={() => {
                      if (!customUrl) return;
                      setStreamSources(prev => [
                        {
                          url: customUrl,
                          priority: 0,
                          label: "Custom Stream"
                        },
                        ...prev
                      ]);
                      setCurrentSourceIndex(0);
                      setHasError(false);
                      setIsPlaying(false);
                    }}
                  >
                    Test Stream
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  For example: http://superiptv.xyz:8080/live/Afy8634/SmTSQpYRYs/334642.m3u8
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}