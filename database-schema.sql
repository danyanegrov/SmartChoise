-- SmartChoice AI Database Schema for PostgreSQL
-- This file contains the complete database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INTEGER CHECK (age >= 13 AND age <= 120),
    personality_type VARCHAR(50) CHECK (personality_type IN ('introvert', 'extrovert', 'ambivert')),
    anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10) DEFAULT 5,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Decisions table
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    decision_type VARCHAR(50) NOT NULL CHECK (decision_type IN ('simple', 'complex', 'random', 'ai')),
    recommendation TEXT NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0.00 AND confidence <= 1.00),
    reasoning TEXT,
    alternatives JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Decision outcomes table (for tracking results)
CREATE TABLE decision_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    outcome VARCHAR(50) NOT NULL CHECK (outcome IN ('success', 'partial_success', 'failure', 'pending')),
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    feedback TEXT,
    actual_result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_decisions_user_id ON decisions(user_id);
CREATE INDEX idx_decisions_created_at ON decisions(created_at);
CREATE INDEX idx_decisions_type ON decisions(decision_type);
CREATE INDEX idx_decision_outcomes_decision_id ON decision_outcomes(decision_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON decisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (id, email, name, age, personality_type, anxiety_level, preferences) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'demo@smartchoice.ai', 'Демо пользователь', 28, 'ambivert', 5, 
     '{"data": true, "intuition": false, "speed": true, "consultation": true}');

INSERT INTO decisions (id, user_id, title, question, decision_type, recommendation, confidence, reasoning, alternatives) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 
     'Выбор ноутбука для работы', 'Какой ноутбук выбрать для data science?', 'simple',
     'MacBook Pro M2 или Dell XPS 15', 0.85, 
     'Оба варианта отлично подходят для data science задач',
     '["MacBook Pro M2", "Dell XPS 15", "Lenovo ThinkPad X1"]'),
    
    ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000',
     'Смена работы', 'Стоит ли сейчас менять работу?', 'complex',
     'Подождать 3-6 месяцев', 0.72,
     'Рынок нестабилен, лучше накопить опыт и сбережения',
     '["Сменить сейчас", "Подождать 3-6 месяцев", "Остаться на год"]');

-- Create views for common queries
CREATE VIEW user_decision_stats AS
SELECT 
    u.id as user_id,
    u.name,
    COUNT(d.id) as total_decisions,
    AVG(d.confidence) as avg_confidence,
    COUNT(CASE WHEN d.confidence > 0.7 THEN 1 END) as high_confidence_decisions,
    COUNT(CASE WHEN d.decision_type = 'simple' THEN 1 END) as simple_decisions,
    COUNT(CASE WHEN d.decision_type = 'complex' THEN 1 END) as complex_decisions,
    COUNT(CASE WHEN d.decision_type = 'random' THEN 1 END) as random_decisions
FROM users u
LEFT JOIN decisions d ON u.id = d.user_id
GROUP BY u.id, u.name;

CREATE VIEW recent_activity AS
SELECT 
    'decision_created' as activity_type,
    d.title as description,
    d.created_at as timestamp,
    u.name as user_name
FROM decisions d
JOIN users u ON d.user_id = u.id
UNION ALL
SELECT 
    'user_registered' as activity_type,
    'Новый пользователь: ' || u.name as description,
    u.created_at as timestamp,
    u.name as user_name
FROM users u
ORDER BY timestamp DESC;

-- Grant permissions (adjust as needed for your Railway setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_railway_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_railway_user;

