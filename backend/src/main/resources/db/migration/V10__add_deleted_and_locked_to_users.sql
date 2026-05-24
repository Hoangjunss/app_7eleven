-- V10__add_deleted_and_locked_to_users.sql
-- Drop the old deleted_at index first
DROP INDEX IF EXISTS idx_users_deleted_at;

-- Add deleted and locked columns
ALTER TABLE users ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN locked BOOLEAN NOT NULL DEFAULT FALSE;

-- Migrate existing locked users (previously marked as deleted_at IS NOT NULL)
UPDATE users SET locked = TRUE WHERE deleted_at IS NOT NULL;

-- Drop the old deleted_at column
ALTER TABLE users DROP COLUMN deleted_at;

-- Create new indexes for performance optimization
CREATE INDEX idx_users_deleted ON users(deleted);
CREATE INDEX idx_users_locked ON users(locked);
