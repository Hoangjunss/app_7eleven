-- Flyway Migration: V9__seed_sample_data.sql
-- Seed sample data for 7Eleven Shop (PostgreSQL 16)
-- Target Tables: roles, users, user_roles, categories, products, product_images, orders, order_items

-- Ensure pgcrypto extension is installed for BCrypt password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cleanup existing conflicting rows to allow clean seed insertion with exact IDs
DELETE FROM order_items WHERE id BETWEEN 1 AND 100;
DELETE FROM orders WHERE id BETWEEN 1 AND 100;
DELETE FROM product_images WHERE id BETWEEN 1 AND 500;
DELETE FROM products WHERE id BETWEEN 1 AND 500;
DELETE FROM categories WHERE id BETWEEN 1 AND 100;
DELETE FROM user_roles WHERE user_id IN (1, 2, 3) OR user_id IN (SELECT id FROM users WHERE email IN ('admin@7eleven.com', 'user1@example.com', 'user2@example.com'));
DELETE FROM users WHERE id IN (1, 2, 3) OR email IN ('admin@7eleven.com', 'user1@example.com', 'user2@example.com');

-- =========================================================================
-- 1. SEED ROLES
-- =========================================================================
INSERT INTO roles (id, name, created_at, updated_at) VALUES
(1, 'ADMIN', NOW(), NOW()),
(2, 'USER', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 2. SEED USERS WITH BCRYPT ENCRYPTED PASSWORDS
-- =========================================================================
INSERT INTO users (id, email, password, full_name, created_at, updated_at) VALUES
(1, 'admin@7eleven.com', crypt('admin123', gen_salt('bf', 10)), 'Quản trị viên', NOW(), NOW()),
(2, 'user1@example.com', crypt('user123', gen_salt('bf', 10)), 'Nguyễn Văn A', NOW(), NOW()),
(3, 'user2@example.com', crypt('user123', gen_salt('bf', 10)), 'Trần Thị B', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Map users to roles
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1), -- admin -> ADMIN
(2, 2), -- user1 -> USER
(3, 2)  -- user2 -> USER
ON CONFLICT (user_id, role_id) DO NOTHING;

-- =========================================================================
-- 3. SEED CATEGORIES
-- =========================================================================
INSERT INTO categories (id, name, description, created_at, updated_at) VALUES
(1, 'Điện thoại', 'Các dòng điện thoại thông minh mới nhất từ Apple, Samsung, Xiaomi...', NOW(), NOW()),
(2, 'Laptop', 'Máy tính xách tay văn phòng, đồ họa, chơi game cấu hình cao', NOW(), NOW()),
(3, 'Tablet', 'Máy tính bảng giải trí và làm việc gọn nhẹ, tiện lợi', NOW(), NOW()),
(4, 'Phụ kiện', 'Ốp lưng, cáp sạc, adapter, chuột và bàn phím chất lượng cao', NOW(), NOW()),
(5, 'Âm thanh', 'Tai nghe true wireless, chụp tai, loa Bluetooth chất lượng cao', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 4. SEED PRODUCTS
-- =========================================================================
INSERT INTO products (id, name, description, price, stock_quantity, category_id, version, created_at, updated_at) VALUES
-- Category 1: Điện thoại (id: 1..4)
(1, 'iPhone 15 Pro Max 256GB', 'Thiết kế khung Titanium siêu bền, chip A17 Pro mạnh mẽ, camera zoom 5x chuyên nghiệp.', 24990000.00, 50, 1, 0, NOW(), NOW()),
(2, 'Samsung Galaxy S24 Ultra 256GB', 'Tích hợp bút S-Pen, camera 200MP zoom 100x kèm nhiều tính năng AI thông minh vượt trội.', 23990000.00, 30, 1, 0, NOW(), NOW()),
(3, 'Xiaomi 14 Ultra 5G', 'Hệ thống ống kính Leica cao cấp, cảm biến 1 inch thu sáng tối đa, sạc siêu nhanh 90W.', 20990000.00, 20, 1, 0, NOW(), NOW()),
(4, 'Google Pixel 8 Pro 128GB', 'Trải nghiệm Android thuần khiết, xử lý ảnh bằng trí tuệ nhân tạo Tensor G3 ấn tượng.', 17500000.00, 15, 1, 0, NOW(), NOW()),

-- Category 2: Laptop (id: 5..8)
(5, 'MacBook Air 13-inch M3 8GB/256GB', 'Chip M3 thế hệ mới, mỏng nhẹ, pin cực trâu lên tới 18 tiếng, không quạt tản nhiệt yên tĩnh.', 24990000.00, 25, 2, 0, NOW(), NOW()),
(6, 'Asus ROG Zephyrus G14 2024', 'Laptop gaming cao cấp màn hình OLED, chip Ryzen 9 mạnh mẽ kèm card rời RTX 4060.', 24990000.00, 10, 2, 0, NOW(), NOW()),
(7, 'Dell XPS 13 9340 Core Ultra 7', 'Vỏ nhôm nguyên khối sang trọng, màn hình vô cực thời thượng cùng bàn phím tràn viền độc đáo.', 24500000.00, 12, 2, 0, NOW(), NOW()),
(8, 'Lenovo ThinkPad X1 Carbon Gen 11', 'Độ bền chuẩn quân đội, bàn phím gõ tốt nhất thế giới, bảo mật vân tay và nhận diện khuôn mặt.', 24900000.00, 8, 2, 0, NOW(), NOW()),

-- Category 3: Tablet (id: 9..11)
(9, 'iPad Pro 11-inch M2 Wi-Fi 128GB', 'Hiệu năng đỉnh cao tương đương máy tính với chip Apple M2, màn hình Liquid Retina siêu mượt.', 21990000.00, 30, 3, 0, NOW(), NOW()),
(10, 'Samsung Galaxy Tab S9 128GB', 'Màn hình Dynamic AMOLED 2X rực rỡ, kèm sẵn bút S-Pen đa năng, kháng nước kháng bụi IP68.', 16900000.00, 20, 3, 0, NOW(), NOW()),
(11, 'iPad Air 5 M1 Wi-Fi 64GB', 'Cấu hình mạnh mẽ giá hợp lý với chip Apple M1, nhiều màu sắc thời trang năng động.', 13990000.00, 40, 3, 0, NOW(), NOW()),

-- Category 4: Phụ kiện (id: 12..15)
(12, 'Sạc dự phòng Anker 335 20000mAh', 'Hỗ trợ sạc nhanh Power Delivery 20W, dung lượng lớn sạc được nhiều thiết bị cùng lúc.', 850000.00, 100, 4, 0, NOW(), NOW()),
(13, 'Cáp sạc Apple USB-C to Lightning (1m)', 'Cáp sạc chính hãng Apple truyền tải dữ liệu và sạc nhanh an toàn cho các dòng iPhone cũ.', 390000.00, 150, 4, 0, NOW(), NOW()),
(14, 'Chuột Logitech MX Master 3S', 'Thiết kế công thái học cao cấp, cảm biến tracking mọi bề mặt 8k DPI, con lăn MagSpeed siêu tốc.', 2290000.00, 50, 4, 0, NOW(), NOW()),
(15, 'Bàn phím cơ không dây Keychron K2 V2', 'Thiết kế layout 75% gọn gàng, kết nối bluetooth 3 thiết bị đồng thời, keycap chất liệu cao cấp.', 1690000.00, 45, 4, 0, NOW(), NOW()),

-- Category 5: Âm thanh (id: 16..20)
(16, 'Tai nghe Apple AirPods Pro Gen 2 USB-C', 'Chống ồn chủ động ANC đỉnh cao, cải tiến âm thanh thích ứng và hộp sạc hỗ trợ tìm kiếm Precision.', 5490000.00, 60, 5, 0, NOW(), NOW()),
(17, 'Loa Bluetooth JBL Charge 5', 'Âm bass mạnh mẽ đặc trưng JBL, kháng nước kháng bụi IP67, kiêm sạc dự phòng cho điện thoại.', 3490000.00, 35, 5, 0, NOW(), NOW()),
(18, 'Tai nghe chụp tai Sony WH-1000XM5', 'Thiết kế sang trọng, khả năng chống ồn hàng đầu thế giới kết hợp mic đàm thoại cực kỳ trong trẻo.', 7990000.00, 20, 5, 0, NOW(), NOW()),
(19, 'Loa Marshall Acton III Bluetooth', 'Phong cách vintage cổ điển đặc trưng, âm thanh sống động, tinh chỉnh treble bass trực tiếp trên loa.', 6490000.00, 15, 5, 0, NOW(), NOW()),
(20, 'Tai nghe Gaming HyperX Cloud II', 'Âm thanh vòm giả lập 7.1 sống động, đệm tai giả da êm ái thích hợp cho game thủ chơi lâu.', 1790000.00, 40, 5, 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 5. SEED PRODUCT IMAGES (Mỗi sản phẩm có 3 ảnh)
-- =========================================================================
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at, updated_at) VALUES
-- Images for Product 1 (iPhone 15 Pro Max)
(1, 1, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(2, 1, 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(3, 1, 'https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 2 (Galaxy S24 Ultra)
(4, 2, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(5, 2, 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(6, 2, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 3 (Xiaomi 14 Ultra)
(7, 3, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(8, 3, 'https://images.unsplash.com/photo-1598327106026-d9521da673d1?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(9, 3, 'https://images.unsplash.com/photo-1550537687-c91072c4792d?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 4 (Pixel 8 Pro)
(10, 4, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(11, 4, 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(12, 4, 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 5 (MacBook Air M3)
(13, 5, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(14, 5, 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(15, 5, 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 6 (ROG Zephyrus G14)
(16, 6, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(17, 6, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(18, 6, 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 7 (Dell XPS 13)
(19, 7, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(20, 7, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(21, 7, 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 8 (ThinkPad X1 Carbon)
(22, 8, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(23, 8, 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(24, 8, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 9 (iPad Pro M2)
(25, 9, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(26, 9, 'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(27, 9, 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 10 (Galaxy Tab S9)
(28, 10, 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(29, 10, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(30, 10, 'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 11 (iPad Air 5)
(31, 11, 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(32, 11, 'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(33, 11, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 12 (Anker Powerbank)
(34, 12, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(35, 12, 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(36, 12, 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 13 (Apple Cable)
(37, 13, 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(38, 13, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(39, 13, 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 14 (Logitech Mouse)
(40, 14, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(41, 14, 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(42, 14, 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 15 (Keychron K2)
(43, 15, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(44, 15, 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(45, 15, 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 16 (AirPods Pro 2)
(46, 16, 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(47, 16, 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(48, 16, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 17 (JBL Charge 5)
(49, 17, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(50, 17, 'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(51, 17, 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 18 (Sony WH-1000XM5)
(52, 18, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(53, 18, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(54, 18, 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 19 (Marshall Acton III)
(55, 19, 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(56, 19, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(57, 19, 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),

-- Images for Product 20 (HyperX Cloud II)
(58, 20, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80', TRUE, NOW(), NOW()),
(59, 20, 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW()),
(60, 20, 'https://images.unsplash.com/photo-1599669454699-248893623440?w=600&auto=format&fit=crop&q=80', FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 6. SEED ORDERS AND ORDER ITEMS
-- =========================================================================
-- Create 3 orders for Nguyễn Văn A (user_id: 2) and 2 orders for Trần Thị B (user_id: 3)
-- Order status enum values are: PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED
-- Payment status values: PENDING, PAID, CANCELLED

INSERT INTO orders (id, order_code, user_id, status, total_amount, payment_method, payment_status, recipient_name, recipient_phone, delivery_address, note, created_at, updated_at) VALUES
-- Orders for User 1 (Nguyễn Văn A - id: 2)
(1, 'ORD-20260523-0001', 2, 'PENDING', 26690000.00, 'COD', 'PENDING', 'Nguyễn Văn A', '0912345678', '123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh', 'Giao ngoài giờ hành chính', NOW(), NOW()),
(2, 'ORD-20260523-0002', 2, 'CONFIRMED', 5490000.00, 'COD', 'PENDING', 'Nguyễn Văn A', '0912345678', '123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh', NULL, NOW(), NOW()),
(3, 'ORD-20260523-0003', 2, 'DELIVERED', 23160000.00, 'COD', 'PENDING', 'Nguyễn Văn A', '0912345678', '123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh', 'Vui lòng gọi trước khi giao', NOW(), NOW()),

-- Orders for User 2 (Trần Thị B - id: 3)
(4, 'ORD-20260523-0004', 3, 'SHIPPING', 24990000.00, 'COD', 'PENDING', 'Trần Thị B', '0987654321', '456 Đường Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh', NULL, NOW(), NOW()),
(5, 'ORD-20260523-0005', 3, 'CANCELLED', 10280000.00, 'COD', 'CANCELLED', 'Trần Thị B', '0987654321', '456 Đường Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh', 'Khách hàng thay đổi quyết định mua', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Order Items for Order 1 (Total: 26,690,000.00)
-- 1x Product 1 (iPhone 15 Pro Max) - 24,990,000.00
-- 2x Product 12 (Anker Powerbank) - 850,000.00
INSERT INTO order_items (id, order_id, product_id, product_name_snapshot, price_snapshot, quantity, subtotal) VALUES
(1, 1, 1, 'iPhone 15 Pro Max 256GB', 24990000.00, 1, 24990000.00),
(2, 1, 12, 'Sạc dự phòng Anker 335 20000mAh', 850000.00, 2, 1700000.00),

-- Order Items for Order 2 (Total: 5,490,000.00)
-- 1x Product 16 (AirPods Pro 2) - 5,490,000.00
(3, 2, 16, 'Tai nghe Apple AirPods Pro Gen 2 USB-C', 5490000.00, 1, 5490000.00),

-- Order Items for Order 3 (Total: 23,160,000.00)
-- 1x Product 9 (iPad Pro M2) - 21,990,000.00
-- 3x Product 13 (Apple Cable) - 390,000.00
(4, 3, 9, 'iPad Pro 11-inch M2 Wi-Fi 128GB', 21990000.00, 1, 21990000.00),
(5, 3, 13, 'Cáp sạc Apple USB-C to Lightning (1m)', 390000.00, 3, 1170000.00),

-- Order Items for Order 4 (Total: 24,990,000.00)
-- 1x Product 5 (MacBook Air M3) - 24,990,000.00
(6, 4, 5, 'MacBook Air 13-inch M3 8GB/256GB', 24990000.00, 1, 24990000.00),

-- Order Items for Order 5 (Total: 10,280,000.00)
-- 1x Product 18 (Sony WH-1000XM5) - 7,990,000.00
-- 1x Product 14 (Logitech MX Master 3S) - 2,290,000.00
(7, 5, 18, 'Tai nghe chụp tai Sony WH-1000XM5', 7990000.00, 1, 7990000.00),
(8, 5, 14, 'Chuột Logitech MX Master 3S', 2290000.00, 1, 2290000.00)
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 7. RESET SERIAL SEQUENCES FOR POSTGRESQL
-- =========================================================================
SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM roles));
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products));
SELECT setval('product_images_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_images));
SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM orders));
SELECT setval('order_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM order_items));
