ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_reset_code_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS password_reset_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS password_reset_last_sent_at TIMESTAMPTZ;
