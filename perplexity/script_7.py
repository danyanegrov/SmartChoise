# Создаем SQL схему и тестовые данные

# data/sql/init.sql - инициализация базы данных
init_sql_content = '''-- Intelligent Choice System Database Schema
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
('Электроника', 'Электронные устройства и гаджеты'),
('Ноутбуки', 'Портативные компьютеры'),
('Смартфоны', 'Мобильные телефоны'),
('Автомобили', 'Легковые автомобили'),
('Недвижимость', 'Квартиры и дома'),
('Рестораны', 'Заведения общественного питания'),
('Книги', 'Литература и учебники'),
('Одежда', 'Мужская и женская одежда'),
('Спорт', 'Спортивные товары'),
('Путешествия', 'Туристические услуги')
ON CONFLICT DO NOTHING;

-- Set category hierarchy
UPDATE categories SET parent_id = 1 WHERE name IN ('Ноутбуки', 'Смартфоны');

-- Insert sample items
INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes) VALUES
-- Ноутбуки
('MacBook Air M2', 'Легкий ноутбук от Apple с чипом M2', 2, 99999, 4.5, 150, '{"brand": "Apple", "processor": "M2", "ram": "8GB", "storage": "256GB"}'),
('Lenovo ThinkPad X1', 'Бизнес-ноутбук с отличной клавиатурой', 2, 89999, 4.3, 89, '{"brand": "Lenovo", "processor": "Intel i7", "ram": "16GB", "storage": "512GB"}'),
('ASUS ROG Strix', 'Игровой ноутбук с мощной видеокартой', 2, 119999, 4.4, 203, '{"brand": "ASUS", "processor": "AMD Ryzen 7", "ram": "16GB", "gpu": "RTX 3070"}'),
('HP Pavilion', 'Доступный ноутбук для работы и учебы', 2, 45999, 4.0, 67, '{"brand": "HP", "processor": "Intel i5", "ram": "8GB", "storage": "256GB"}'),

-- Смартфоны  
('iPhone 14 Pro', 'Флагманский смартфон от Apple', 3, 89999, 4.6, 312, '{"brand": "Apple", "display": "6.1", "storage": "128GB", "camera": "48MP"}'),
('Samsung Galaxy S23', 'Премиальный Android смартфон', 3, 79999, 4.4, 198, '{"brand": "Samsung", "display": "6.1", "storage": "256GB", "camera": "50MP"}'),
('Google Pixel 7', 'Смартфон с чистым Android и отличной камерой', 3, 59999, 4.3, 156, '{"brand": "Google", "display": "6.3", "storage": "128GB", "camera": "50MP"}'),
('Xiaomi Mi 13', 'Флагман с отличным соотношением цена-качество', 3, 49999, 4.2, 234, '{"brand": "Xiaomi", "display": "6.36", "storage": "256GB", "camera": "50MP"}'),

-- Автомобили
('Toyota Camry', 'Надежный седан бизнес-класса', 4, 2500000, 4.5, 89, '{"brand": "Toyota", "year": 2023, "fuel": "Бензин", "transmission": "Автомат"}'),
('BMW 3 Series', 'Премиальный спортивный седан', 4, 3200000, 4.4, 67, '{"brand": "BMW", "year": 2023, "fuel": "Бензин", "transmission": "Автомат"}'),
('Tesla Model 3', 'Электрический седан с автопилотом', 4, 4500000, 4.6, 143, '{"brand": "Tesla", "year": 2023, "fuel": "Электро", "transmission": "Автомат"}'),
('Hyundai Solaris', 'Экономичный городской автомобиль', 4, 1200000, 4.1, 178, '{"brand": "Hyundai", "year": 2023, "fuel": "Бензин", "transmission": "Механика"}'),

-- Книги
('Python для анализа данных', 'Учебник по программированию на Python', 7, 2999, 4.7, 892, '{"author": "Уэс Маккинни", "pages": 544, "genre": "Техническая литература"}'),
('Гарри Поттер и философский камень', 'Первая книга о мальчике-волшебнике', 7, 899, 4.8, 1205, '{"author": "Дж.К. Роулинг", "pages": 432, "genre": "Фэнтези"}'),
('Мастер и Маргарита', 'Классическое произведение русской литературы', 7, 699, 4.6, 567, '{"author": "М.А. Булгаков", "pages": 480, "genre": "Классика"}'),
('Атлас. Расправил плечи', 'Философский роман об объективизме', 7, 1299, 4.3, 234, '{"author": "Айн Рэнд", "pages": 1168, "genre": "Философская проза"}')

ON CONFLICT DO NOTHING;

-- Insert sample users (passwords are hashed versions of 'password123')
INSERT INTO users (username, email, hashed_password, full_name, preferences) VALUES
('admin', 'admin@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'System Administrator', '{"role": "admin"}'),
('testuser', 'test@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Test User', '{"categories": ["electronics"], "price_range": [0, 100000]}'),
('alice', 'alice@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Alice Johnson', '{"categories": ["books", "travel"], "budget": 50000}'),
('bob', 'bob@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Bob Smith', '{"categories": ["cars", "electronics"], "budget": 200000}')
ON CONFLICT DO NOTHING;

-- Insert sample interactions
INSERT INTO user_interactions (user_id, item_id, interaction_type, rating, feedback) VALUES
(2, 1, 'view', NULL, NULL),
(2, 1, 'like', 5, 'Отличный ноутбук для работы'),
(2, 5, 'view', NULL, NULL),
(2, 5, 'purchase', 5, 'Очень доволен покупкой'),
(3, 9, 'view', NULL, NULL),
(3, 9, 'like', 5, 'Любимая книга'),
(3, 10, 'purchase', 4, 'Хорошее произведение'),
(4, 13, 'view', NULL, NULL),
(4, 13, 'like', 4, 'Надежная машина'),
(4, 2, 'view', NULL, NULL),
(4, 2, 'dislike', 2, 'Слишком дорого')
ON CONFLICT DO NOTHING;

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users  
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Create additional indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_items_attributes_gin ON items USING GIN (attributes);
CREATE INDEX IF NOT EXISTS idx_users_preferences_gin ON users USING GIN (preferences);

COMMIT;
'''

# data/sample/test_queries.json - тестовые запросы
test_queries = [
    {
        "text": "Хочу купить ноутбук для работы с дизайном до 100000 рублей",
        "expected_intent": "purchase",
        "expected_entities": ["ноутбук", "100000 рублей"],
        "expected_filters": {"category": "laptops", "max_price": 100000, "purpose": "design"}
    },
    {
        "text": "Сравни iPhone и Samsung Galaxy",
        "expected_intent": "compare",
        "expected_entities": ["iPhone", "Samsung Galaxy"],
        "expected_filters": {"category": "phones"}
    },
    {
        "text": "Посоветуй хороший ресторан в Москве",
        "expected_intent": "recommend",
        "expected_entities": ["ресторан", "Москве"],
        "expected_filters": {"category": "restaurants", "location": "Москва"}
    },
    {
        "text": "Найди автомобиль до 2 миллионов рублей",
        "expected_intent": "search",
        "expected_entities": ["автомобиль", "2 миллионов"],
        "expected_filters": {"category": "cars", "max_price": 2000000}
    },
    {
        "text": "Какой ноутбук лучше для игр?",
        "expected_intent": "recommend",
        "expected_entities": ["ноутбук"],
        "expected_filters": {"category": "laptops", "purpose": "gaming"}
    }
]

# Создаем папки и файлы данных
os.makedirs("data/sql", exist_ok=True)
os.makedirs("data/sample", exist_ok=True)

with open("data/sql/init.sql", "w", encoding="utf-8") as f:
    f.write(init_sql_content)

with open("data/sample/test_queries.json", "w", encoding="utf-8") as f:
    json.dump(test_queries, f, ensure_ascii=False, indent=2)

print("✅ Схема базы данных и тестовые данные созданы:")
print("- data/sql/init.sql")
print("- data/sample/test_queries.json")