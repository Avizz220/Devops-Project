const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'community_events'
};

async function runMigration() {
  try {
    const connection = await mysql.createConnection(config);
    
    console.log('Connected to database. Running migration...');
    
    // Add profile_picture column
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500) DEFAULT NULL AFTER password
    `);
    
    console.log('✅ Migration complete! profile_picture column added to users table.');
    
    await connection.end();
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

runMigration();
