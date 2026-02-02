const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306
};

async function createEventsTable() {
  let connection;
  try {
    // Connect to MySQL server
    connection = await mysql.createConnection(config);
    console.log('Connected to MySQL server');

    // Use the database
    await connection.query('USE community_events');
    console.log('Using community_events database');

    // Create events table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS events (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        event_name VARCHAR(255) NOT NULL,
        event_category VARCHAR(50) NOT NULL,
        event_date DATE NOT NULL,
        event_time TIME NOT NULL,
        location VARCHAR(255) NOT NULL,
        ticket_price DECIMAL(10, 2) NOT NULL,
        capacity INT NOT NULL,
        photo_url VARCHAR(500),
        organizer_id BIGINT NOT NULL,
        booked INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await connection.query(createTableQuery);
    console.log('Events table created successfully');

    // Create indexes
    await connection.query('CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id)');
    await connection.query('CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date)');
    await connection.query('CREATE INDEX IF NOT EXISTS idx_events_category ON events(event_category)');
    console.log('Indexes created successfully');

  } catch (error) {
    console.error('Error creating events table:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

createEventsTable();
