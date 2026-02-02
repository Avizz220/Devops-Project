const { pool } = require('./db');

async function checkEvents() {
  try {
    const [rows] = await pool.query('SELECT * FROM events');
    console.log(`Total events in database: ${rows.length}`);
    
    if (rows.length > 0) {
      console.log('\nEvents found:');
      rows.forEach((event, index) => {
        console.log(`\n${index + 1}. ${event.event_name}`);
        console.log(`   Category: ${event.event_category}`);
        console.log(`   Date: ${event.event_date}`);
        console.log(`   Organizer ID: ${event.organizer_id}`);
        console.log(`   Photo: ${event.photo_url || 'No photo'}`);
      });
    } else {
      console.log('\nNo events found in database!');
    }
    
    // Also check users
    const [users] = await pool.query('SELECT id, name, email FROM users');
    console.log(`\n\nTotal users in database: ${users.length}`);
    if (users.length > 0) {
      console.log('\nUsers:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking events:', error);
    process.exit(1);
  }
}

checkEvents();
