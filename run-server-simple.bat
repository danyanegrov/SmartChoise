@echo off
echo 🚀 Запускаем Decision Helper Backend...
echo.

REM Устанавливаем переменные окружения
set DATABASE_URL=file:./dev.db
set JWT_SECRET=decision-helper-dev-secret-2024
set PORT=3001
set NODE_ENV=development

echo ✅ Переменные окружения установлены
echo 📍 Сервер будет доступен на: http://localhost:3001
echo 🔍 Health check: http://localhost:3001/health
echo.

REM Запускаем напрямую через node
"C:\Program Files\nodejs\node.exe" src/server.js

echo.
echo Сервер остановлен.
pause
