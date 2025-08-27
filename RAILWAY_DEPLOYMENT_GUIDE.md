# 🚀 SmartChoice AI - Railway Deployment Guide

## 📋 Pre-Deployment Checklist

✅ **Готово к деплою!** Проект приведен в соответствие с требованиями Railway:

- ✅ `index.js` - главный файл приложения
- ✅ `package.json` - обновлен с правильными скриптами и engines
- ✅ `railway.json` - конфигурация Railway
- ✅ `.gitignore` - исключает ненужные файлы
- ✅ `Dockerfile` - альтернативный способ деплоя
- ✅ CORS настроен для Railway домена
- ✅ Порт настроен через `process.env.PORT`

## 🌐 Railway Deployment Steps

### 1. Подготовка GitHub Repository

```bash
# Если еще не инициализирован Git
git init
git add .
git commit -m "Initial commit - Ready for Railway deployment"

# Создайте репозиторий на GitHub и пушьте код
git remote add origin https://github.com/yourusername/smartchoice-ai.git
git branch -M main
git push -u origin main
```

### 2. Создание проекта на Railway

1. **Зайдите на Railway**: https://railway.com
2. **Нажмите "Start a New Project"**
3. **Выберите "Deploy from GitHub repo"**
4. **Подключите ваш GitHub репозиторий**
5. **Выберите репозиторий `smartchoice-ai`**

### 3. Настройка переменных окружения

В разделе **Variables** вашего проекта добавьте:

#### 🔐 Обязательные переменные:
```env
NODE_ENV=production
PORT=3000
```

#### 🤖 Perplexity AI API:
```env
PERPLEXITY_API_KEY=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
```

#### 🗄️ База данных (если используется):
```env
DATABASE_URL=your_database_url_here
```

#### 🔒 JWT и Auth (если нужно):
```env
JWT_SECRET=your_super_secret_jwt_key_here
SESSION_SECRET=your_session_secret_here
```

#### 🌐 CORS (опционально):
```env
FRONTEND_URL=https://your-frontend-domain.com
```

### 4. Конфигурация деплоя

Railway автоматически определит настройки из `railway.json`:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

### 5. Мониторинг деплоя

1. **Следите за логами** во вкладке "Deployments"
2. **Проверьте статус** во вкладке "Metrics"
3. **Тестируйте API** через предоставленный URL

## 🔧 Важные настройки для SmartChoice AI

### CSV Database Files
Убедитесь, что папка `data/` и все CSV файлы присутствуют в репозитории:
- `decision_database_main.csv`
- `users_profiles.csv`
- `decision_criteria.csv`
- `decision_categories.csv`
- `expert_evaluations.csv`
- `decision_outcomes.csv`
- `user_decision_links.csv`

### Perplexity API Integration
API ключ Perplexity уже интегрирован в код. Убедитесь, что переменная окружения установлена.

### Health Check Endpoint
Ваше приложение имеет эндпоинт для проверки здоровья:
```
GET https://your-app.railway.app/health
```

## 🌍 Post-Deployment Testing

### 1. Проверьте основные эндпоинты:

```bash
# Health check
curl https://your-app.railway.app/health

# Database API
curl https://your-app.railway.app/api/database/stats

# Perplexity API test
curl https://your-app.railway.app/api/perplexity/test
```

### 2. Проверьте логи в Railway Dashboard

### 3. Тестируйте функциональность через frontend

## 🚨 Troubleshooting

### Проблема: Build fails
**Решение**: Проверьте логи сборки в Railway Dashboard. Обычно проблемы связаны с:
- Отсутствующими зависимостями в `package.json`
- Неправильными скриптами
- Проблемами с синтаксисом в коде

### Проблема: App crashes on startup
**Решение**:
1. Проверьте переменные окружения
2. Убедитесь, что порт настроен правильно
3. Проверьте логи приложения в Railway

### Проблема: CSV files not found
**Решение**:
1. Убедитесь, что папка `data/` включена в Git
2. Проверьте `.gitignore` - папка `data/` должна быть доступна
3. Проверьте пути в коде `src/services/databaseService.js`

### Проблема: CORS errors
**Решение**:
1. Добавьте URL Railway в переменные окружения `FRONTEND_URL`
2. Проверьте настройки CORS в `src/server.js`

### Проблема: Perplexity API not working
**Решение**:
1. Проверьте API ключ в переменных окружения
2. Убедитесь, что есть интернет соединение на Railway
3. Проверьте лимиты API ключа

## 🎯 Production Checklist

После успешного деплоя:

- [ ] Health check работает
- [ ] Database API возвращает данные
- [ ] Perplexity API integration работает
- [ ] Логи показывают корректный запуск
- [ ] Нет ошибок CORS
- [ ] Все эндпоинты отвечают
- [ ] CSV файлы загружаются корректно

## 📊 Monitoring

Railway предоставляет:
- **Метрики производительности**
- **Логи приложения**
- **Статистику использования ресурсов**
- **Алерты при сбоях**

## 🔄 CI/CD

Railway автоматически:
- **Деплоит при пуше в main ветку**
- **Создает preview deployments для PR**
- **Откатывается к предыдущей версии при сбое**

## 📞 Support

При проблемах с деплоем:
1. Проверьте документацию Railway
2. Посмотрите логи в Dashboard
3. Проверьте статус Railway: https://status.railway.com
4. Обратитесь в поддержку Railway

---

## 🚀 Quick Deploy Commands

```bash
# 1. Подготовьте код
git add .
git commit -m "Ready for Railway deployment"
git push origin main

# 2. В Railway Dashboard:
# - Connect GitHub repo
# - Set environment variables
# - Deploy!

# 3. Тестируйте
curl https://your-app.railway.app/health
```

**🎉 Ваш SmartChoice AI готов к деплою на Railway!**
