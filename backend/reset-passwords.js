const { pool } = require('./db');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetPassword(email, newPassword) {
  try {
    console.log(`Resetting password for ${email}...`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE email = ?', 
      [hashedPassword, email]
    );
    
    if (result.affectedRows === 0) {
      console.log(`User with email ${email} not found`);
      return false;
    }
    
    console.log(`Password reset successful for ${email}`);
    return true;
  } catch (error) {
    console.error(`Error resetting password for ${email}:`, error.message);
    return false;
  }
}

// Reset passwords for our test users
async function resetAllPasswords() {
  const users = [
    { email: 'ahirushan629@gmail.com', password: 'password123' },
    { email: 'Nisal@gmail.com', password: 'password123' }
  ];
  
  console.log('Starting password reset for all users...');
  
  for (const user of users) {
    await resetPassword(user.email, user.password);
  }
  
  console.log('Password reset complete.');
  
  // Close the database connection when done
  await pool.end();
  process.exit(0);
}

resetAllPasswords().catch(err => {
  console.error('Failed to reset passwords:', err);
  process.exit(1);
});