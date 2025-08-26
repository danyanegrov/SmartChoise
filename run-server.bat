@echo off
echo 🚀 Запускаем Decision Helper Backend...
echo.

REM Устанавливаем переменные окружения
set DATABASE_URL=file:./dev.db
set JWT_SECRET=decision-helper-dev-secret-2024
set PORT=3001
set NODE_ENV=development

REM Добавляем Node.js в PATH
set PATH=C:\Program Files\nodejs;%PATH%

echo ✅ Переменные окружения установлены
echo 📍 Сервер будет доступен на: http://localhost:3001
echo 🔍 Health check: http://localhost:3001/health
echo.

REM Запускаем с помощью npx nodemon
"C:\Program Files\nodejs\npx.exe" nodemon src/server.js

echo.
echo Сервер остановлен.
pause
