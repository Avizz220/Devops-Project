-- Manual DB + users table creation for backend
-- Run this as an admin user (e.g., root) or let the accompanying init-db.ps1 run it and prompt for root password.

CREATE DATABASE IF NOT EXISTS `community_events` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `community_events`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create an application DB user that uses mysql_native_password (recommended)
-- Replace 'StrongPasswordHere' with a secure password before running, or run via the PowerShell script which will prompt you.
CREATE USER IF NOT EXISTS 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'StrongPasswordHere';
GRANT ALL PRIVILEGES ON `community_events`.* TO 'appuser'@'localhost';
FLUSH PRIVILEGES;

-- Optional: If you need to create the DB user for remote access, adjust the host part (e.g., 'appuser'@'%') and secure accordingly.
