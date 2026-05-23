-- Create orders table
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    total_amount DECIMAL(19, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'COD',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create order_items table
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    price_snapshot DECIMAL(19, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(19, 2) NOT NULL,
    CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create indexes for performance optimization
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_deleted_at ON orders(deleted_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
