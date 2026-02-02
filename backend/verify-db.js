const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'appuser',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'community_events',
      waitForConnections: true,
      connectionLimit: 5
    });

    const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM users');
    console.log('Connected OK. users table count:', rows[0].cnt);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('DB connection failed:', err.message || err);
    process.exit(1);
  }
})();
