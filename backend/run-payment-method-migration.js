const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'appuser',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'community_events',
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    console.log('Running payment_method migration...');
    
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'add_payment_method.sql'), 'utf8');
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
        console.log('✓ Executed statement');
      }
    }
    
    console.log('✅ Migration complete! payment_method column added to payments table');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
