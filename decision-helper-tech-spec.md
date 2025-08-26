# Техническое задание: Веб-приложение "Помощник Принятия Решений"

## 1. ОБЩАЯ ИНФОРМАЦИЯ

**Название проекта:** Decision Helper Web App  
**Тип продукта:** Веб-приложение (SPA)  
**Целевая аудитория:** 18-50 лет, люди с проблемами принятия решений  
**Основная цель:** Снизить тревогу выбора и помочь пользователям принимать решения

## 2. ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ

### 2.1 Основные модули

#### Модуль 1: Пользователи и аутентификация
- Регистрация через email/social login (Google, Facebook)
- Профиль пользователя с настройками личности
- Анкета при регистрации: возраст, тип личности, уровень тревожности (1-10)
- Сессии и авторизация через JWT токены

#### Модуль 2: Простые решения
- Интерфейс для ввода вопроса/проблемы (textarea)
- Добавление 2-5 вариантов решения
- Рейтинговая система оценки каждого варианта (1-5 звезд)
- Кнопка "Получить рекомендацию" с анимацией загрузки
- Отображение результата с объяснением выбора

#### Модуль 3: Сложные решения (MCDA)
- Форма описания сложного решения
- Динамическое добавление критериев важности (до 5 штук)
- Ввод весов критериев (слайдеры 0-100%)
- Матрица оценки вариантов по критериям
- Расчет итогового балла по алгоритму AHP/TOPSIS
- Визуализация результатов в виде таблицы и графика

#### Модуль 4: Случайный выбор
- Поле для добавления вариантов (динамический список)
- Анимированное "колесо выбора" или рулетка
- Кнопка "Крутить колесо" с визуальными эффектами
- Отображение результата со звуковым сигналом

#### Модуль 5: История решений
- Таблица всех принятых решений
- Фильтрация по типу решения и дате
- Возможность пересмотреть детали каждого решения
- Оценка результата решения постфактум (1-5 звезд)
- Экспорт истории в CSV

#### Модуль 6: Аналитика и инсайты
- Дашборд с персональной статистикой
- Анализ паттернов принятия решений
- Рекомендации по улучшению процесса
- Графики распределения типов решений

### 2.2 AI/ML Компоненты

#### Алгоритм 1: Emotion-Aware Decision Tree
- **Вход:** текст проблемы пользователя, варианты, критерии
- **Обработка:** анализ эмоций через Hugging Face API
- **Выход:** корректированные веса критериев + рекомендация
- **API endpoint:** `/api/emotion-decision`

#### Алгоритм 2: Contextual Neural Bandit
- **Вход:** контекст пользователя (время, профиль, история)
- **Обработка:** нейросеть для предсказания успешности вариантов
- **Выход:** ранжированный список рекомендаций
- **API endpoint:** `/api/contextual-recommendation`

#### Алгоритм 3: Behavioral Pattern Analysis
- **Вход:** поведенческие данные (клики, время, изменения)
- **Обработка:** ML модель для выявления паттернов
- **Выход:** персонализированные советы
- **API endpoint:** `/api/behavioral-analysis`

## 3. ТЕХНИЧЕСКАЯ АРХИТЕКТУРА

### 3.1 Frontend (React.js)

#### Структура компонентов:
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ProfileSetup.jsx
│   ├── decisions/
│   │   ├── SimpleDecision.jsx
│   │   ├── ComplexDecision.jsx
│   │   ├── RandomChoice.jsx
│   │   └── DecisionResult.jsx
│   ├── history/
│   │   ├── DecisionHistory.jsx
│   │   └── DecisionDetail.jsx
│   ├── analytics/
│   │   ├── Dashboard.jsx
│   │   └── Charts.jsx
│   └── shared/
│       ├── Header.jsx
│       ├── Sidebar.jsx
│       └── LoadingSpinner.jsx
├── pages/
├── services/
├── hooks/
└── utils/
```

#### Технический стек Frontend:
- **Framework:** React 18+ с TypeScript
- **State Management:** Zustand или Redux Toolkit
- **UI Components:** Material-UI (MUI) или Ant Design
- **Charts:** Chart.js или Recharts
- **HTTP Client:** Axios
- **Routing:** React Router v6
- **Styling:** Styled Components или CSS Modules
- **Build:** Vite

#### Ключевые требования Frontend:
- Адаптивный дизайн (mobile-first)
- Поддержка темной/светлой темы
- Интернационализация (i18n) - русский/английский
- PWA возможности (service worker, offline mode)
- Accessibility (WCAG 2.1 AA)

### 3.2 Backend (Node.js)

#### API Структура:
```
/api/
├── auth/
│   ├── POST /register
│   ├── POST /login
│   ├── GET /profile
│   └── PUT /profile
├── decisions/
│   ├── POST /simple
│   ├── POST /complex
│   ├── POST /random
│   ├── GET /history
│   └── GET /history/:id
├── ml/
│   ├── POST /emotion-decision
│   ├── POST /contextual-recommendation
│   └── POST /behavioral-analysis
├── analytics/
│   ├── GET /dashboard
│   └── GET /insights
└── admin/
    ├── GET /users
    └── GET /statistics
```

#### Технический стек Backend:
- **Runtime:** Node.js 18+
- **Framework:** Express.js или Fastify
- **ORM:** Prisma или TypeORM
- **Validation:** Joi или Zod
- **Authentication:** JWT + Passport.js
- **Testing:** Jest + Supertest
- **Documentation:** Swagger/OpenAPI
- **Logging:** Winston
- **Process Manager:** PM2

### 3.3 База данных

#### Основная БД: PostgreSQL 14+
```sql
-- Основные таблицы
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(100),
    age INTEGER,
    personality_type VARCHAR(50),
    anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE decisions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    decision_type VARCHAR(20) CHECK (decision_type IN ('simple', 'complex', 'random')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    chosen_option TEXT,
    confidence_score DECIMAL(3,2),
    outcome_rating INTEGER CHECK (outcome_rating >= 1 AND outcome_rating <= 5),
    context_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE decision_options (
    id UUID PRIMARY KEY,
    decision_id UUID REFERENCES decisions(id),
    option_text TEXT NOT NULL,
    user_rating INTEGER,
    ai_score DECIMAL(5,4),
    criteria_scores JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_behavior (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    action_type VARCHAR(50),
    page_url VARCHAR(255),
    element_clicked VARCHAR(100),
    time_spent INTEGER, -- в секундах
    hesitation_time INTEGER, -- время до принятия решения
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE algorithm_performance (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    algorithm_type VARCHAR(50),
    input_data JSONB,
    output_data JSONB,
    user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
    processing_time INTEGER, -- в миллисекундах
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Кэширование: Redis 6+
- Сессии пользователей (TTL: 24 часа)
- Результаты ML алгоритмов (TTL: 1 час)
- Часто запрашиваемые решения (TTL: 30 минут)

### 3.4 ML/AI Сервисы

#### Python Microservice для ML
```python
# requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
pandas==2.1.3
scikit-learn==1.3.2
torch==2.1.0
transformers==4.35.2
numpy==1.25.2
redis==5.0.1
```

#### Структура ML сервиса:
```
ml-service/
├── app/
│   ├── models/
│   │   ├── emotion_analyzer.py
│   │   ├── contextual_bandit.py
│   │   └── decision_tree.py
│   ├── api/
│   │   └── endpoints.py
│   ├── core/
│   │   └── config.py
│   └── main.py
├── data/
├── notebooks/
└── tests/
```

## 4. НЕФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ

### 4.1 Производительность
- Время отклика API: < 200ms для простых запросов
- Время обработки ML алгоритмов: < 2 секунды
- Поддержка 1000+ одновременных пользователей
- Время загрузки страницы: < 3 секунды

### 4.2 Безопасность
- HTTPS везде (SSL/TLS сертификат)
- Хэширование паролей (bcrypt)
- Rate limiting: 100 запросов в минуту на пользователя
- Input validation и sanitization
- CORS настройки
- Защита от XSS, CSRF, SQL injection

### 4.3 Надежность
- Uptime: 99.9%
- Автоматическое резервное копирование БД (ежедневно)
- Health checks для всех сервисов
- Graceful degradation при недоступности ML сервисов
- Error monitoring (Sentry)

### 4.4 Масштабируемость
- Горизонтальное масштабирование Node.js приложений
- Database connection pooling
- CDN для статических ресурсов
- Microservices архитектура для ML компонентов

## 5. ИНТЕГРАЦИИ

### 5.1 Внешние API
- **Hugging Face API** для анализа эмоций
- **Google Analytics** для веб-аналитики
- **Sentry** для мониторинга ошибок
- **SendGrid/Mailgun** для email уведомлений

### 5.2 Социальные входы
- Google OAuth 2.0
- Facebook Login
- GitHub OAuth (опционально)

## 6. ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС

### 6.1 Дизайн-система
- **Цветовая палитра:** успокаивающие тона (голубой, зеленый, серый)
- **Типографика:** Inter или Roboto для читаемости
- **Иконки:** Heroicons или Material Icons
- **Анимации:** Framer Motion для плавных переходов

### 6.2 Ключевые страницы
1. **Лендинг** - презентация продукта
2. **Регистрация/Вход** - простая форма
3. **Онбординг** - 3-шаговая настройка профиля
4. **Дашборд** - обзор решений и аналитика
5. **Создание решения** - пошаговая форма
6. **История** - таблица с фильтрами
7. **Настройки** - профиль и предпочтения

### 6.3 UX Принципы
- **Прогрессивное раскрытие** - не перегружать интерфейс
- **Микро-фидбек** - анимации и подтверждения действий
- **Предотвращение ошибок** - валидация в реальном времени
- **Снижение тревоги** - успокаивающие сообщения и цвета

## 7. РАЗВЕРТЫВАНИЕ И ИНФРАСТРУКТУРА

### 7.1 Хостинг
- **Frontend:** Vercel или Netlify
- **Backend:** DigitalOcean App Platform или AWS ECS
- **Database:** AWS RDS PostgreSQL или DigitalOcean Managed Database
- **Redis:** AWS ElastiCache или DigitalOcean Managed Redis
- **ML Service:** AWS Lambda или Google Cloud Run

### 7.2 CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install && npm test
  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: npm run build && vercel deploy
  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: docker build && docker push
```

### 7.3 Мониторинг
- **Application Monitoring:** New Relic или DataDog
- **Error Tracking:** Sentry
- **Log Aggregation:** ELK Stack или Grafana
- **Uptime Monitoring:** Pingdom или StatusCake

## 8. ВРЕМЕННЫЕ РАМКИ И ЭТАПЫ

### Этап 1: MVP (6-8 недель)
**Недели 1-2:** Настройка инфраструктуры и базовая аутентификация
**Недели 3-4:** Простые и сложные решения без AI
**Недели 5-6:** Интеграция базовых ML алгоритмов
**Недели 7-8:** UI/UX полировка и тестирование

### Этап 2: Enhanced MVP (4-6 недель)
**Недели 9-10:** История решений и аналитика
**Недели 11-12:** Emotion-aware алгоритмы
**Недели 13-14:** Behavioral analysis и персонализация

### Этап 3: Production Ready (2-4 недели)
**Недели 15-16:** Production deployment и мониторинг
**Недели 17-18:** Load testing и оптимизация производительности

## 9. КРИТЕРИИ ПРИЕМКИ

### 9.1 Функциональные тесты
- [ ] Пользователь может зарегистрироваться и войти в систему
- [ ] Работают все 3 типа решений (простое, сложное, случайное)
- [ ] AI алгоритмы возвращают релевантные рекомендации
- [ ] История решений сохраняется и отображается корректно
- [ ] Аналитический дашборд показывает актуальную статистику

### 9.2 Производительность
- [ ] Страницы загружаются менее чем за 3 секунды
- [ ] API отвечает менее чем за 200ms
- [ ] ML алгоритмы обрабатывают запросы менее чем за 2 секунды
- [ ] Приложение работает стабильно под нагрузкой 100+ пользователей

### 9.3 Безопасность
- [ ] Все данные передаются по HTTPS
- [ ] Пароли хэшируются перед сохранением
- [ ] Работает rate limiting
- [ ] Нет уязвимостей XSS/CSRF/SQL injection

## 10. КОМАНДА И РОЛИ

### Требуемые специалисты:
- **Frontend Developer** (React/TypeScript) - 1 чел.
- **Backend Developer** (Node.js) - 1 чел.
- **ML Engineer** (Python) - 1 чел.
- **UI/UX Designer** - 0.5 чел.
- **DevOps Engineer** - 0.5 чел.
- **QA Engineer** - 0.5 чел.

### Общий бюджет разработки: $80,000 - $120,000
### Время разработки: 4-6 месяцев

## 11. РИСКИ И МИТИГАЦИЯ

### Технические риски:
- **ML модели показывают низкую точность** → Итеративное улучшение с A/B тестами
- **Проблемы с производительностью** → Раннее load testing и оптимизация
- **Интеграции с внешними API падают** → Fallback механизмы и кэширование

### Продуктовые риски:
- **Низкий user retention** → Gamification и персонализация
- **Сложность использования** → Непрерывное UX тестирование
- **Недостаток данных для ML** → Synthetic data generation на начальном этапе