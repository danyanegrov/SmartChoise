# 🚀 Полная инструкция по установке Decision Helper

## 📋 Что я создал для вас

Я разработал полную backend архитектуру для вашего приложения Decision Helper согласно техническому заданию:

### ✅ Реализованные компоненты:

1. **Node.js Backend API** с Express.js
2. **PostgreSQL база данных** с Prisma ORM
3. **Redis кэширование**
4. **JWT аутентификация** + Google OAuth
5. **ML микросервис** на Python/FastAPI
6. **Docker конфигурация** для всех сервисов
7. **Полные API endpoints** для всех функций

## 🛠️ Что нужно установить вам

### 1. Установите основные инструменты:

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Docker и Docker Compose
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER

# Python 3.11+ (для ML сервиса)
sudo apt-get install python3.11 python3.11-pip python3.11-venv
```

### 2. Настройте переменные окружения:

```bash
# Скопируйте файл окружения
cp env.example .env

# Отредактируйте .env файл
nano .env
```

**Обязательные настройки в .env:**
```bash
# База данных
DATABASE_URL="postgresql://decision_user:decision_password_2024@localhost:5432/decision_helper_db"

# JWT секрет (ИЗМЕНИТЕ!)
JWT_SECRET="ваш-супер-секретный-ключ-для-jwt"

# Hugging Face API (для ИИ)
HUGGINGFACE_API_KEY="получите на https://huggingface.co/settings/tokens"

# Google OAuth (опционально)
GOOGLE_CLIENT_ID="ваш-google-client-id"
GOOGLE_CLIENT_SECRET="ваш-google-client-secret"
```

### 3. Установите зависимости:

```bash
# Установите Node.js зависимости
npm install

# Установите Python зависимости для ML сервиса
cd ml-service
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows
pip install -r requirements.txt
cd ..
```

## 🚀 Запуск приложения

### Вариант 1: Docker (РЕКОМЕНДУЕТСЯ)

```bash
# Запустите все сервисы
docker-compose up -d

# Проверьте статус
docker-compose ps

# Посмотрите логи
docker-compose logs -f

# Остановите сервисы
docker-compose down
```

### Вариант 2: Ручной запуск

```bash
# Терминал 1: Запустите базу данных
docker run --name postgres -e POSTGRES_DB=decision_helper_db -e POSTGRES_USER=decision_user -e POSTGRES_PASSWORD=decision_password_2024 -p 5432:5432 -d postgres:15

# Терминал 2: Запустите Redis
docker run --name redis -p 6379:6379 -d redis:7-alpine

# Терминал 3: Настройте базу данных
npx prisma migrate dev
npx prisma generate

# Терминал 4: Запустите backend
npm run dev

# Терминал 5: Запустите ML сервис
cd ml-service
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

## 🔗 Проверьте что работает

После запуска проверьте эти адреса:

- **Backend API**: http://localhost:3001/health
- **ML Service**: http://localhost:8000/health
- **API Docs**: http://localhost:3001/api-docs
- **ML Docs**: http://localhost:8000/docs
- **Database Admin**: http://localhost:5050 (логин: admin@decision-helper.com, пароль: admin_password_2024)

## 🧪 Тестирование API

### Регистрация пользователя:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "age": 25,
    "personalityType": "introvert",
    "anxietyLevel": 5
  }'
```

### Создание простого решения:
```bash
# Сначала получите токен из регистрации, затем:
curl -X POST http://localhost:3001/api/decisions/simple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Выбор ресторана",
    "description": "Не могу решить куда пойти ужинать",
    "options": [
      {"text": "Итальянский ресторан", "rating": 4},
      {"text": "Японский ресторан", "rating": 5},
      {"text": "Мексиканский ресторан", "rating": 3}
    ]
  }'
```

## 🔧 Интеграция с фронтендом

### Подключите ваш существующий frontend:

1. **Обновите app.js** для использования API вместо localStorage:

```javascript
// Замените localStorage на API вызовы
class SmartChoiceAI {
  constructor() {
    this.apiUrl = 'http://localhost:3001/api';
    this.token = localStorage.getItem('authToken');
  }

  async makeApiRequest(endpoint, method = 'GET', data = null) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null
    });

    return response.json();
  }

  // Обновите методы для использования API
  async getSimpleRecommendation() {
    const questionText = document.getElementById('simple-question').value.trim();
    const options = this.getOptionsFromForm();

    const result = await this.makeApiRequest('/decisions/simple', 'POST', {
      title: questionText,
      description: questionText,
      options: options
    });

    this.displaySimpleResult(result.aiRecommendation, options);
  }
}
```

2. **Добавьте аутентификацию** на ваши страницы:

```javascript
// Проверка аутентификации
async function checkAuth() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const response = await fetch('http://localhost:3001/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      localStorage.removeItem('authToken');
      window.location.href = '/login.html';
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/login.html';
  }
}

// Вызывайте при загрузке страницы
document.addEventListener('DOMContentLoaded', checkAuth);
```

## 🎯 Следующие шаги

### 1. Миграция на React (по вашему ТЗ):
```bash
# Создайте React приложение
npx create-react-app frontend --template typescript
cd frontend
npm install @mui/material @emotion/react @emotion/styled
npm install zustand axios react-router-dom
```

### 2. Получите API ключи:
- **Hugging Face**: https://huggingface.co/settings/tokens
- **Google OAuth**: https://console.developers.google.com/
- **Sentry** (мониторинг): https://sentry.io/

### 3. Настройте production deployment:
```bash
# Для production используйте
docker-compose -f docker-compose.prod.yml up -d
```

## ❗ Возможные проблемы и решения

### 1. Ошибка подключения к базе данных:
```bash
# Проверьте статус PostgreSQL
docker ps | grep postgres

# Перезапустите базу данных
docker-compose restart postgres
```

### 2. Ошибки Prisma:
```bash
# Сбросьте и пересоздайте базу
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

### 3. ML сервис не запускается:
```bash
# Проверьте Python зависимости
cd ml-service
pip install -r requirements.txt --upgrade

# Запустите с отладкой
python -m uvicorn app.main:app --reload --log-level debug
```

### 4. CORS ошибки:
```bash
# Добавьте ваш frontend URL в CORS_ORIGINS в .env
FRONTEND_URL=http://localhost:3000
```

## 📞 Поддержка

Если возникают проблемы:

1. **Проверьте логи**: `docker-compose logs -f`
2. **Проверьте health endpoints**: http://localhost:3001/health
3. **Проверьте переменные окружения** в .env файле
4. **Убедитесь что все порты свободны**: 3001, 5432, 6379, 8000

## 🎉 Поздравляю!

Теперь у вас есть полноценный backend для Decision Helper с:
- ✅ Аутентификацией и авторизацией
- ✅ Тремя типами решений с ИИ
- ✅ Аналитикой и историей
- ✅ ML алгоритмами
- ✅ Масштабируемой архитектурой

Вы можете начинать интегрировать с вашим frontend или мигрировать на React!
