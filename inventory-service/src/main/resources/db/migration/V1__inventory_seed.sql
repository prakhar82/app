CREATE TABLE IF NOT EXISTS inventory (
  id BIGSERIAL PRIMARY KEY,
  sku VARCHAR(128) NOT NULL UNIQUE,
  product_name VARCHAR(255) NOT NULL,
  total_qty INT NOT NULL,
  reserved_qty INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_reservations (
  id BIGSERIAL PRIMARY KEY,
  order_ref VARCHAR(128) NOT NULL,
  sku VARCHAR(128) NOT NULL,
  quantity INT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL
);

INSERT INTO inventory(sku, product_name, total_qty, reserved_qty)
VALUES
('SKU-ORANGE','Orange',120,0),
('SKU-APPLE','Apple',100,0),
('SKU-STRAW','Strawberry',60,0),
('SKU-SPINACH','Spinach',80,0),
('SKU-MILK1L','Milk 1L',200,0),
('SKU-CHED200','Cheddar 200g',75,0)
ON CONFLICT (sku) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  total_qty = EXCLUDED.total_qty;
