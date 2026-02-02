-- Run this SQL file as root or an admin user to fix authentication plugin issues

-- Option 1: Modify appuser to use mysql_native_password
ALTER USER 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'StrongPasswordHere';
FLUSH PRIVILEGES;

-- Option 2: Create a new user if Option 1 fails
CREATE USER IF NOT EXISTS 'nodeapp'@'localhost' IDENTIFIED WITH mysql_native_password BY 'SecurePassword123';
GRANT ALL PRIVILEGES ON `community_events`.* TO 'nodeapp'@'localhost';
FLUSH PRIVILEGES;

-- Note: After running Option 2, update your .env file with:
-- DB_USER=nodeapp
-- DB_PASSWORD=SecurePassword123
