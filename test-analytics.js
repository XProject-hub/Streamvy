const fetch = require('node-fetch');

async function testStreamAnalytics() {
  try {
    console.log('Starting test for stream analytics API...');
    
    // First, let's add some test analytics data
    for (let i = 0; i < 10; i++) {
      // Create stream start event
      await recordAnalytics({
        contentType: 'channel',
        contentId: 10,
        event: 'start',
        quality: '720p',
        bandwidth: 2500000 + Math.floor(Math.random() * 1000000) // Random bandwidth around 2.5Mbps
      });
      
      // Add some quality change events
      if (i % 3 === 0) {
        await recordAnalytics({
          contentType: 'channel',
          contentId: 10,
          event: 'quality_change',
          quality: '480p',
          bandwidth: 1500000 + Math.floor(Math.random() * 500000)
        });
      }
      
      // Add a bandwidth change event
      if (i % 2 === 0) {
        await recordAnalytics({
          contentType: 'channel',
          contentId: 10,
          event: 'bandwidth_change',
          bandwidth: 1800000 + Math.floor(Math.random() * 700000)
        });
      }
      
      // Add some buffering events
      if (i % 4 === 0) {
        await recordAnalytics({
          contentType: 'channel',
          contentId: 10,
          event: 'buffering',
          bufferingDuration: 1500 + Math.floor(Math.random() * 3000) // 1.5-4.5 seconds
        });
      }
      
      // Add some error events
      if (i === 7) {
        await recordAnalytics({
          contentType: 'channel',
          contentId: 10,
          event: 'error',
          error: 'Network connection lost'
        });
      }
      
      // Add stream stop event for some sessions
      if (i % 3 === 0 || i === 9) {
        await recordAnalytics({
          contentType: 'channel',
          contentId: 10,
          event: 'stop',
          duration: 180 + Math.floor(Math.random() * 600) // 3-13 minutes
        });
      }
    }
    
    console.log('Test data added successfully. Fetching analytics...');
    
    // Now fetch the analytics data
    const analyticsResponse = await fetch('http://localhost:3000/api/analytics/stream/quality?testMode=true');
    
    if (!analyticsResponse.ok) {
      throw new Error(`Failed to fetch analytics: ${analyticsResponse.status} ${analyticsResponse.statusText}`);
    }
    
    const analyticsData = await analyticsResponse.json();
    
    // Display the analytics data
    console.log('Stream Quality Analytics:');
    console.log(JSON.stringify(analyticsData, null, 2));
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during analytics test:', error);
  }
}

async function recordAnalytics(data) {
  try {
    const response = await fetch('http://localhost:3000/api/analytics/stream?testMode=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Access': 'true'
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

testStreamAnalytics();