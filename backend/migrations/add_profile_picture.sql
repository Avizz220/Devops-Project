-- Add profile_picture column to users table
USE community_events;

ALTER TABLE users 
ADD COLUMN profile_picture VARCHAR(500) DEFAULT NULL AFTER password;
