-- create_users.sql
-- Run this in your MySQL client if automatic creation failed.

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
