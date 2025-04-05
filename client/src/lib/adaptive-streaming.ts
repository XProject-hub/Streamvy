import Hls from "hls.js";
import { StreamSource } from "@shared/schema";

// Quality levels for streaming
export type QualityLevel = 'auto' | '1080p' | '720p' | '480p' | '360p' | '240p';

// bandwidth in kbps ranges for quality selection
export const QUALITY_BANDWIDTH_RANGES = {
  '1080p': { min: 5000, optimal: 8000 },
  '720p': { min: 2500, optimal: 4000 },
  '480p': { min: 1000, optimal: 2000 },
  '360p': { min: 500, optimal: 1000 },
  '240p': { min: 300, optimal: 500 }
};

// Adaptive streaming configuration
export interface AdaptiveStreamingConfig {
  initialQuality: QualityLevel;
  enableAdaptiveQuality: boolean;
  bufferTarget: number; // in seconds
  startLevel: number; // -1 for auto
  maxBufferLength: number; // in seconds
  maxMaxBufferLength: number; // in seconds
  monitorBufferInterval: number; // in ms
  bandwidthMonitorInterval: number; // in ms
}

export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveStreamingConfig = {
  initialQuality: 'auto',
  enableAdaptiveQuality: true,
  bufferTarget: 30,
  startLevel: -1, // auto
  maxBufferLength: 60,
  maxMaxBufferLength: 600,
  monitorBufferInterval: 1000,
  bandwidthMonitorInterval: 5000
};

// Information about the current stream quality
export interface StreamQualityInfo {
  currentQuality: QualityLevel;
  availableQualities: QualityLevel[];
  bandwidthEstimate: number; // in kbps
  currentLevel: number;
  adaptiveMode: boolean;
  lastQualityChangeReason?: string;
  bandwidthHistory: Array<{
    timestamp: number;
    bandwidth: number;
    droppedFrames?: number;
  }>;
}

/**
 * Configure the HLS.js instance for adaptive streaming
 */
export function configureAdaptiveStreaming(
  hls: Hls, 
  config: Partial<AdaptiveStreamingConfig> = {}
): void {
  const finalConfig = { ...DEFAULT_ADAPTIVE_CONFIG, ...config };
  
  hls.config.startLevel = finalConfig.startLevel;
  hls.config.maxBufferLength = finalConfig.maxBufferLength;
  hls.config.maxMaxBufferLength = finalConfig.maxMaxBufferLength;
  
  // Adjust ABR algorithm behavior
  hls.config.abrEwmaDefaultEstimate = 1000000; // 1 Mbps default
  hls.config.abrEwmaFastLive = 3.0;
  hls.config.abrEwmaSlowLive = 9.0;
  
  // Enable bandwidth estimation
  hls.config.enableWorker = true;
  hls.config.lowLatencyMode = false;
  
  // Start with auto quality if enabled
  if (finalConfig.enableAdaptiveQuality) {
    hls.currentLevel = -1; // Auto quality
  }
}

/**
 * Get stream quality information from HLS.js
 */
export function getStreamQualityInfo(hls: Hls): StreamQualityInfo {
  if (!hls) {
    return {
      currentQuality: 'auto',
      availableQualities: ['auto'],
      bandwidthEstimate: 0,
      currentLevel: -1,
      adaptiveMode: true,
      bandwidthHistory: []
    };
  }
  
  // Get current bandwidth estimate
  const bandwidthEstimate = Math.round(hls.bandwidthEstimate / 1000); // Convert to kbps
  
  // Get available qualities
  const availableQualities: QualityLevel[] = ['auto'];
  
  if (hls.levels && hls.levels.length > 0) {
    for (const level of hls.levels) {
      if (level.height === 1080) availableQualities.push('1080p');
      else if (level.height === 720) availableQualities.push('720p');
      else if (level.height === 480) availableQualities.push('480p');
      else if (level.height === 360) availableQualities.push('360p');
      else if (level.height === 240) availableQualities.push('240p');
    }
  }
  
  // Determine current quality
  let currentQuality: QualityLevel = 'auto';
  if (hls.currentLevel >= 0 && hls.levels && hls.levels[hls.currentLevel]) {
    const height = hls.levels[hls.currentLevel].height;
    if (height === 1080) currentQuality = '1080p';
    else if (height === 720) currentQuality = '720p';
    else if (height === 480) currentQuality = '480p';
    else if (height === 360) currentQuality = '360p';
    else if (height === 240) currentQuality = '240p';
  }
  
  return {
    currentQuality,
    availableQualities,
    bandwidthEstimate,
    currentLevel: hls.currentLevel,
    adaptiveMode: hls.currentLevel === -1,
    bandwidthHistory: [{ timestamp: Date.now(), bandwidth: bandwidthEstimate }]
  };
}

/**
 * Set the streaming quality level
 */
export function setQualityLevel(hls: Hls, quality: QualityLevel): void {
  if (!hls) return;
  
  if (quality === 'auto') {
    hls.currentLevel = -1;
    return;
  }
  
  // Find the closest matching quality level
  if (!hls.levels || hls.levels.length === 0) return;
  
  const targetHeight = parseInt(quality.replace('p', ''));
  
  // Find the exact or closest match
  let bestMatchIndex = 0;
  let bestMatchDiff = Number.MAX_SAFE_INTEGER;
  
  hls.levels.forEach((level, index) => {
    const diff = Math.abs(level.height - targetHeight);
    if (diff < bestMatchDiff) {
      bestMatchDiff = diff;
      bestMatchIndex = index;
    }
  });
  
  hls.currentLevel = bestMatchIndex;
}

/**
 * Measure network conditions and select optimal source
 */
export async function measureNetworkConditions(): Promise<{
  bandwidth: number; // in kbps
  rtt: number; // in ms
  connectionType?: string;
  effectiveType?: string;
}> {
  // Use the Network Information API if available
  const connection = (navigator as any).connection;
  const connectionType = connection?.type;
  const effectiveType = connection?.effectiveType;
  
  // Measure RTT (round trip time) with a simple fetch request
  const startTime = Date.now();
  try {
    // Use a tiny endpoint that returns quickly
    await fetch('/api/network-test', { 
      method: 'HEAD',
      cache: 'no-store'
    });
    const rtt = Date.now() - startTime;
    
    // Estimate bandwidth based on connection type if available
    let bandwidth = 1000; // Default: 1 Mbps
    
    if (effectiveType === 'slow-2g') bandwidth = 100;
    else if (effectiveType === '2g') bandwidth = 300;
    else if (effectiveType === '3g') bandwidth = 1500;
    else if (effectiveType === '4g') bandwidth = 5000;
    else if (effectiveType === '5g') bandwidth = 20000;
    
    // Adjust based on RTT - higher RTT usually means lower bandwidth
    if (rtt > 200) bandwidth = Math.min(bandwidth, 2000);
    if (rtt > 500) bandwidth = Math.min(bandwidth, 800);
    if (rtt > 1000) bandwidth = Math.min(bandwidth, 400);
    
    return {
      bandwidth,
      rtt,
      connectionType,
      effectiveType
    };
  } catch (e) {
    console.error('Network measurement error:', e);
    return {
      bandwidth: 1000, // Fallback default
      rtt: 100,
      connectionType,
      effectiveType
    };
  }
}

/**
 * Select the optimal source based on network conditions
 */
export async function selectOptimalSource(
  sources: StreamSource[],
  preferredQuality?: QualityLevel,
  networkStats?: { bandwidth: number }
): Promise<{ 
  source: StreamSource, 
  recommendedQuality: QualityLevel
}> {
  // Sort sources by priority first (lower is better)
  const sortedSources = [...sources].sort((a, b) => a.priority - b.priority);
  
  // If no network stats provided, measure them
  const stats = networkStats || await measureNetworkConditions();
  const bandwidth = stats.bandwidth; // in kbps
  
  // If user has set a preferred quality, try to honor it
  let targetResolution: string | undefined;
  if (preferredQuality && preferredQuality !== 'auto') {
    targetResolution = preferredQuality;
  } else {
    // Select quality based on bandwidth
    if (bandwidth >= 5000) targetResolution = '1080p';
    else if (bandwidth >= 2500) targetResolution = '720p';
    else if (bandwidth >= 1000) targetResolution = '480p';
    else if (bandwidth >= 500) targetResolution = '360p';
    else targetResolution = '240p';
  }
  
  // Find source with matching or closest resolution
  const sourceWithMatchingResolution = sortedSources.find(
    s => s.resolution === targetResolution
  );
  
  if (sourceWithMatchingResolution) {
    return { 
      source: sourceWithMatchingResolution, 
      recommendedQuality: targetResolution as QualityLevel 
    };
  }
  
  // If no exact match, use the source with the closest bandwidth requirement
  const sourcesByBandwidth = sortedSources.filter(s => s.bandwidth);
  if (sourcesByBandwidth.length > 0) {
    sourcesByBandwidth.sort((a, b) => {
      const aDiff = Math.abs((a.bandwidth || 0) - bandwidth);
      const bDiff = Math.abs((b.bandwidth || 0) - bandwidth);
      return aDiff - bDiff;
    });
    
    const closestSource = sourcesByBandwidth[0];
    
    // Determine the recommended quality
    let recommendedQuality: QualityLevel = 'auto';
    if (closestSource.resolution) {
      recommendedQuality = closestSource.resolution as QualityLevel;
    } else if (closestSource.bandwidth) {
      // Estimate quality from bandwidth
      if (closestSource.bandwidth >= 5000) recommendedQuality = '1080p';
      else if (closestSource.bandwidth >= 2500) recommendedQuality = '720p';
      else if (closestSource.bandwidth >= 1000) recommendedQuality = '480p';
      else if (closestSource.bandwidth >= 500) recommendedQuality = '360p';
      else recommendedQuality = '240p';
    }
    
    return { source: closestSource, recommendedQuality };
  }
  
  // Default to first source by priority if no better match
  return { 
    source: sortedSources[0], 
    recommendedQuality: 'auto' 
  };
}

/**
 * Record HLS quality metrics for analytics
 */
export function recordStreamQualityMetrics(hls: Hls, contentType: string, contentId: number): void {
  if (!hls) return;
  
  // Setup quality change monitoring
  hls.on(Hls.Events.LEVEL_SWITCHED, async (_, data) => {
    const newLevel = data.level;
    const quality = hls.levels[newLevel]?.height ? `${hls.levels[newLevel].height}p` : 'unknown';
    const bandwidth = Math.round(hls.bandwidthEstimate / 1000); // in kbps
    
    // Send quality change analytics event
    try {
      await fetch('/api/analytics/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentType,
          contentId,
          event: 'quality_change',
          quality,
          bandwidth
        })
      });
    } catch (e) {
      console.error('Failed to record quality metrics:', e);
    }
  });
  
  // Monitor for buffering events
  hls.on(Hls.Events.BUFFER_STALLING, async () => {
    try {
      await fetch('/api/analytics/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentType,
          contentId,
          event: 'buffering',
          bufferingDuration: 0, // Will be updated when buffering ends
          quality: hls.currentLevel === -1 ? 'auto' : 
            hls.levels[hls.currentLevel]?.height ? 
            `${hls.levels[hls.currentLevel].height}p` : 'unknown',
          bandwidth: Math.round(hls.bandwidthEstimate / 1000)
        })
      });
    } catch (e) {
      console.error('Failed to record buffering start:', e);
    }
  });
}