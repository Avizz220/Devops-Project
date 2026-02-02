-- Migration: Add payments table to track event ticket payments
USE community_events;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  reference_number VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  payment_date DATETIME NOT NULL,
  verified_at DATETIME NULL,
  verified_by BIGINT NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE KEY unique_payment (user_id, event_id, reference_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create indexes for better performance
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_event ON payments(event_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_reference ON payments(reference_number);
