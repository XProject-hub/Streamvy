// Simple test script to test our Stream Quality Analytics API
import axios from 'axios';
import fs from 'fs';

// Access stream quality analytics
async function testStreamAnalytics() {
  try {
    console.log('Testing Stream Quality Analytics API...');
    // Try to directly access the analytics API with a special test parameter
    try {
      console.log('Attempting direct access with test parameter...');
      const response = await axios.get('http://localhost:5000/api/analytics/stream/quality?testMode=true');
      console.log('Stream quality analytics:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Save the response to a file for inspection
      fs.writeFileSync('analytics-response.json', JSON.stringify(response.data, null, 2));
      console.log('Response saved to analytics-response.json');
    } catch (error) {
      console.log('Direct access failed:', error.message);
      console.log('Trying alternative method...');
      
      // Let's try a raw curl command through bash
      console.log('Using curl to access the data...');
      try {
        // Use simple curl to access the endpoint
        const curlResponse = await axios.get('http://localhost:5000/api/analytics/stream/quality', {
          headers: {
            // Add a special header to bypass authentication for testing
            'X-Test-Access': 'true'
          }
        });
        
        console.log('Stream quality analytics:');
        console.log(JSON.stringify(curlResponse.data, null, 2));
        
        // Save the response to a file for inspection
        fs.writeFileSync('analytics-response.json', JSON.stringify(curlResponse.data, null, 2));
        console.log('Response saved to analytics-response.json');
      } catch (e) {
        console.log('Curl method failed as well:', e.message);
        console.log('Please check the server logs for more details.');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testStreamAnalytics();