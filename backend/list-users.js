const { pool } = require('./db');
require('dotenv').config();

(async () => {
  try {
    console.log('Connecting to database...');
    const [rows] = await pool.query('SELECT id, name, email, password, role, created_at FROM users');
    
    if (rows.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log('Found', rows.length, 'users:');
      console.table(rows);
    }
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    process.exit(1);
  }
})();