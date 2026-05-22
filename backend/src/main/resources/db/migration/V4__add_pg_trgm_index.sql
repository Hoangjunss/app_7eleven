-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index on products name using gin_trgm_ops
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
