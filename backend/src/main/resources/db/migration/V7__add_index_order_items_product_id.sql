-- Create index on order_items(product_id) to optimize cross-queries
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
