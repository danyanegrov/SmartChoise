# Система интеллектуального выбора

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
venv\Scripts\activate     # Windows
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
\dt
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
