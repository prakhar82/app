CREATE TABLE IF NOT EXISTS order_delivery_address (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id),
    recipient_name VARCHAR(120),
    line1 VARCHAR(200) NOT NULL,
    line2 VARCHAR(200),
    city VARCHAR(80) NOT NULL,
    postcode VARCHAR(12) NOT NULL,
    country VARCHAR(2) NOT NULL,
    snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_delivery_order_id ON order_delivery_address(order_id);
