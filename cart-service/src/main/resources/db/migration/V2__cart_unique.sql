CREATE UNIQUE INDEX IF NOT EXISTS uk_cart_user_sku ON cart_items(user_email, sku);
