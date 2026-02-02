const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'community_events'
};

async function initDB() {
  // Retry connection up to 30 times with 2 second delay
  let connection;
  for (let i = 0; i < 30; i++) {
    try {
      connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        multipleStatements: true,
      });
      console.log('✅ Database connection established');
      break;
    } catch (err) {
      console.log(`⏳ Waiting for database... attempt ${i + 1}/30`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (i === 29) throw err;
    }
  }

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${config.database}\`;`);
    console.log('✅ Database selected:', config.database);

    const createTables = `
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      profile_picture VARCHAR(500) DEFAULT NULL,
      role VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

    CREATE TABLE IF NOT EXISTS user_interests (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      event_id BIGINT NOT NULL,
      interest_level ENUM('interested', 'not_interested', 'going') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_event (user_id, event_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS payments (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      event_id BIGINT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      payment_method VARCHAR(50),
      payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
      transaction_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(createTables);
    console.log('✅ All tables created successfully');
    
    await connection.end();
    console.log('✅ Database initialization complete!');
    return true;
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    console.error('Stack:', err.stack);
    return false;
  }
}

const pool = mysql.createPool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = { initDB, pool, config };
