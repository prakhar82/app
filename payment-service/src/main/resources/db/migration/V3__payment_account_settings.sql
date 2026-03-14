CREATE TABLE IF NOT EXISTS payment_account_settings (
    id BIGINT PRIMARY KEY,
    account_holder_name VARCHAR(160),
    iban VARCHAR(64),
    bank_name VARCHAR(120),
    payment_reference VARCHAR(120),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO payment_account_settings (id, account_holder_name, iban, bank_name, payment_reference)
VALUES (1, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
