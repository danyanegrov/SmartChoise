-- SmartChoice AI Database Schema
-- PostgreSQL initialization script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'RUB',
    rating DECIMAL(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    attributes JSONB DEFAULT '{}',
    is_available BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user interactions table
CREATE TABLE IF NOT EXISTS user_interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    interaction_type VARCHAR(20) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create choices table  
CREATE TABLE IF NOT EXISTS choices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    query_text TEXT NOT NULL,
    processed_query TEXT,
    intent VARCHAR(50),
    selected_items JSONB,
    user_feedback INTEGER CHECK (user_feedback >= 1 AND user_feedback <= 5),
    feedback_text TEXT,
    algorithm_version VARCHAR(20),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create query sessions table
CREATE TABLE IF NOT EXISTS query_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE,
    user_id INTEGER REFERENCES users(id),
    queries JSONB DEFAULT '[]',
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_price ON items(price);
CREATE INDEX IF NOT EXISTS idx_items_rating ON items(rating);
CREATE INDEX IF NOT EXISTS idx_items_available ON items(is_available);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_item ON user_interactions(item_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_choices_user ON choices(user_id);
CREATE INDEX IF NOT EXISTS idx_choices_intent ON choices(intent);
CREATE INDEX IF NOT EXISTS idx_query_sessions_user ON query_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_query_sessions_session ON query_sessions(session_id);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Электроника', 'Компьютеры, телефоны, планшеты и другие электронные устройства'),
('Одежда', 'Мужская, женская и детская одежда'),
('Книги', 'Художественная и техническая литература'),
('Спорт', 'Спортивное оборудование и одежда'),
('Дом и сад', 'Товары для дома, мебель, садовые инструменты'),
('Красота', 'Косметика, парфюмерия, средства по уходу'),
('Авто', 'Автомобильные аксессуары и запчасти'),
('Игры', 'Настольные и компьютерные игры');

-- Insert sample items
INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes) VALUES
('iPhone 15 Pro', 'Смартфон Apple с камерой 48 МП', 1, 99990.00, 4.8, 156, '{"color": "black", "storage": "256GB", "brand": "Apple"}'),
('MacBook Air M2', 'Ноутбук Apple с чипом M2', 1, 129990.00, 4.9, 89, '{"color": "silver", "storage": "512GB", "brand": "Apple"}'),
('Samsung Galaxy S24', 'Android смартфон с AI функциями', 1, 89990.00, 4.7, 203, '{"color": "blue", "storage": "128GB", "brand": "Samsung"}'),
('Джинсы Levi\'s 501', 'Классические джинсы прямого кроя', 2, 5990.00, 4.6, 78, '{"color": "blue", "size": "32", "brand": "Levi\'s"}'),
('Кроссовки Nike Air Max', 'Спортивная обувь с воздушной подушкой', 2, 8990.00, 4.5, 124, '{"color": "white", "size": "42", "brand": "Nike"}'),
('Книга "Война и мир"', 'Роман-эпопея Льва Толстого', 3, 890.00, 4.9, 567, '{"author": "Лев Толстой", "genre": "классика", "pages": 1225}'),
('Велосипед горный', 'Горный велосипед для активного отдыха', 4, 45990.00, 4.4, 45, '{"type": "mountain", "gears": 21, "frame_size": "L"}'),
('Кофемашина DeLonghi', 'Автоматическая кофемашина', 5, 89990.00, 4.7, 67, '{"type": "espresso", "power": "1450W", "brand": "DeLonghi"}');

-- Insert sample users (passwords are hashed - change in production)
INSERT INTO users (username, email, hashed_password, full_name, preferences) VALUES
('admin', 'admin@smartchoice.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uOeG', 'Администратор', '{"categories": [1, 2, 3], "max_price": 100000}'),
('user1', 'user1@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uOeG', 'Иван Иванов', '{"categories": [1, 4], "max_price": 50000}'),
('user2', 'user2@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uOeG', 'Мария Петрова', '{"categories": [2, 5, 6], "max_price": 30000}');

-- Insert sample user interactions
INSERT INTO user_interactions (user_id, item_id, interaction_type, rating, feedback) VALUES
(2, 1, 'view', NULL, NULL),
(2, 1, 'like', NULL, NULL),
(2, 2, 'view', NULL, NULL),
(2, 2, 'purchase', 5, 'Отличный ноутбук!'),
(3, 4, 'view', NULL, NULL),
(3, 4, 'purchase', 4, 'Хорошие джинсы'),
(3, 5, 'view', NULL, NULL),
(3, 5, 'like', NULL, NULL);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
