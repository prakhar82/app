CREATE TABLE product_reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_display_name VARCHAR(255) NOT NULL,
    rating NUMERIC(2,1) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_product_reviews_product_user
    ON product_reviews(product_id, user_email);

CREATE INDEX idx_product_reviews_product_updated
    ON product_reviews(product_id, updated_at DESC);
