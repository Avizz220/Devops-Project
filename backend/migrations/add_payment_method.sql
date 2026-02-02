-- Add payment_method column to payments table
ALTER TABLE payments 
ADD COLUMN payment_method ENUM('bank', 'card') NOT NULL DEFAULT 'bank' 
AFTER payment_status;

-- Add index for payment_method for faster queries
CREATE INDEX idx_payment_method ON payments(payment_method);
