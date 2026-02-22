CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS subcategories (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id),
  name VARCHAR(100) NOT NULL,
  UNIQUE(category_id, name)
);
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id),
  subcategory_id BIGINT NOT NULL REFERENCES subcategories(id),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(128) NOT NULL UNIQUE,
  price NUMERIC(12,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  tax_percent NUMERIC(5,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  image_url TEXT,
  description TEXT
);

INSERT INTO categories(name) VALUES ('Fruits'),('Vegetables'),('Dairy') ON CONFLICT DO NOTHING;

INSERT INTO subcategories(category_id, name)
SELECT c.id, x.name
FROM categories c
JOIN (VALUES
  ('Fruits','Citrus'), ('Fruits','Berries'),
  ('Vegetables','Leafy'),
  ('Dairy','Milk'), ('Dairy','Cheese')
) x(cat, name) ON c.name = x.cat
ON CONFLICT DO NOTHING;

INSERT INTO products(category_id, subcategory_id, name, sku, price, discount_percent, tax_percent, unit, image_url, description)
SELECT c.id, s.id, p.name, p.sku, p.price, p.discount, p.tax, p.unit, p.image_url, p.description
FROM (VALUES
 ('Fruits','Citrus','Orange','SKU-ORANGE',60.00,5.00,5.00,'kg','https://placehold.co/200x200','Fresh oranges'),
 ('Fruits','Citrus','Apple','SKU-APPLE',120.00,0.00,5.00,'kg','https://placehold.co/200x200','Red apples'),
 ('Fruits','Berries','Strawberry','SKU-STRAW',180.00,10.00,5.00,'kg','https://placehold.co/200x200','Sweet strawberries'),
 ('Vegetables','Leafy','Spinach','SKU-SPINACH',40.00,0.00,2.00,'kg','https://placehold.co/200x200','Organic spinach'),
 ('Dairy','Milk','Milk 1L','SKU-MILK1L',55.00,0.00,5.00,'l','https://placehold.co/200x200','Cow milk 1L'),
 ('Dairy','Cheese','Cheddar 200g','SKU-CHED200',150.00,5.00,5.00,'pcs','https://placehold.co/200x200','Cheddar block 200g')
) p(cat, subcat, name, sku, price, discount, tax, unit, image_url, description)
JOIN categories c ON c.name = p.cat
JOIN subcategories s ON s.category_id = c.id AND s.name = p.subcat
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  discount_percent = EXCLUDED.discount_percent,
  tax_percent = EXCLUDED.tax_percent,
  unit = EXCLUDED.unit,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description;
