# Создаем основные Python файлы приложения

# app/core/config.py
config_content = '''import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/choice_db")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Milvus
    MILVUS_HOST: str = os.getenv("MILVUS_HOST", "localhost")
    MILVUS_PORT: int = int(os.getenv("MILVUS_PORT", "19530"))
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Intelligent Choice System"
    
    # ML Models
    EMBEDDING_MODEL: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    SPACY_MODEL: str = "ru_core_news_sm"
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = "logs/app.log"
    
    class Config:
        env_file = ".env"

settings = Settings()
'''

# app/core/database.py
database_content = '''from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import redis
from pymilvus import connections, Collection, utility
from loguru import logger
from .config import settings

# PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

# Milvus
def connect_milvus():
    try:
        connections.connect(
            alias="default",
            host=settings.MILVUS_HOST,
            port=settings.MILVUS_PORT
        )
        logger.info("Connected to Milvus successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to Milvus: {e}")
        return False

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_redis():
    return redis_client

def check_connections():
    """Check all database connections"""
    status = {
        "postgresql": False,
        "redis": False, 
        "milvus": False
    }
    
    # Check PostgreSQL
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        status["postgresql"] = True
        logger.info("PostgreSQL connection OK")
    except Exception as e:
        logger.error(f"PostgreSQL connection failed: {e}")
    
    # Check Redis
    try:
        redis_client.ping()
        status["redis"] = True
        logger.info("Redis connection OK")
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
    
    # Check Milvus
    status["milvus"] = connect_milvus()
    
    return status
'''

# app/core/logging.py
logging_content = '''import sys
from loguru import logger
from .config import settings

def setup_logging():
    # Remove default handler
    logger.remove()
    
    # Console handler
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=settings.LOG_LEVEL
    )
    
    # File handler
    logger.add(
        settings.LOG_FILE,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level=settings.LOG_LEVEL,
        rotation="10 MB",
        retention="7 days",
        compression="zip"
    )
    
    logger.info("Logging configured successfully")

# Initialize logging
setup_logging()
'''

# Создаем папки и файлы
os.makedirs("app/core", exist_ok=True)

with open("app/__init__.py", "w") as f:
    f.write("")

with open("app/core/__init__.py", "w") as f:
    f.write("")
    
with open("app/core/config.py", "w", encoding="utf-8") as f:
    f.write(config_content)
    
with open("app/core/database.py", "w", encoding="utf-8") as f:
    f.write(database_content)
    
with open("app/core/logging.py", "w", encoding="utf-8") as f:
    f.write(logging_content)

print("✅ Core модули созданы:")
print("- app/core/config.py")
print("- app/core/database.py") 
print("- app/core/logging.py")