import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { ProgramProgressBar } from "./ProgramProgressBar";

interface ContentCardProps {
  id: number;
  title: string;
  image?: string;
  category?: string;
  subDetail?: string;
  rating?: string;
  type: 'channel' | 'movie' | 'series';
  isLive?: boolean;
  quality?: string;
  aspectRatio?: 'video' | 'poster';
  onClick?: () => void;
  status?: 'online' | 'offline' | 'unknown';
  countryCode?: string;
  countryFlag?: string;
  programStartTime?: Date | string;
  programEndTime?: Date | string;
  isCurrentProgram?: boolean;
}

export function ContentCard({
  id,
  title,
  image,
  category,
  subDetail,
  rating,
  type,
  isLive = false,
  quality = 'HD',
  aspectRatio = 'video',
  onClick,
  status = 'unknown',
  countryCode,
  countryFlag,
  programStartTime,
  programEndTime,
  isCurrentProgram = false
}: ContentCardProps) {
  const [_, setLocation] = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      if (type === 'channel') {
        setLocation(`/live-tv/${id}`);
      } else if (type === 'movie') {
        setLocation(`/movies/${id}`);
      } else if (type === 'series') {
        setLocation(`/series/${id}`);
      }
    }
  };

  return (
    <Card 
      className="content-card bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-transform hover:scale-103 cursor-pointer"
      onClick={handleClick}
    >
      <div className={cn(
        "relative bg-gray-200 dark:bg-gray-700",
        aspectRatio === 'video' ? "aspect-video" : "aspect-[2/3]"
      )}>
        <img 
          src={image || `https://via.placeholder.com/300x${aspectRatio === 'video' ? '169' : '450'}?text=No+Image`} 
          alt={title} 
          className="w-full h-full object-cover" 
        />
        
        {/* Live or status badge */}
        {isLive && type === 'channel' ? (
          <div className={cn(
            "absolute top-0 right-0 m-2 px-1.5 py-0.5 text-white text-xs rounded flex items-center",
            status === 'online' ? "bg-green-600" : 
            status === 'offline' ? "bg-red-600" : 
            "bg-yellow-600"
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-white mr-1"></span>
            {status === 'online' ? 'LIVE' : status === 'offline' ? 'DOWN' : 'UNKNOWN'}
          </div>
        ) : isLive && (
          <div className="absolute top-0 right-0 m-2 px-1.5 py-0.5 bg-red-600 text-white text-xs rounded flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white mr-1"></span>
            LIVE
          </div>
        )}
        
        {/* Quality badge */}
        {quality && !isLive && (
          <div className="absolute top-0 right-0 m-2 px-1.5 py-0.5 bg-yellow-500 text-gray-900 text-xs rounded">
            {quality}
          </div>
        )}
        
        {/* Country flag */}
        {type === 'channel' && countryFlag && (
          <div className="absolute bottom-0 left-0 m-2">
            <img 
              src={countryFlag}
              alt={countryCode || 'country flag'}
              className="w-6 h-4 rounded shadow-sm"
              title={countryCode?.toUpperCase()}
            />
          </div>
        )}
      </div>
      
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className={cn(
            "font-medium text-sm truncate",
            isCurrentProgram && "text-primary font-semibold"
          )}>
            {title}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">{category}</span>
        </div>
        
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
          {rating && (
            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-1.5 rounded text-xs mr-2">
              {rating}
            </span>
          )}
          <p className="truncate">{subDetail}</p>
        </div>
        
        {/* Program progress bar - only show for current programs with start and end times */}
        {isCurrentProgram && programStartTime && programEndTime && (
          <div className="mt-2">
            <ProgramProgressBar 
              startTime={programStartTime} 
              endTime={programEndTime}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
