-- PostgreSQL initialization script for Decision Helper
-- This script is executed when the database container starts for the first time

-- Create database (if using a different setup)
-- CREATE DATABASE decision_helper_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- Note: Prisma will create the main tables and indexes
-- These are additional performance optimizations

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Full-text search configuration for decision titles and descriptions
CREATE TEXT SEARCH CONFIGURATION decision_search (copy=english);

-- Insert sample data for development (will be skipped if tables exist)
DO $$
BEGIN
    -- This will be executed only if tables exist
    -- Prisma migrations should create the tables first
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Insert a sample admin user for development
        INSERT INTO users (
            id,
            email,
            password_hash,
            name,
            personality_type,
            anxiety_level,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            'admin@decision-helper.com',
            '$2b$12$LQv3c1yqBwEHFurhHHkFUe/AVRNczGHEqwi.tOdLQjGJc7/B1UQyy', -- password: admin123
            'Admin User',
            'ambivert',
            5,
            NOW(),
            NOW()
        ) ON CONFLICT (email) DO NOTHING;
        
        -- Insert sample test user
        INSERT INTO users (
            id,
            email,
            password_hash,
            name,
            personality_type,
            anxiety_level,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            'test@decision-helper.com',
            '$2b$12$LQv3c1yqBwEHFurhHHkFUe/AVRNczGHEqwi.tOdLQjGJc7/B1UQyy', -- password: test123
            'Test User',
            'introvert',
            7,
            NOW(),
            NOW()
        ) ON CONFLICT (email) DO NOTHING;
        
        RAISE NOTICE 'Sample users created successfully';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Tables do not exist yet, skipping sample data insertion';
END $$;
