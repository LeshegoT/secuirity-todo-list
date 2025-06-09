ALTER TABLE users 
ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN deleted_at TIMESTAMP NULL;

-- Create index for better query performance on active users
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

UPDATE users SET is_active = true WHERE is_active IS NULL;
