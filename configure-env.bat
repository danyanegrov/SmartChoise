@echo off
echo Настраиваем переменные окружения...
echo.

echo Создаем простой .env файл для начала работы
echo.

echo # Decision Helper Environment Configuration > .env
echo NODE_ENV=development >> .env
echo PORT=3001 >> .env
echo. >> .env
echo # База данных (SQLite для начала - проще) >> .env
echo DATABASE_URL="file:./dev.db" >> .env
echo. >> .env
echo # JWT секрет (ИЗМЕНИТЕ В ПРОДАКШЕНЕ!) >> .env
echo JWT_SECRET="decision-helper-dev-secret-key-2024" >> .env
echo JWT_EXPIRES_IN=24h >> .env
echo. >> .env
echo # Redis (пока отключен) >> .env
echo # REDIS_URL=redis://localhost:6379 >> .env
echo. >> .env
echo # Frontend URL >> .env
echo FRONTEND_URL=http://localhost:3000 >> .env
echo. >> .env
echo # Внешние API (добавьте когда получите ключи) >> .env
echo # HUGGINGFACE_API_KEY=your-key-here >> .env
echo # GOOGLE_CLIENT_ID=your-google-id >> .env
echo # GOOGLE_CLIENT_SECRET=your-google-secret >> .env

echo ✅ .env файл создан с базовыми настройками
echo.
echo ⚠️  ВАЖНО: Для полной функциональности получите:
echo    - Hugging Face API ключ: https://huggingface.co/settings/tokens
echo    - Google OAuth данные: https://console.developers.google.com/
echo.
pause
