import fetch from 'node-fetch';

/**
 * Test specific streaming analytics features such as buffering detection,
 * quality switching, and bandwidth adaptation
 */
async function testStreamAnalytics() {
  try {
    console.log('Starting streaming analytics test simulation...');
    
    // Simulate a typical streaming session with various events
    
    // 1. User starts stream
    console.log('Simulating stream start...');
    await recordAnalyticsEvent({
      contentType: 'channel',
      contentId: 10,
      event: 'start',
      quality: '720p', 
      bandwidth: 2800000
    });
    
    // 2. Measure initial bandwidth
    console.log('Measuring initial bandwidth...');
    await recordAnalyticsEvent({
      contentType: 'channel',
      contentId: 10,
      event: 'bandwidth_change',
      bandwidth: 3200000
    });
    
    // 3. Network deteriorates, causing buffering
    console.log('Simulating network deterioration with buffering...');
    await recordAnalyticsEvent({
      contentType: 'channel',
      contentId: 10,
      event: 'buffering',
      bufferingDuration: 2800 // 2.8 seconds of buffering
    });
    
    // 4. Quality downgrade to prevent further buffering
    console.log('Simulating quality downgrade...');
    await recordAnalyticsEvent({
      contentType: 'channel',
      contentId: 10,
      event: 'quality_change',
      quality: '480p',
      bandwidth: 1500000
    });
    
    // 5. Bandwidth stabilizes at lower level
    console.log('Simulating bandwidth stabilization...');
    await recordAnalyticsEvent({
      contentType: 'channel',
      contentId: 10,
      event: 'bandwidth_change',
      bandwidth: 1800000
    });
    
    // 6. Stream continues at lower quality without issues
    console.log('Simulating stable streaming...');
    
    // 7. Network improves
    console.log('Simulating network improvement...');
    await recordAnalyticsEvent({
      contentType: 'channel',
      contentId: 10,
      event: 'bandwidth_change',
      bandwidth: 4500000
    });
    
    // 8. Quality upgrade
    console.log('Simulating quality upgrade...');
    await recordAnalyticsEvent({
      contentType: 'channel',
      contentId: 10,
      event: 'quality_change',
      quality: '1080p',
      bandwidth: 4200000
    });
    
    // 9. Stream error occurs
    console.log('Simulating stream error...');
    await recordAnalyticsEvent({
      contentType: 'channel',
      contentId: 10,
      event: 'error',
      error: 'Failed to load segment: HTTP 404'
    });
    
    // 10. Stream recovers
    console.log('Simulating stream recovery...');
    await recordAnalyticsEvent({
      contentType: 'channel',
      contentId: 10,
      event: 'quality_change',
      quality: '720p',
      bandwidth: 3000000
    });
    
    // 11. User watches for a while then stops the stream
    console.log('Simulating stream stop after viewing...');
    await recordAnalyticsEvent({
      contentType: 'channel',
      contentId: 10,
      event: 'stop',
      duration: 450 // 7.5 minutes
    });
    
    console.log('All events simulated. Retrieving analytics report...');
    
    // Get streaming quality analytics report
    const response = await fetch('https://workspace.unablexc.repl.co/api/analytics/stream/quality?testMode=true');
    
    if (!response.ok) {
      throw new Error(`Failed to get analytics: ${response.status} ${response.statusText}`);
    }
    
    const analyticsData = await response.json();
    
    // Print analytics report
    console.log('\n=== STREAMING QUALITY ANALYTICS REPORT ===\n');
    console.log(`Average Bandwidth: ${formatBandwidth(analyticsData.averageBandwidth)}`);
    console.log(`Most Used Quality: ${analyticsData.mostUsedQuality || 'None'}`);
    console.log(`Error Rate: ${(analyticsData.errorRate * 100).toFixed(1)}%`);
    console.log(`Buffering Rate: ${(analyticsData.bufferingRate * 100).toFixed(1)}%`);
    
    console.log('\nQuality Changes:');
    analyticsData.quality.forEach(event => {
      console.log(`- ${new Date(event.timestamp).toLocaleTimeString()}: Changed to ${event.quality} at ${formatBandwidth(event.bandwidth)}`);
    });
    
    console.log('\nBuffering Events:');
    analyticsData.buffering.forEach(event => {
      console.log(`- ${new Date(event.timestamp).toLocaleTimeString()}: Buffered for ${event.duration}ms`);
    });
    
    console.log('\nError Events:');
    analyticsData.errors.forEach(event => {
      console.log(`- ${new Date(event.timestamp).toLocaleTimeString()}: ${event.error}`);
    });
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error during streaming analytics test:', error);
  }
}

// Helper function to format bandwidth
function formatBandwidth(bps) {
  if (!bps) return 'N/A';
  if (bps >= 1000000) {
    return `${(bps / 1000000).toFixed(1)} Mbps`;
  } else {
    return `${(bps / 1000).toFixed(1)} Kbps`;
  }
}

// Helper function to record an analytics event
async function recordAnalyticsEvent(data) {
  try {
    const response = await fetch('https://workspace.unablexc.repl.co/api/analytics/stream?testMode=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to record analytics: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error recording analytics event ${data.event}:`, error);
    throw error;
  }
}

// Run the test
testStreamAnalytics();