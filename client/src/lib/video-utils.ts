/**
 * Tests if a stream URL is available and can be accessed
 * @param url The URL of the stream to test
 * @returns Promise resolving to boolean indicating if source is available
 */
export async function testStreamSource(url: string): Promise<boolean> {
  try {
    // For HLS (.m3u8) streams, we attempt to fetch the manifest
    if (url.includes('.m3u8')) {
      const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
      return response.ok;
    }
    
    // For MP4 and other direct video files, we check if the resource exists
    // and supports range requests (common for video streaming)
    else {
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 5000
      });
      
      return response.ok && (
        response.headers.has('Content-Range') || 
        response.headers.has('Accept-Ranges')
      );
    }
  } catch (error) {
    console.error('Error testing stream source:', error);
    return false;
  }
}

/**
 * Helper to determine optimal video quality based on connection speed
 * @returns Promise resolving to recommended video quality
 */
export async function getOptimalVideoQuality(): Promise<'auto' | 'high' | 'medium' | 'low'> {
  try {
    // Test connection speed by downloading a small test file
    const startTime = Date.now();
    const response = await fetch('https://www.google.com/images/phd/px.gif', { 
      cache: 'no-store',
      mode: 'no-cors'
    });
    
    if (!response.ok) return 'auto';
    
    await response.blob();
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    
    // Simple speed estimation based on response time
    if (durationMs < 100) return 'high';  // Fast connection
    if (durationMs < 500) return 'medium'; // Medium connection
    return 'low'; // Slow connection
  } catch (error) {
    console.error('Error determining optimal video quality:', error);
    return 'auto'; // Default to auto if there's an error
  }
}

/**
 * Format seconds into a readable time string
 * @param seconds Number of seconds
 * @returns Formatted time string (e.g., "1:23:45")
 */
export function formatTimeFromSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  return [
    h > 0 ? h : null,
    h > 0 ? m.toString().padStart(2, '0') : m,
    s.toString().padStart(2, '0')
  ].filter(Boolean).join(':');
}

/**
 * Create a thumbnail URL from a video source for preview purposes
 * Note: This is a fallback for services that don't provide thumbnails
 * @param videoUrl The video URL
 * @returns A thumbnail URL or placeholder
 */
export function generateThumbnailUrl(videoUrl: string): string {
  // In a real implementation, you might use a video thumbnail service
  // or generate thumbnails server-side
  return 'https://via.placeholder.com/640x360?text=Video+Preview';
}
