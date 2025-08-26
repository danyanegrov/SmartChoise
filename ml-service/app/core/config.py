"""
Configuration management for ML Service
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Application
    DEBUG: bool = False
    SECRET_KEY: str = "ml-service-secret-key-change-in-production"
    
    # Database
    DATABASE_URL: str = "postgresql://decision_user:decision_password_2024@localhost:5432/decision_helper_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600  # 1 hour
    
    # External APIs
    HUGGINGFACE_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "*"]
    
    # ML Models
    MODEL_CACHE_DIR: str = "/tmp/ml_models"
    MAX_MODEL_MEMORY: int = 2048  # MB
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Performance
    MAX_WORKERS: int = 4
    REQUEST_TIMEOUT: int = 30
    
    # Security
    ALLOWED_ALGORITHMS: List[str] = ["emotion", "bandit", "behavioral"]
    MAX_INPUT_SIZE: int = 10000  # characters
    
    @validator('CORS_ORIGINS', pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    @validator('ALLOWED_HOSTS', pre=True)
    def assemble_allowed_hosts(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Model configuration
MODEL_CONFIG = {
    "emotion": {
        "model_name": "j-hartmann/emotion-english-distilroberta-base",
        "cache_key": "emotion_model",
        "max_length": 512,
        "return_all_scores": True
    },
    "sentiment": {
        "model_name": "cardiffnlp/twitter-roberta-base-sentiment-latest",
        "cache_key": "sentiment_model",
        "max_length": 512
    },
    "text_classification": {
        "model_name": "microsoft/DialoGPT-medium",
        "cache_key": "text_model",
        "max_length": 1024
    }
}

# Algorithm configuration
ALGORITHM_CONFIG = {
    "contextual_bandit": {
        "exploration_rate": 0.1,
        "learning_rate": 0.01,
        "discount_factor": 0.95,
        "min_samples": 10
    },
    "behavioral_analysis": {
        "pattern_window": 30,  # days
        "min_decisions": 5,
        "confidence_threshold": 0.7
    },
    "emotion_analysis": {
        "confidence_threshold": 0.6,
        "emotion_weights": {
            "joy": 1.2,
            "optimism": 1.1,
            "love": 1.1,
            "surprise": 1.0,
            "anger": 0.8,
            "fear": 0.7,
            "sadness": 0.8,
            "pessimism": 0.7
        }
    }
}

# Cache configuration
CACHE_CONFIG = {
    "emotion_results": {
        "ttl": 3600,  # 1 hour
        "max_size": 1000
    },
    "bandit_models": {
        "ttl": 86400,  # 24 hours
        "max_size": 100
    },
    "user_patterns": {
        "ttl": 3600,  # 1 hour
        "max_size": 500
    }
}

# Validation rules
VALIDATION_RULES = {
    "max_options": 10,
    "max_criteria": 8,
    "max_text_length": 5000,
    "min_text_length": 10,
    "max_history_items": 1000
}
