// Test script to verify the API endpoint
const API_BASE_URL = 'http://localhost:4000';

async function testEventsFetch() {
  console.log('Testing event fetch for all users...\n');
  
  // Test for each user ID from 1 to 7
  for (let userId = 1; userId <= 7; userId++) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/user/${userId}`);
      const events = await response.json();
      
      console.log(`User ID ${userId}: ${events.length} event(s)`);
      if (events.length > 0) {
        events.forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.event_name} - ${event.event_category}`);
        });
      }
      console.log('');
    } catch (error) {
      console.error(`Error fetching events for user ${userId}:`, error.message);
    }
  }
}

testEventsFetch();
