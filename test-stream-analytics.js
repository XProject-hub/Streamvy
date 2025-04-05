// Simple test script to test our Stream Quality Analytics API
import axios from 'axios';
import fs from 'fs';

// First, log in to get a session cookie
async function testStreamAnalytics() {
  try {
    console.log('Logging in...');
    // For testing purposes, let's create a direct curl command through bash to test the API without authentication
    console.log('Attempting to access API directly...');
    let analyticsResponse;
    
    try {
      analyticsResponse = await axios.get('http://localhost:5000/api/analytics/stream/quality?testAccess=true');
      
      if (analyticsResponse.data) {
        console.log('Successfully accessed the API directly!');
        console.log('Stream quality analytics:');
        console.log(JSON.stringify(analyticsResponse.data, null, 2));
        
        // Save the response to a file for inspection
        fs.writeFileSync('analytics-response.json', JSON.stringify(analyticsResponse.data, null, 2));
        console.log('Response saved to analytics-response.json');
        return;
      }
    } catch (error) {
      console.log('Direct access failed, trying with login...');
    }
    
    // If direct access fails, try with login
    const loginResponse = await axios.post('http://localhost:5000/api/login', {
      username: 'admin',
      password: 'password' // Try with the default password
    }, {
      withCredentials: true
    });
    
    console.log('Login response:', loginResponse.data);
    
    // Get the session cookie for future requests
    const cookies = loginResponse.headers['set-cookie'];
    
    // Now, make a request to the stream analytics endpoint with the session cookie
    console.log('Getting stream quality analytics...');
    analyticsResponse = await axios.get('http://localhost:5000/api/analytics/stream/quality', {
      headers: {
        Cookie: cookies
      }
    });
    
    console.log('Stream quality analytics:');
    console.log(JSON.stringify(analyticsResponse.data, null, 2));
    
    // Save the response to a file for inspection
    fs.writeFileSync('analytics-response.json', JSON.stringify(analyticsResponse.data, null, 2));
    console.log('Response saved to analytics-response.json');
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testStreamAnalytics();