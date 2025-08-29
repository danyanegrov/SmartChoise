# Генерируем основные конфигурационные файлы

# requirements.txt
requirements_content = """# Core FastAPI dependencies
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
python-dotenv==1.0.0

# Database
sqlalchemy==2.0.23
alembic==1.13.1
psycopg2-binary==2.9.9

# Cache
redis==5.0.1

# ML and NLP
transformers==4.36.0
torch==2.1.0
sentence-transformers==2.2.2
spacy==3.7.2
numpy==1.24.3
pandas==2.0.3
scikit-learn==1.3.2

# Vector Database
pymilvus==2.3.4

# Authentication and Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4

# Validation
pydantic==2.5.0

# Logging
loguru==0.7.2

# HTTP Client
httpx==0.25.2
requests==2.31.0

# Utils
python-dateutil==2.8.2
"""

# docker-compose.yml
docker_compose_content = """version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/choice_db
      - REDIS_URL=redis://redis:6379/0
      - MILVUS_HOST=milvus
      - MILVUS_PORT=19530
    depends_on:
      - postgres
      - redis
      - milvus
    volumes:
      - ./app:/app/app
      - ./data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "8501:8501"
    environment:
      - API_URL=http://app:8000
    depends_on:
      - app

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=choice_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./data/sql/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Milvus components
  etcd:
    container_name: milvus-etcd
    image: quay.io/coreos/etcd:v3.5.5
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
      - ETCD_QUOTA_BACKEND_BYTES=4294967296
      - ETCD_SNAPSHOT_COUNT=50000
    volumes:
      - etcd:/etcd
    command: etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd

  minio:
    container_name: milvus-minio
    image: minio/minio:RELEASE.2023-03-20T20-16-18Z
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    ports:
      - "9001:9001"
      - "9000:9000"
    volumes:
      - minio:/minio_data
    command: minio server /minio_data --console-address ":9001"

  milvus:
    container_name: milvus-standalone
    image: milvusdb/milvus:v2.3.3
    command: ["milvus", "run", "standalone"]
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    volumes:
      - milvus:/var/lib/milvus
    ports:
      - "19530:19530"
      - "9091:9091"
    depends_on:
      - "etcd"
      - "minio"

volumes:
  postgres_data:
  redis_data:
  etcd:
  minio:
  milvus:
"""

# Dockerfile
dockerfile_content = """FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spacy model
RUN python -m spacy download ru_core_news_sm

# Copy application
COPY . .

# Create directories
RUN mkdir -p logs data/models

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
"""

# Сохраняем файлы
with open("requirements.txt", "w", encoding="utf-8") as f:
    f.write(requirements_content)

with open("docker-compose.yml", "w", encoding="utf-8") as f:
    f.write(docker_compose_content)
    
with open("Dockerfile", "w", encoding="utf-8") as f:
    f.write(dockerfile_content)

print("✅ Конфигурационные файлы созданы:")
print("- requirements.txt")
print("- docker-compose.yml") 
print("- Dockerfile")