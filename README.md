# 🧠 SmartChoice AI - Интеллектуальная система рекомендаций

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.28+-red.svg)](https://streamlit.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org)
[![Milvus](https://img.shields.io/badge/Milvus-2.3+-orange.svg)](https://milvus.io)

## 📖 Описание проекта

SmartChoice AI - это интеллектуальная система рекомендаций, использующая современные технологии машинного обучения и обработки естественного языка для предоставления персонализированных рекомендаций пользователям.

### 🎯 Основные возможности

- **🧠 NLP обработка** - Анализ запросов на русском языке с извлечением сущностей и намерений
- **🎯 Гибридные рекомендации** - Комбинация семантического поиска, коллаборативной фильтрации и контент-базированных методов
- **🔍 Векторный поиск** - Использование Milvus для семантического поиска по векторным представлениям
- **📊 Веб-интерфейс** - Современный Streamlit интерфейс для взаимодействия с системой
- **🚀 REST API** - Полнофункциональное FastAPI API для интеграции
- **💾 Многобазовая архитектура** - PostgreSQL для структурированных данных, Redis для кэширования, Milvus для векторных операций

## 🏗️ Архитектура системы

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Databases     │
│   (Streamlit)   │◄──►│   (FastAPI)     │◄──►│   (PostgreSQL,  │
│                 │    │                 │    │    Redis,       │
│                 │    │                 │    │    Milvus)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User          │    │   AI/ML         │    │   Vector        │
│   Interface     │    │   Services      │    │   Operations    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Быстрый старт

### Предварительные требования

- Python 3.11+
- Docker и Docker Compose
- Минимум 8GB RAM
- Минимум 20GB свободного места

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd smartchoice-ai-project
```

### 2. Настройка окружения

```bash
# Копирование файла конфигурации
cp .env.example .env

# Редактирование переменных окружения
# Отредактируйте .env файл под ваши настройки
```

### 3. Запуск с Docker

```bash
# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### 4. Ручная установка (без Docker)

```bash
# Создание виртуального окружения
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows

# Установка зависимостей
pip install -r requirements.txt

# Установка зависимостей для frontend
pip install -r frontend/requirements.txt

# Настройка базы данных
python data/load_data.py

# Запуск backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Запуск frontend (в новом терминале)
cd frontend
streamlit run app.py
```

## 🌐 Доступ к сервисам

После запуска сервисы будут доступны по следующим адресам:

- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Frontend (Streamlit)**: http://localhost:8501
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Milvus**: localhost:19530

## 📁 Структура проекта

```
smartchoice-ai-project/
├── app/                          # Основное приложение
│   ├── main.py                  # Точка входа FastAPI
│   ├── core/                    # Основные компоненты
│   │   ├── config.py           # Конфигурация
│   │   ├── database.py         # Подключения к БД
│   │   └── logging.py          # Система логирования
│   ├── models/                  # Модели данных
│   │   ├── user.py             # Модели пользователей
│   │   ├── choice.py           # Модели товаров и выборов
│   │   └── schemas.py          # Pydantic схемы
│   ├── services/                # AI/ML сервисы
│   │   ├── nlp_service.py      # NLP обработка
│   │   ├── recommendation_service.py  # Рекомендации
│   │   └── vector_service.py   # Векторные операции
│   └── api/                     # API endpoints
│       ├── routes.py            # Основные маршруты
│       └── deps.py              # Зависимости API
├── data/                        # Данные и скрипты
│   ├── sql/                     # SQL скрипты
│   │   └── init.sql            # Инициализация БД
│   ├── sample/                  # Тестовые данные
│   │   └── test_queries.json   # Тестовые запросы
│   └── load_data.py            # Скрипт загрузки данных
├── frontend/                    # Веб-интерфейс
│   ├── app.py                  # Streamlit приложение
│   └── requirements.txt        # Зависимости frontend
├── tests/                       # Тесты
│   └── test_main.py            # Unit и интеграционные тесты
├── docker-compose.yml           # Docker Compose конфигурация
├── Dockerfile                   # Docker образ для backend
├── requirements.txt             # Python зависимости
├── .env.example                # Пример переменных окружения
└── README.md                    # Документация
```

## 🔧 Конфигурация

### Переменные окружения (.env)

```bash
# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/smartchoice
REDIS_URL=redis://localhost:6379/0

# Milvus
MILVUS_HOST=localhost
MILVUS_PORT=19530

# Безопасность
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API
API_V1_PREFIX=/api/v1
PROJECT_NAME=SmartChoice AI

# ML модели
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
SPACY_MODEL=ru_core_news_sm

# Логирование
LOG_LEVEL=INFO
LOG_FILE=logs/app.log

# Streamlit
STREAMLIT_SERVER_PORT=8501
STREAMLIT_SERVER_ADDRESS=0.0.0.0
```

## 🧠 AI/ML компоненты

### NLP Service

**Функциональность:**
- Очистка и токенизация текста
- Извлечение именованных сущностей (NER)
- Классификация намерений пользователя
- Анализ тональности
- Извлечение фильтров из запроса
- Генерация векторных представлений

**Технологии:**
- spaCy для русского языка
- Sentence Transformers для эмбеддингов
- Hugging Face pipelines для анализа тональности

### Recommendation Engine

**Алгоритмы:**
- **Семантический поиск** - Поиск по векторным представлениям
- **Коллаборативная фильтрация** - Анализ поведения пользователей
- **Контент-базированная фильтрация** - Анализ характеристик товаров
- **Гибридный ранжирование** - Комбинация всех методов

**Особенности:**
- Персонализация на основе профиля пользователя
- Объяснение рекомендаций
- Адаптивное обучение на основе обратной связи

### Vector Service

**Возможности:**
- Индексация товаров в векторной базе
- Семантический поиск по схожести
- Обновление и удаление векторов
- Статистика коллекций

**Технологии:**
- Milvus как векторная база данных
- HNSW индекс для быстрого поиска
- 300-мерные эмбеддинги

## 📊 API Endpoints

### Основные endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `GET` | `/api/v1/health` | Проверка здоровья системы |
| `GET` | `/api/v1/health/detailed` | Детальная проверка всех компонентов |
| `POST` | `/api/v1/nlp/process` | NLP обработка текста |
| `POST` | `/api/v1/recommendations` | Получение рекомендаций |
| `GET` | `/api/v1/search` | Поиск товаров |
| `GET` | `/api/v1/categories` | Получение категорий |
| `GET` | `/api/v1/items` | Получение товаров |
| `POST` | `/api/v1/feedback` | Отправка обратной связи |
| `POST` | `/api/v1/vector/search` | Векторный поиск |

### Примеры использования

#### NLP обработка

```bash
curl -X POST "http://localhost:8000/api/v1/nlp/process" \
     -H "Content-Type: application/json" \
     -d '{
       "text": "Найди ноутбук для работы",
       "user_context": {}
     }'
```

#### Получение рекомендаций

```bash
curl -X POST "http://localhost:8000/api/v1/recommendations" \
     -H "Content-Type: application/json" \
     -d '{
       "query": "Найди ноутбук для работы",
       "user_id": 1,
       "filters": {"max_price": 100000},
       "limit": 10
     }'
```

## 🧪 Тестирование

### Запуск тестов

```bash
# Установка pytest
pip install pytest

# Запуск всех тестов
pytest tests/ -v

# Запуск с покрытием
pytest tests/ --cov=app --cov-report=html

# Запуск конкретного теста
pytest tests/test_main.py::TestNLPProcessing::test_nlp_process_success -v
```

### Типы тестов

- **Unit тесты** - Тестирование отдельных компонентов
- **Интеграционные тесты** - Тестирование взаимодействия компонентов
- **API тесты** - Тестирование HTTP endpoints
- **Производительность** - Тестирование времени отклика и нагрузки

## 📈 Мониторинг и логирование

### Логирование

Система использует Loguru для структурированного логирования:

- **Консольный вывод** - Для разработки
- **Файловое логирование** - Для продакшена
- **Ротация логов** - Автоматическое управление размером файлов
- **Различные уровни** - DEBUG, INFO, WARNING, ERROR

### Метрики

- Время отклика API
- Точность рекомендаций
- Использование ресурсов
- Статистика запросов

## 🚀 Развертывание

### Docker Compose (рекомендуется)

```bash
# Продакшен
docker-compose -f docker-compose.yml up -d

# Остановка
docker-compose down

# Перезапуск
docker-compose restart
```

### Kubernetes

```bash
# Применение манифестов
kubectl apply -f k8s/

# Проверка статуса
kubectl get pods -n smartchoice
```

### Облачные платформы

- **Railway** - Простое развертывание
- **Heroku** - Поддержка Python
- **AWS ECS** - Масштабируемость
- **Google Cloud Run** - Serverless

## 🔒 Безопасность

### Аутентификация

- JWT токены для API
- Хеширование паролей
- Защита от брутфорс атак

### Валидация данных

- Pydantic схемы для валидации
- Санитизация пользовательского ввода
- Защита от SQL инъекций

### CORS и безопасность

- Настройка CORS для frontend
- Rate limiting для API
- Логирование подозрительной активности

## 📚 Документация API

Полная документация API доступна по адресу:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 Вклад в проект

### Установка для разработки

```bash
# Клонирование
git clone <repository-url>
cd smartchoice-ai-project

# Создание ветки
git checkout -b feature/your-feature-name

# Установка зависимостей для разработки
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Запуск тестов
pytest tests/ -v

# Проверка качества кода
flake8 app/
black app/
isort app/
```

### Стандарты кода

- **Python**: PEP 8, Black, isort
- **Type hints**: Обязательны для всех функций
- **Docstrings**: Google style для документации
- **Тесты**: Минимум 80% покрытия

## 🐛 Устранение неполадок

### Частые проблемы

#### 1. Ошибка подключения к базе данных

```bash
# Проверка статуса PostgreSQL
docker-compose ps postgres

# Просмотр логов
docker-compose logs postgres

# Проверка переменных окружения
echo $DATABASE_URL
```

#### 2. Milvus не запускается

```bash
# Проверка ресурсов
docker stats

# Перезапуск Milvus
docker-compose restart milvus

# Проверка логов
docker-compose logs milvus
```

#### 3. Медленная работа NLP

```bash
# Проверка загрузки моделей
docker-compose logs app | grep "Loading model"

# Проверка использования памяти
docker stats app
```

### Логи и отладка

```bash
# Просмотр всех логов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f app

# Логи с временными метками
docker-compose logs -f --timestamps
```

## 📞 Поддержка

### Каналы связи

- **Issues**: GitHub Issues для багов и предложений
- **Discussions**: GitHub Discussions для вопросов
- **Email**: support@smartchoice-ai.com

### Сообщество

- **Telegram**: @smartchoice_ai
- **Discord**: SmartChoice AI Community
- **Blog**: https://blog.smartchoice-ai.com

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл [LICENSE](LICENSE) для подробностей.

## 🙏 Благодарности

- **FastAPI** - За отличный веб-фреймворк
- **Streamlit** - За простой и мощный frontend
- **Hugging Face** - За предобученные модели
- **Milvus** - За векторную базу данных
- **PostgreSQL** - За надежную реляционную БД

## 🔮 Планы развития

### Краткосрочные (1-3 месяца)

- [ ] Интеграция с внешними API (Яндекс.Маркет, Ozon)
- [ ] Улучшение точности NLP для русского языка
- [ ] Добавление поддержки изображений товаров
- [ ] Мобильное приложение (React Native)

### Среднесрочные (3-6 месяцев)

- [ ] Машинное обучение для персонализации
- [ ] A/B тестирование рекомендаций
- [ ] Интеграция с аналитическими платформами
- [ ] Многоязычная поддержка

### Долгосрочные (6+ месяцев)

- [ ] Генерация контента с помощью GPT
- [ ] Компьютерное зрение для анализа товаров
- [ ] Голосовые интерфейсы
- [ ] Интеграция с IoT устройствами

---

**SmartChoice AI** - Делаем выбор умным! 🧠✨
