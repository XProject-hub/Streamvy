import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Play, X, Volume2, VolumeX, Maximize, ChevronRight, ChevronLeft, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { StreamSource } from "@shared/schema";
import { testStreamSource } from "@/lib/video-utils";

interface VideoPlayerProps {
  title: string;
  description?: string;
  poster?: string;
  streamSources: StreamSource[];
  isLive?: boolean;
  onError?: (error: Error) => void;
}

export function VideoPlayer({
  title,
  description,
  poster,
  streamSources,
  isLive = false,
  onError,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [activeSource, setActiveSource] = useState<StreamSource | null>(null);
  const [sourceError, setSourceError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Sort stream sources by priority
  const sortedSources = [...streamSources].sort((a, b) => a.priority - b.priority);

  // Set up HLS player or fallback to native video
  useEffect(() => {
    if (!videoRef.current || !sortedSources.length) return;

    const setupSource = async (sourceIndex: number) => {
      if (sourceIndex >= sortedSources.length) {
        setSourceError(true);
        if (onError) onError(new Error("All stream sources failed to load"));
        return;
      }

      const source = sortedSources[sourceIndex];
      setActiveSource(source);
      setCurrentSourceIndex(sourceIndex);
      setSourceError(false);

      try {
        // Test if the source is available
        const isSourceAvailable = await testStreamSource(source.url);
        if (!isSourceAvailable) {
          throw new Error(`Source not available: ${source.url}`);
        }

        const video = videoRef.current;
        if (!video) return;

        // Clean up any existing HLS instance
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        // Handle HLS format
        if (source.format === 'hls' && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: isLive,
            backBufferLength: isLive ? 30 : 60,
          });
          
          hls.loadSource(source.url);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isPlaying) video.play().catch(console.error);
          });
          
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              console.error('HLS error:', data);
              
              // Try next source on fatal error
              setupSource(sourceIndex + 1);
            }
          });
          
          hlsRef.current = hls;
        } 
        // For MP4 and other supported formats, use native video
        else if (video.canPlayType('application/vnd.apple.mpegurl') || source.format === 'mp4') {
          video.src = source.url;
          
          video.onerror = () => {
            console.error('Video error:', video.error);
            setupSource(sourceIndex + 1);
          };
          
          if (isPlaying) video.play().catch(console.error);
        } else {
          // Fallback for unsupported formats
          setupSource(sourceIndex + 1);
        }
      } catch (error) {
        console.error('Error setting up video source:', error);
        setupSource(sourceIndex + 1);
      }
    };

    setupSource(0);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [sortedSources, isPlaying, onError, isLive]);

  // Handle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((e) => {
        console.error("Error playing video:", e);
        if (onError) onError(e);
      });
    }
    setIsPlaying(!isPlaying);
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    const container = videoContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((e) => {
        console.error("Error attempting to enable fullscreen:", e);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;

    video.volume = value;
    setVolume(value);
    if (value === 0) {
      video.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    if (!duration && video.duration) {
      setDuration(video.duration);
    }
  };

  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Show/hide controls on mouse move
  const handleMouseMove = () => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [
      h > 0 ? h : null,
      h > 0 ? m.toString().padStart(2, '0') : m,
      s.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  // Try another source
  const tryAnotherSource = () => {
    const nextIndex = (currentSourceIndex + 1) % sortedSources.length;
    const video = videoRef.current;
    
    if (video) {
      // Save current playback state
      const wasPlaying = !video.paused;
      const currentTime = video.currentTime;
      
      // Setup the new source
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      
      setActiveSource(sortedSources[nextIndex]);
      setCurrentSourceIndex(nextIndex);
      
      // Maintain playback state
      video.currentTime = currentTime;
      if (wasPlaying) video.play().catch(console.error);
    }
  };

  return (
    <>
      <div 
        className="relative video-placeholder bg-gray-900 cursor-pointer" 
        onClick={isPlaying ? () => setIsDialogOpen(true) : togglePlay}
      >
        {!isPlaying && (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <img 
                src={poster || "https://via.placeholder.com/1280x720?text=No+Preview"} 
                alt={title} 
                className="w-full h-full object-cover opacity-40"
              />
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 flex items-center justify-center"
                onClick={togglePlay}
              >
                <Play className="h-12 w-12" />
              </button>
            </div>
            
            {/* Content Info */}
            <div className="absolute left-0 bottom-0 w-full p-4 sm:p-8 bg-gradient-to-t from-black to-transparent">
              <div className="max-w-7xl mx-auto">
                {isLive && <span className="text-yellow-500 font-semibold">LIVE NOW</span>}
                <h1 className="text-2xl sm:text-4xl font-bold text-white mt-1 mb-2">{title}</h1>
                <div className="flex items-center text-gray-300 space-x-4 mb-4">
                  {isLive && (
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Live
                    </span>
                  )}
                  {activeSource?.label && <span>{activeSource.label}</span>}
                  {activeSource?.format && <span>{activeSource.format.toUpperCase()}</span>}
                </div>
                {description && (
                  <p className="text-gray-300 text-sm sm:text-base max-w-2xl mb-4 hidden sm:block">
                    {description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button className="bg-primary-600 hover:bg-primary-700 text-white" onClick={togglePlay}>
                    <Play className="h-5 w-5 mr-2" />
                    Watch Now
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
        
        {isPlaying && !isDialogOpen && (
          <div 
            className="flex items-center justify-center h-full"
            onClick={() => setIsDialogOpen(true)}
          >
            <div className="relative aspect-video w-full max-w-2xl">
              <video 
                ref={videoRef} 
                className="w-full h-full"
                poster={poster}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
                autoPlay
              />
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl p-0 bg-black text-white overflow-hidden" closeButton={false}>
          <div 
            ref={videoContainerRef}
            className="relative aspect-video w-full"
            onMouseMove={handleMouseMove}
          >
            <video 
              ref={videoRef} 
              className="w-full h-full"
              poster={poster}
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              playsInline
            />
            
            {sourceError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white">
                <div className="text-center p-8">
                  <h3 className="text-xl font-bold mb-4">Stream Unavailable</h3>
                  <p className="mb-6">Sorry, all streaming sources are currently unavailable.</p>
                  <Button onClick={() => setIsDialogOpen(false)}>Close Player</Button>
                </div>
              </div>
            )}
            
            {/* Video Controls Overlay */}
            <div className={cn(
              "absolute inset-0 transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
              {/* Close Button */}
              <DialogClose asChild>
                <Button 
                  variant="ghost" 
                  className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
                >
                  <X className="h-6 w-6" />
                </Button>
              </DialogClose>
              
              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                {/* Progress Bar (hidden for live content) */}
                {!isLive && (
                  <div className="w-full h-1 bg-gray-600 rounded-full mb-3">
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="absolute w-full h-1 opacity-0 cursor-pointer"
                    />
                    <div 
                      className="h-full bg-primary-500 rounded-full relative"
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    >
                      <div className="absolute -right-2 -top-1.5 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
                
                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Previous Source Button */}
                    {sortedSources.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white"
                        onClick={tryAnotherSource}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                    )}
                    
                    {/* Play/Pause Button */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white"
                      onClick={togglePlay}
                    >
                      {isPlaying ? (
                        <Pause className="h-8 w-8" />
                      ) : (
                        <Play className="h-8 w-8" />
                      )}
                    </Button>
                    
                    {/* Next Source Button */}
                    {sortedSources.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white"
                        onClick={tryAnotherSource}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    )}
                    
                    {/* Time Display */}
                    {!isLive && (
                      <div className="text-white text-sm hidden sm:block">
                        <span>{formatTime(currentTime)}</span>
                        <span className="mx-1">/</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    )}
                    
                    {/* Source Label */}
                    {activeSource?.label && (
                      <div className="text-white text-sm hidden sm:block">
                        <span>{activeSource.label}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Volume Control */}
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white"
                        onClick={toggleMute}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-6 w-6" />
                        ) : (
                          <Volume2 className="h-6 w-6" />
                        )}
                      </Button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 hidden sm:block"
                      />
                    </div>
                    
                    {/* Fullscreen Button */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white"
                      onClick={toggleFullscreen}
                    >
                      <Maximize className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
