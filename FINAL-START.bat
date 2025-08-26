@echo off
title SmartChoice AI - FINAL START

echo ========================================
echo 🧠 SmartChoice AI - ФИНАЛЬНЫЙ ЗАПУСК
echo ========================================
echo.

cd /d "C:\Users\Luchka_DS\Desktop\smartchoice-ai-project"

echo 🔧 Настройка окружения...
set "PATH=C:\Program Files\nodejs;%PATH%"
set "DATABASE_URL=file:./dev.db"
set "PORT=3001"
set "JWT_SECRET=secret"

echo ✅ Переменные установлены
echo.

echo 🔗 Запуск Backend в фоне...
start "Backend API" cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && set DATABASE_URL=file:./dev.db && set PORT=3001 && set JWT_SECRET=secret && node src/server.js && pause"

echo ⏳ Ждем 5 секунд для запуска backend...
timeout /t 5 /nobreak >nul

echo 🎨 Запуск React Frontend...
cd react-app

if not exist "node_modules\vite" (
    echo 📦 Быстрая установка зависимостей...
    "C:\Program Files\nodejs\npm.cmd" install --no-audit --no-fund
)

echo 🚀 Запуск Vite dev server...
start "React Frontend" cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && npx vite --port 3000 --host 0.0.0.0 --open && pause"

echo.
echo ✅ Система запускается!
echo.
echo 📖 Через 30-60 секунд откроется:
echo    🔗 Backend: http://localhost:3001/health
echo    🎨 Frontend: http://localhost:3000
echo.
echo 💡 Если не откроется автоматически:
echo    - Откройте http://localhost:3000 вручную
echo    - Или попробуйте http://localhost:5173
echo.

timeout /t 15 /nobreak >nul
start http://localhost:3000
start http://localhost:5173

echo 🎉 Готово! Проверьте браузер!
pause
