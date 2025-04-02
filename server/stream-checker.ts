import axios from 'axios';
import { Channel, StreamSource } from '@shared/schema';
import { storage } from './storage';

// Time in milliseconds between stream status checks
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Stored timeout ID for the interval
let checkIntervalId: NodeJS.Timeout | null = null;

/**
 * Checks if a stream URL is accessible
 * @param url The stream URL to check
 * @param format The format of the stream ('hls', 'mp4', etc.)
 * @returns Promise resolving to true if accessible, false otherwise
 */
export async function checkStreamStatus(url: string, format: string): Promise<boolean> {
  try {
    // Different check methods based on stream format
    if (format === 'hls') {
      // For HLS streams, attempt to get the m3u8 manifest
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Check that the response looks like an HLS manifest
      return response.status === 200 && 
             response.data && 
             typeof response.data === 'string' && 
             (response.data.includes('#EXTM3U') || response.data.includes('#EXT-X-VERSION'));
    } else {
      // For other formats (like MP4), just check if we can access the header
      const response = await axios.head(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Check that the response is OK and has the right content type
      return response.status === 200;
    }
  } catch (error) {
    console.error(`Error checking stream URL ${url}:`, error);
    return false;
  }
}

/**
 * Checks a channel's streams and updates its status in the database
 * @param channel The channel to check
 * @returns Promise resolving to the updated status
 */
export async function checkAndUpdateChannelStatus(channel: Channel): Promise<string> {
  if (!channel.streamSources || !Array.isArray(channel.streamSources)) {
    console.error(`Channel ${channel.id} has invalid streamSources:`, channel.streamSources);
    
    // Update channel status to offline
    await storage.updateChannel(channel.id, {
      status: 'offline',
      lastChecked: new Date()
    });
    
    return 'offline';
  }
  
  const sources = channel.streamSources as StreamSource[];
  
  // Sort sources by priority (lower numbers first)
  const sortedSources = [...sources].sort((a, b) => a.priority - b.priority);
  
  // Try checking each source until one works
  for (const source of sortedSources) {
    const isOnline = await checkStreamStatus(source.url, source.format);
    
    if (isOnline) {
      // Update channel status to online
      await storage.updateChannel(channel.id, {
        status: 'online',
        lastChecked: new Date()
      });
      
      return 'online';
    }
  }
  
  // If we get here, no sources are online
  await storage.updateChannel(channel.id, {
    status: 'offline',
    lastChecked: new Date()
  });
  
  return 'offline';
}

/**
 * Checks all channels and updates their status
 */
export async function checkAllChannels(): Promise<void> {
  try {
    // Get all channels
    const channels = await storage.getChannels();
    console.log(`Checking status for ${channels.length} channels...`);
    
    // Process channels in batches to avoid overwhelming the system
    const batchSize = 5;
    
    for (let i = 0; i < channels.length; i += batchSize) {
      const batch = channels.slice(i, i + batchSize);
      
      // Process this batch in parallel
      await Promise.all(
        batch.map(async (channel) => {
          const status = await checkAndUpdateChannelStatus(channel);
          console.log(`Channel ${channel.name} (ID: ${channel.id}) status: ${status}`);
        })
      );
      
      // Small delay between batches
      if (i + batchSize < channels.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('Finished checking all channel statuses');
  } catch (error) {
    console.error('Error checking all channels:', error);
  }
}

/**
 * Starts the periodic stream status checker
 */
export function startStreamChecker(): void {
  // Stop any existing interval
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
  }
  
  // Run an initial check right away
  checkAllChannels();
  
  // Set up periodic checking
  checkIntervalId = setInterval(checkAllChannels, CHECK_INTERVAL_MS);
  
  console.log(`Stream checker started, will check every ${CHECK_INTERVAL_MS / 60000} minutes`);
}

/**
 * Stops the periodic stream status checker
 */
export function stopStreamChecker(): void {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
    console.log('Stream checker stopped');
  }
}