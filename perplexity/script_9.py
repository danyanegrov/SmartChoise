# Создаем скрипт для загрузки данных и векторов

data_loader_content = '''#!/usr/bin/env python3
"""
Data loader script for Intelligent Choice System
Loads sample data and generates embeddings for vector search
"""

import asyncio
import json
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import psycopg2
from pymilvus import connections, Collection, utility
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'choice_db',
    'user': 'postgres',
    'password': 'password'
}

# Milvus configuration
MILVUS_CONFIG = {
    'host': 'localhost',
    'port': 19530
}

class DataLoader:
    def __init__(self):
        self.embedder = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        self.db_conn = None
        self.milvus_collection = None
    
    def connect_databases(self):
        """Connect to PostgreSQL and Milvus"""
        try:
            # Connect to PostgreSQL
            self.db_conn = psycopg2.connect(**DB_CONFIG)
            logger.info("Connected to PostgreSQL")
            
            # Connect to Milvus
            connections.connect(
                alias="default",
                host=MILVUS_CONFIG['host'],
                port=MILVUS_CONFIG['port']
            )
            
            # Get Milvus collection
            if utility.has_collection("item_embeddings"):
                self.milvus_collection = Collection("item_embeddings")
                logger.info("Connected to Milvus collection")
            else:
                logger.warning("Milvus collection 'item_embeddings' not found")
            
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def load_additional_items(self):
        """Load more sample items into database"""
        additional_items = [
            # Больше ноутбуков
            {
                'name': 'Dell XPS 13',
                'description': 'Ультрабук с безрамочным дисплеем и долгой автономностью',
                'category_id': 2,
                'price': 79999,
                'rating': 4.4,
                'rating_count': 156,
                'attributes': '{"brand": "Dell", "processor": "Intel i7", "ram": "16GB", "storage": "512GB", "display": "13.3\\"}'
            },
            {
                'name': 'Acer Aspire 5',
                'description': 'Бюджетный ноутбук для учебы и работы',
                'category_id': 2,
                'price': 38999,
                'rating': 3.9,
                'rating_count': 89,
                'attributes': '{"brand": "Acer", "processor": "AMD Ryzen 5", "ram": "8GB", "storage": "256GB"}'
            },
            {
                'name': 'Microsoft Surface Laptop',
                'description': 'Стильный ноутбук с сенсорным экраном',
                'category_id': 2,
                'price': 94999,
                'rating': 4.3,
                'rating_count': 134,
                'attributes': '{"brand": "Microsoft", "processor": "Intel i5", "ram": "8GB", "storage": "256GB", "touchscreen": true}'
            },
            
            # Больше смартфонов
            {
                'name': 'OnePlus 11',
                'description': 'Флагманский смартфон с быстрой зарядкой',
                'category_id': 3,
                'price': 54999,
                'rating': 4.5,
                'rating_count': 267,
                'attributes': '{"brand": "OnePlus", "display": "6.7", "storage": "128GB", "camera": "50MP", "charging": "100W"}'
            },
            {
                'name': 'Huawei P60 Pro',
                'description': 'Камерофон с профессиональной съемкой',
                'category_id': 3,
                'price': 67999,
                'rating': 4.4,
                'rating_count': 178,
                'attributes': '{"brand": "Huawei", "display": "6.67", "storage": "256GB", "camera": "48MP", "zoom": "5x"}'
            },
            {
                'name': 'Nothing Phone 2',
                'description': 'Уникальный дизайн с Glyph-интерфейсом',
                'category_id': 3,
                'price': 45999,
                'rating': 4.1,
                'rating_count': 92,
                'attributes': '{"brand": "Nothing", "display": "6.7", "storage": "128GB", "camera": "50MP", "glyph": true}'
            },
            
            # Планшеты (новая подкатегория)
            {
                'name': 'iPad Air',
                'description': 'Мощный планшет для творчества и работы',
                'category_id': 1,
                'price': 59999,
                'rating': 4.6,
                'rating_count': 234,
                'attributes': '{"brand": "Apple", "display": "10.9", "storage": "64GB", "processor": "M1"}'
            },
            {
                'name': 'Samsung Galaxy Tab S8',
                'description': 'Android планшет с S Pen в комплекте',
                'category_id': 1,
                'price': 49999,
                'rating': 4.3,
                'rating_count': 156,
                'attributes': '{"brand": "Samsung", "display": "11", "storage": "128GB", "s_pen": true}'
            },
            
            # Больше книг
            {
                'name': 'Алгоритмы: построение и анализ',
                'description': 'Классический учебник по алгоритмам',
                'category_id': 7,
                'price': 3499,
                'rating': 4.8,
                'rating_count': 445,
                'attributes': '{"author": "Кормен, Лейзерсон, Ривест", "pages": 1296, "genre": "Техническая литература"}'
            },
            {
                'name': 'Чистый код',
                'description': 'Руководство по написанию качественного кода',
                'category_id': 7,
                'price': 2299,
                'rating': 4.7,
                'rating_count': 678,
                'attributes': '{"author": "Роберт Мартин", "pages": 464, "genre": "Программирование"}'
            },
            {
                'name': 'Машинное обучение',
                'description': 'Современный подход к машинному обучению',
                'category_id': 7,
                'price': 4199,
                'rating': 4.6,
                'rating_count': 234,
                'attributes': '{"author": "Том Митчелл", "pages": 432, "genre": "Искусственный интеллект"}'
            }
        ]
        
        try:
            cursor = self.db_conn.cursor()
            
            for item in additional_items:
                cursor.execute("""
                    INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes)
                    VALUES (%(name)s, %(description)s, %(category_id)s, %(price)s, %(rating)s, %(rating_count)s, %(attributes)s)
                    ON CONFLICT (name) DO NOTHING
                """, item)
            
            self.db_conn.commit()
            logger.info(f"Loaded {len(additional_items)} additional items")
            
        except Exception as e:
            logger.error(f"Failed to load additional items: {e}")
            self.db_conn.rollback()
    
    def generate_embeddings(self):
        """Generate embeddings for all items and load into Milvus"""
        try:
            cursor = self.db_conn.cursor()
            
            # Get all items
            cursor.execute("""
                SELECT id, name, description, price, rating, 
                       c.name as category_name, attributes
                FROM items i
                LEFT JOIN categories c ON i.category_id = c.id
                WHERE i.is_available = true
            """)
            
            items = cursor.fetchall()
            logger.info(f"Found {len(items)} items to process")
            
            if not items:
                logger.warning("No items found in database")
                return
            
            # Prepare data for Milvus
            ids = []
            item_ids = []
            names = []
            categories = []
            embeddings = []
            metadata = []
            
            for item in items:
                item_id, name, description, price, rating, category_name, attributes = item
                
                # Create text for embedding
                text_parts = [name]
                if description:
                    text_parts.append(description)
                if category_name:
                    text_parts.append(category_name)
                
                text_for_embedding = " ".join(text_parts)
                
                # Generate embedding
                embedding = self.embedder.encode(text_for_embedding)
                
                # Prepare data
                ids.append(len(ids))  # Auto-increment ID for Milvus
                item_ids.append(item_id)
                names.append(name[:200])  # Truncate to fit VARCHAR limit
                categories.append(category_name[:100] if category_name else "")
                embeddings.append(embedding.tolist())
                
                # Create metadata
                item_metadata = {
                    "price": price,
                    "rating": float(rating) if rating else 0.0,
                    "attributes": json.loads(attributes) if attributes else {}
                }
                metadata.append(json.dumps(item_metadata, ensure_ascii=False)[:1000])
            
            # Insert into Milvus
            if self.milvus_collection and embeddings:
                # Clear existing data
                self.milvus_collection.delete("id >= 0")
                self.milvus_collection.flush()
                
                # Insert new data
                entities = [ids, item_ids, names, categories, embeddings, metadata]
                insert_result = self.milvus_collection.insert(entities)
                
                # Flush to make data searchable
                self.milvus_collection.flush()
                
                logger.info(f"Inserted {len(embeddings)} embeddings into Milvus")
                
                # Create index if not exists
                if not self.milvus_collection.has_index():
                    index_params = {
                        "metric_type": "COSINE",
                        "index_type": "HNSW",
                        "params": {"M": 16, "efConstruction": 200}
                    }
                    self.milvus_collection.create_index("embedding", index_params)
                    logger.info("Created index on embeddings")
                
                # Load collection
                self.milvus_collection.load()
                logger.info("Collection loaded and ready for search")
            
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise
    
    def create_sample_interactions(self):
        """Create more sample user interactions"""
        interactions = [
            # User 2 (testuser) interactions
            (2, 1, 'view', None, None),  # MacBook Air
            (2, 1, 'like', 5, 'Отличная производительность'),
            (2, 2, 'view', None, None),  # ThinkPad
            (2, 2, 'like', 4, 'Хорошая клавиатура'),
            (2, 5, 'purchase', 5, 'Купил, очень доволен'),  # iPhone
            
            # User 3 (alice) interactions  
            (3, 9, 'view', None, None),   # Python книга
            (3, 9, 'purchase', 5, 'Отличный учебник'),
            (3, 10, 'view', None, None),  # Гарри Поттер
            (3, 10, 'like', 5, 'Любимая книга детства'),
            (3, 11, 'view', None, None),  # Мастер и Маргарита
            (3, 11, 'like', 4, 'Классика русской литературы'),
            
            # User 4 (bob) interactions
            (4, 13, 'view', None, None),  # Toyota
            (4, 13, 'like', 4, 'Надежный автомобиль'),
            (4, 14, 'view', None, None),  # BMW
            (4, 14, 'like', 5, 'Отличная управляемость'),
            (4, 15, 'view', None, None),  # Tesla
            (4, 15, 'dislike', 2, 'Слишком дорого'),
            (4, 3, 'view', None, None),   # ASUS ROG
            (4, 3, 'like', 5, 'Мощный игровой ноутбук')
        ]
        
        try:
            cursor = self.db_conn.cursor()
            
            for interaction in interactions:
                user_id, item_id, int_type, rating, feedback = interaction
                cursor.execute("""
                    INSERT INTO user_interactions (user_id, item_id, interaction_type, rating, feedback)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, (user_id, item_id, int_type, rating, feedback))
            
            self.db_conn.commit()
            logger.info(f"Created {len(interactions)} sample interactions")
            
        except Exception as e:
            logger.error(f"Failed to create interactions: {e}")
            self.db_conn.rollback()
    
    def run(self):
        """Run the full data loading process"""
        logger.info("Starting data loading process...")
        
        try:
            # Connect to databases
            self.connect_databases()
            
            # Load additional items
            self.load_additional_items()
            
            # Generate embeddings
            if self.milvus_collection:
                self.generate_embeddings()
            else:
                logger.warning("Skipping embedding generation - Milvus collection not available")
            
            # Create sample interactions
            self.create_sample_interactions()
            
            logger.info("Data loading completed successfully!")
            
        except Exception as e:
            logger.error(f"Data loading failed: {e}")
            raise
        
        finally:
            # Close connections
            if self.db_conn:
                self.db_conn.close()
                logger.info("Closed database connection")

def main():
    loader = DataLoader()
    loader.run()

if __name__ == "__main__":
    main()
'''

# Создаем тестовые файлы
test_main_content = '''import pytest
import requests
import json
from app.services.nlp_service import nlp_processor
from app.services.recommendation_service import recommendation_engine

class TestAPI:
    """Integration tests for API endpoints"""
    
    BASE_URL = "http://localhost:8000/api/v1"
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = requests.get(f"{self.BASE_URL}/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "services" in data
    
    def test_nlp_processing(self):
        """Test NLP processing endpoint"""
        payload = {
            "text": "Хочу купить игровой ноутбук до 100000 рублей",
            "user_context": {}
        }
        
        response = requests.post(f"{self.BASE_URL}/nlp/process", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "intent" in data
        assert "entities" in data
        assert "embedding" in data
        assert data["intent"] == "purchase"
    
    def test_recommendations(self):
        """Test recommendations endpoint"""
        payload = {
            "query": "Посоветуй хороший ноутбук для работы",
            "filters": {"max_price": 80000},
            "limit": 5
        }
        
        response = requests.post(f"{self.BASE_URL}/recommendations", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "recommendations" in data
        assert "intent" in data
        assert "processing_time_ms" in data
        assert len(data["recommendations"]) <= 5

class TestNLP:
    """Unit tests for NLP components"""
    
    def test_text_cleaning(self):
        """Test text preprocessing"""
        text = "Хочу купить НОУТБУК для работы!!!"
        cleaned = nlp_processor._clean_text(text)
        
        assert cleaned.islower()
        assert "ноутбук" in cleaned
        assert "!!!" not in cleaned
    
    def test_intent_classification(self):
        """Test intent classification"""
        test_cases = [
            ("Хочу купить ноутбук", "purchase"),
            ("Сравни iPhone и Samsung", "compare"),
            ("Посоветуй хороший ресторан", "recommend"),
            ("Найди автомобиль", "search")
        ]
        
        for text, expected_intent in test_cases:
            intent, confidence = nlp_processor._classify_intent(text)
            assert intent == expected_intent
            assert confidence > 0
    
    def test_entity_extraction(self):
        """Test entity extraction"""
        text = "Ноутбук до 50000 рублей в Москве"
        doc = nlp_processor.nlp(text)
        entities = nlp_processor._extract_entities(doc)
        
        # Should find price and location entities
        entity_texts = [e["text"] for e in entities]
        assert any("50000" in text for text in entity_texts)

class TestRecommendations:
    """Unit tests for recommendation engine"""
    
    @pytest.mark.asyncio
    async def test_recommendation_generation(self):
        """Test recommendation generation"""
        recommendations = await recommendation_engine.get_recommendations(
            user_id=None,
            query="игровой ноутбук",
            filters={"max_price": 100000},
            limit=3
        )
        
        assert "recommendations" in recommendations
        assert "intent" in recommendations
        assert "processing_time_ms" in recommendations
        assert len(recommendations["recommendations"]) <= 3

if __name__ == "__main__":
    pytest.main([__file__])
'''

# README.md
readme_content = '''# Система интеллектуального выбора

Система искусственного интеллекта для помощи пользователям в принятии решений на основе обработки естественного языка и гибридных алгоритмов рекомендаций.

## 🚀 Особенности

- 🧠 **NLP обработка** русскоязычных запросов
- 🤖 **Гибридные рекомендации** (семантический поиск + коллаборативная фильтрация)
- 🔍 **Векторный поиск** через Milvus
- 📊 **Streamlit интерфейс** для пользователей
- 🐳 **Docker** контейнеризация
- 📈 **Аналитика** и мониторинг

## 🛠 Технологический стек

### Backend
- **FastAPI** - REST API
- **PostgreSQL** - основная БД
- **Milvus** - векторная БД
- **Redis** - кэширование

### ML/NLP
- **sentence-transformers** - эмбеддинги
- **spaCy** - обработка языка
- **transformers** - предобученные модели
- **scikit-learn** - ML алгоритмы

### Frontend
- **Streamlit** - веб-интерфейс
- **Plotly** - визуализация

## 📦 Установка и запуск

### Предварительные требования
- Docker и Docker Compose
- Python 3.11+
- Git

### Быстрый запуск

1. **Клонирование и переход в директорию:**
```bash
git clone <repository-url>
cd intelligent-choice-system
```

2. **Запуск через Docker Compose:**
```bash
docker-compose up --build
```

3. **Проверка сервисов:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Frontend: http://localhost:8501
- Milvus: http://localhost:9091

### Разработка

1. **Создание виртуального окружения:**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\\Scripts\\activate     # Windows
```

2. **Установка зависимостей:**
```bash
pip install -r requirements.txt
python -m spacy download ru_core_news_sm
```

3. **Запуск БД через Docker:**
```bash
docker-compose up postgres redis milvus etcd minio
```

4. **Запуск API:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

5. **Запуск Frontend:**
```bash
cd frontend
streamlit run app.py
```

## 📊 Загрузка данных

После запуска сервисов загрузите тестовые данные:

```bash
python data/load_data.py
```

Этот скрипт:
- Загружает дополнительные товары в PostgreSQL
- Генерирует векторные представления
- Индексирует данные в Milvus
- Создает тестовые взаимодействия пользователей

## 🧪 Тестирование

```bash
# Установка тестовых зависимостей
pip install pytest pytest-asyncio

# Запуск тестов
pytest tests/ -v

# Тестирование с покрытием
pytest tests/ --cov=app --cov-report=html
```

## 📚 API Документация

После запуска API документация доступна по адресам:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Основные endpoints:

- `POST /api/v1/recommendations` - получение рекомендаций
- `POST /api/v1/nlp/process` - обработка текста
- `GET /api/v1/items` - поиск товаров
- `POST /api/v1/recommendations/feedback` - обратная связь
- `GET /api/v1/health` - проверка здоровья системы

## 🎯 Использование

### Пример запроса рекомендаций:

```python
import requests

response = requests.post("http://localhost:8000/api/v1/recommendations", json={
    "query": "Хочу купить игровой ноутбук до 100000 рублей",
    "filters": {
        "category": "laptops",
        "max_price": 100000
    },
    "limit": 5
})

recommendations = response.json()
```

### Пример обработки NLP:

```python
response = requests.post("http://localhost:8000/api/v1/nlp/process", json={
    "text": "Посоветуй хороший ресторан в Москве",
    "user_context": {}
})

nlp_result = response.json()
# nlp_result["intent"] == "recommend"
# nlp_result["entities"] содержит найденные сущности
```

## 🔧 Конфигурация

Основные настройки в `.env` файле:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/choice_db
REDIS_URL=redis://localhost:6379/0
MILVUS_HOST=localhost
MILVUS_PORT=19530
SECRET_KEY=your-secret-key
LOG_LEVEL=INFO
```

## 📈 Мониторинг

Система включает встроенный мониторинг:
- Health check endpoints
- Метрики производительности
- Логирование всех операций
- Статистика использования

## 🤖 Алгоритмы

### Гибридная система рекомендаций:
- **40%** - Семантический поиск (векторное сходство)
- **35%** - Коллаборативная фильтрация (похожие пользователи)
- **25%** - Контентная фильтрация (атрибуты товаров)

### NLP Pipeline:
1. Очистка и нормализация текста
2. Токенизация и лемматизация
3. Классификация намерений
4. Извлечение именованных сущностей
5. Генерация векторных представлений
6. Анализ тональности

## 🐛 Устранение неполадок

### Проблемы с Docker:
```bash
# Пересборка контейнеров
docker-compose down
docker-compose up --build --force-recreate

# Очистка Docker
docker system prune -a
```

### Проблемы с Milvus:
```bash
# Проверка статуса
curl http://localhost:9091/health

# Пересоздание коллекции
python -c "
from pymilvus import utility, connections
connections.connect()
utility.drop_collection('item_embeddings')
"
```

### Проблемы с PostgreSQL:
```bash
# Подключение к БД
docker exec -it <postgres_container> psql -U postgres -d choice_db

# Проверка таблиц
\\dt
```

## 📄 Лицензия

MIT License - см. файл LICENSE

## 👥 Участие в разработке

1. Форкните репозиторий
2. Создайте feature ветку
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📞 Поддержка

По вопросам и проблемам создавайте Issues в репозитории.
'''

# Создаем файлы
os.makedirs("tests", exist_ok=True)

with open("data/load_data.py", "w", encoding="utf-8") as f:
    f.write(data_loader_content)

with open("tests/__init__.py", "w") as f:
    f.write("")

with open("tests/test_main.py", "w", encoding="utf-8") as f:
    f.write(test_main_content)

with open("README.md", "w", encoding="utf-8") as f:
    f.write(readme_content)

print("✅ Дополнительные файлы созданы:")
print("- data/load_data.py (скрипт загрузки данных)")
print("- tests/test_main.py (тесты)")
print("- README.md (документация)")

# Создаем файл .env для примера
env_content = '''# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/choice_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Milvus
MILVUS_HOST=localhost
MILVUS_PORT=19530

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API
API_V1_PREFIX=/api/v1

# ML Models
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
SPACY_MODEL=ru_core_news_sm

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
'''

with open(".env.example", "w", encoding="utf-8") as f:
    f.write(env_content)

print("- .env.example (пример конфигурации)")
print("\n" + "="*60)
print("🎉 ВСЕ ФАЙЛЫ ПРОЕКТА СОЗДАНЫ УСПЕШНО!")
print("="*60)