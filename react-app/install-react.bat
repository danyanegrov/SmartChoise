@echo off
echo 📦 Устанавливаем зависимости React приложения...

cd /d "%~dp0"

:: Устанавливаем переменные окружения
set "PATH=C:\Program Files\nodejs;%PATH%"
set "NODE_PATH=C:\Program Files\nodejs\node_modules"

echo 🔧 Node.js path: C:\Program Files\nodejs
echo 📂 Working directory: %CD%

:: Проверяем Node.js
"C:\Program Files\nodejs\node.exe" --version
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js не найден! Установите Node.js с https://nodejs.org
    pause
    exit /b 1
)

:: Очищаем кеш npm если нужно
echo 🧹 Очищаем npm кеш...
"C:\Program Files\nodejs\npm.cmd" cache clean --force

:: Устанавливаем зависимости
echo 📦 Устанавливаем зависимости...
"C:\Program Files\nodejs\npm.cmd" install --legacy-peer-deps

if %ERRORLEVEL% equ 0 (
    echo ✅ Установка завершена успешно!
    echo.
    echo 🚀 Для запуска используйте:
    echo    start-react.bat
) else (
    echo ❌ Ошибка установки
    echo 💡 Попробуйте:
    echo    1. Перезапустить как администратор
    echo    2. Обновить Node.js до последней версии
    echo    3. Очистить папку node_modules и попробовать снова
)

pause
