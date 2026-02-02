require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'community_events',
  };

  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      multipleStatements: true
    });

    const sql = fs.readFileSync('./create_users.sql', 'utf8');
    await connection.query(sql);
    console.log('Database and users table created (or already exist).');
    await connection.end();
  } catch (err) {
    console.error('Failed to create DB/table:', err.message || err);
    process.exit(1);
  }
})();
