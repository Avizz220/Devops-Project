const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Running user_interests table migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_user_interests.sql'),
      'utf8'
    );
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      await pool.query(statement);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 user_interests table created with the following structure:');
    console.log('   - id (Primary Key)');
    console.log('   - user_id (Foreign Key to users)');
    console.log('   - event_id (Foreign Key to events)');
    console.log('   - interest_level (interested, not_interested, going)');
    console.log('   - created_at, updated_at timestamps');
    console.log('   - Unique constraint on (user_id, event_id)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
