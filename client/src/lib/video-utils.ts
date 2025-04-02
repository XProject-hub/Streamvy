/**
 * Tests if a stream URL is available and can be accessed
 * @param url The URL of the stream to test
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise resolving to boolean indicating if source is available
 */
export async function testStreamSource(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    // Create an AbortController to handle timeouts manually
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      // For HLS (.m3u8) streams, we attempt to fetch the manifest
      if (url.includes('.m3u8')) {
        const response = await fetch(url, { 
          method: 'HEAD', 
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response.ok;
      } 
      // For MPEG-TS streams
      else if (url.includes('.ts')) {
        const response = await fetch(url, { 
          method: 'HEAD', 
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response.ok;
      }
      // For MP4 and other direct video files, we check if the resource exists
      // and supports range requests (common for video streaming)
      else {
        const response = await fetch(url, { 
          method: 'HEAD',
          headers: {
            'Range': 'bytes=0-0' // Request just the first byte to test range support
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response.ok && (
          response.headers.has('Content-Range') || 
          response.headers.has('Accept-Ranges')
        );
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn('Stream source test timed out:', url);
        return false;
      }
      throw error; // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error('Error testing stream source:', error);
    return false;
  }
}

/**
 * Interface for bandwidth test result
 */
export interface BandwidthTestResult {
  quality: 'auto' | 'high' | 'medium' | 'low';
  kbps: number;
  rtt: number;  // Round-trip time in ms
}

/**
 * Helper to determine optimal video quality based on connection speed
 * @param sampleSize Number of test samples to average (default 3)
 * @param testFileSize Size of test file to use for bandwidth assessment (default 128KB)
 * @returns Promise resolving to recommended video quality and connection metrics
 */
export async function getOptimalVideoQuality(
  sampleSize: number = 3,
  testFileSize: number = 128
): Promise<BandwidthTestResult> {
  // Default result if tests fail
  const defaultResult: BandwidthTestResult = {
    quality: 'auto',
    kbps: 0,
    rtt: 0
  };

  try {
    // First measure RTT with a small request
    const rttStartTime = Date.now();
    let rttResponse;
    try {
      rttResponse = await fetch('https://www.google.com/images/phd/px.gif', { 
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors',
        // Add random query param to bypass cache
        headers: { 'Cache-Control': 'no-cache, no-store' }
      });
      
      if (!rttResponse.ok) return defaultResult;
    } catch (error) {
      console.error('RTT test failed:', error);
      return defaultResult;
    }
    
    const rtt = Date.now() - rttStartTime;
    
    // Then test bandwidth with a larger file
    // Run multiple samples and average the results
    let totalKbps = 0;
    let successfulTests = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      try {
        // Use a timestamp to prevent caching
        const testUrl = `https://cors-anywhere.herokuapp.com/https://speed.cloudflare.com/__down?bytes=${testFileSize * 1024}&ts=${Date.now()}`;
        
        const startTime = Date.now();
        const response = await fetch(testUrl, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        });
        
        if (!response.ok) continue;
        
        const data = await response.blob();
        const endTime = Date.now();
        const durationSec = (endTime - startTime) / 1000;
        
        // Calculate Kbps
        const fileSizeKb = data.size / 1024;
        const kbps = Math.round(fileSizeKb / durationSec);
        
        totalKbps += kbps;
        successfulTests++;
      } catch (error) {
        console.warn(`Bandwidth test ${i+1}/${sampleSize} failed:`, error);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Calculate average Kbps if we have successful tests
    const avgKbps = successfulTests > 0 ? Math.round(totalKbps / successfulTests) : 0;
    
    // Fall back to RTT-based estimation if bandwidth test failed
    if (avgKbps === 0) {
      // Estimate quality based on RTT
      let quality: 'auto' | 'high' | 'medium' | 'low' = 'auto';
      
      if (rtt < 50) quality = 'high';
      else if (rtt < 200) quality = 'medium';
      else quality = 'low';
      
      return { quality, kbps: 0, rtt };
    }
    
    // Determine quality based on bandwidth
    // These thresholds are based on common video bitrates:
    // - 4K: ~15-20 Mbps (15000-20000 Kbps)
    // - 1080p: ~5-8 Mbps (5000-8000 Kbps)
    // - 720p: ~2.5-4 Mbps (2500-4000 Kbps)
    // - 480p: ~1-2 Mbps (1000-2000 Kbps)
    let quality: 'auto' | 'high' | 'medium' | 'low' = 'auto';
    
    if (avgKbps > 5000) quality = 'high';       // 1080p or better
    else if (avgKbps > 2000) quality = 'medium'; // 720p
    else quality = 'low';                        // 480p or lower
    
    return {
      quality,
      kbps: avgKbps,
      rtt
    };
  } catch (error) {
    console.error('Error determining optimal video quality:', error);
    return defaultResult;
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
