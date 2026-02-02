const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Running payments table migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_payments.sql'),
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
    console.log('📊 payments table created with the following structure:');
    console.log('   - id (Primary Key)');
    console.log('   - user_id (Foreign Key to users)');
    console.log('   - event_id (Foreign Key to events)');
    console.log('   - account_number, account_name, bank_name');
    console.log('   - reference_number (transaction reference)');
    console.log('   - amount (payment amount)');
    console.log('   - payment_status (pending, verified, rejected)');
    console.log('   - payment_date, verified_at timestamps');
    console.log('   - Unique constraint on (user_id, event_id, reference_number)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
