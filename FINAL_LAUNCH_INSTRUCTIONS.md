# 🚀 SmartChoice AI - Complete System Launch Instructions

## 🎯 System Overview

SmartChoice AI теперь полностью интегрирован с:
- ✅ **CSV Database**: Интеграция с файлами в папке `data/`
- ✅ **Perplexity AI API**: Интеграция с API ключом `pplx-2jyBHimJNjcuup0Td6M1AeegMrXv4rM`
- ✅ **Enhanced Algorithms**: Алгоритмы работают с базой данных
- ✅ **Modern UI**: React + TypeScript + Shadcn/ui компоненты

## 🚀 Quick Start

### Вариант 1: Автоматический запуск (Рекомендуется)
```bash
# Запустите файл start-complete-system.bat
start-complete-system.bat
```

### Вариант 2: Ручной запуск
```bash
# 1. Установка зависимостей backend
npm install

# 2. Установка зависимостей frontend
cd react-app
npm install

# 3. Запуск backend (в первом терминале)
npm run dev

# 4. Запуск frontend (во втором терминале)
cd react-app
npm run dev
```

## 🌐 Доступные URL

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🧪 Тестирование системы

### Автоматическое тестирование
```bash
test-complete-system.bat
```

### Ручное тестирование

#### 1. Проверка Backend API
```bash
# Health check
curl http://localhost:3001/health

# Database API
curl http://localhost:3001/api/database/stats

# Perplexity API
curl http://localhost:3001/api/perplexity/test
```

#### 2. Проверка Frontend
1. Откройте http://localhost:3000
2. Войдите в систему (demo режим доступен)
3. Проверьте навигацию:
   - **База данных** - Исследование CSV базы данных
   - **Perplexity AI** - Тестирование AI API
   - **Алгоритмы** - Работа с базой данных

## 🗄️ Database Integration Features

### Доступные CSV файлы:
- `decision_database_main.csv` - Основная база решений
- `users_profiles.csv` - Профили пользователей
- `decision_criteria.csv` - Критерии решений
- `decision_categories.csv` - Категории решений
- `expert_evaluations.csv` - Экспертные оценки
- `decision_outcomes.csv` - Результаты решений

### API Endpoints:
- `GET /api/database/stats` - Статистика базы данных
- `GET /api/database/categories` - Категории решений
- `GET /api/database/criteria` - Критерии решений
- `GET /api/database/decisions/category/:category` - Решения по категории
- `POST /api/database/recommendations` - Персональные рекомендации
- `POST /api/database/decisions/analyze` - Анализ решений

## 🤖 Perplexity AI Integration

### API Endpoints:
- `GET /api/perplexity/test` - Тест соединения
- `POST /api/perplexity/insights` - Анализ решений
- `POST /api/perplexity/market-analysis` - Анализ рынка
- `POST /api/perplexity/expert-advice` - Экспертные советы
- `POST /api/perplexity/query` - Пользовательские запросы

### Функциональность:
- **Decision Insights**: AI-анализ решений
- **Market Analysis**: Комплексный анализ рынка
- **Expert Advice**: Профессиональные рекомендации
- **Custom Queries**: Пользовательские запросы к AI

## 🔧 Enhanced Algorithms

### 1. EnhancedEmotionAI
- Интеграция с базой данных для рекомендаций по снижению тревожности
- Персональные советы на основе профиля пользователя

### 2. EnhancedAHPAlgorithm
- Динамические критерии из базы данных
- Автоматическое определение весов на основе исторических данных

### 3. EnhancedTOPSISAlgorithm
- Исторические результаты для улучшения точности
- Контекстные рекомендации

### 4. EnhancedContextualBandit
- Персональные рекомендации на основе базы данных
- Адаптивное обучение

### 5. DatabaseDecisionAnalyzer
- Комплексный анализ решений
- Поиск похожих случаев
- Экспертные оценки

## 🎨 UI Components

### Shadcn/ui Components:
- `Card` - Карточки для отображения информации
- `Button` - Кнопки с различными вариантами
- `Input` - Поля ввода
- `Textarea` - Многострочные поля ввода
- `Badge` - Бейджи для статусов
- `Label` - Подписи к полям

### Страницы:
- **DatabasePage** - Главная страница базы данных
- **PerplexityPage** - Главная страница Perplexity AI
- **DatabaseExplorer** - Исследование базы данных
- **DatabaseDecisionAnalyzer** - Анализ решений
- **PerplexityTester** - Тестирование AI API

## 🔍 Troubleshooting

### Проблема: Backend не запускается
```bash
# Проверьте порт 3001
netstat -an | findstr :3001

# Проверьте зависимости
npm list
```

### Проблема: Frontend не запускается
```bash
# Проверьте порт 3000
netstat -an | findstr :3000

# Очистите кэш
npm run build
```

### Проблема: CSV файлы не загружаются
```bash
# Проверьте наличие файлов
dir data\*.csv

# Проверьте права доступа
icacls data\
```

### Проблема: Perplexity API не работает
```bash
# Проверьте API ключ
echo pplx-2jyBHimJNjcuup0Td6M1AeegMrXv4rM

# Проверьте соединение
curl -H "Authorization: Bearer pplx-2jyBHimJNjcuup0Td6M1AeegMrXv4rM" \
     https://api.perplexity.ai/chat/completions
```

## 📊 System Status Check

### Команда для проверки статуса:
```bash
# Backend health
curl http://localhost:3001/health

# Database status
curl http://localhost:3001/api/database/stats

# Perplexity test
curl http://localhost:3001/api/perplexity/test
```

## 🎯 Next Steps

1. **Запустите систему** используя `start-complete-system.bat`
2. **Протестируйте функциональность** через `test-complete-system.bat`
3. **Исследуйте базу данных** в разделе "База данных"
4. **Протестируйте Perplexity AI** в разделе "Perplexity AI"
5. **Попробуйте алгоритмы** с интеграцией базы данных

## 📞 Support

При возникновении проблем:
1. Проверьте логи в консоли браузера
2. Проверьте логи backend сервера
3. Убедитесь, что все CSV файлы присутствуют в папке `data/`
4. Проверьте, что API ключ Perplexity корректный

---

**🎉 Система готова к использованию! Запускайте и тестируйте!**
