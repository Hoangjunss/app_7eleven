-- Insert default roles if not exists
INSERT INTO roles (name) VALUES ('ADMIN') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('USER') ON CONFLICT (name) DO NOTHING;

-- Insert default admin user
-- Password: admin123
INSERT INTO users (email, password, full_name, created_at, updated_at)
VALUES ('admin@7eleven.com', '$2b$10$1ykw8jvoxBTrKeW2wpsWH.WvKBwJ6q0KuSmE85NzadrERLZpVWMiO', 'System Administrator', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Map admin user to ADMIN role
INSERT INTO user_roles (user_id, role_id)
VALUES (
    (SELECT id FROM users WHERE email = 'admin@7eleven.com'),
    (SELECT id FROM roles WHERE name = 'ADMIN')
)
ON CONFLICT DO NOTHING;
