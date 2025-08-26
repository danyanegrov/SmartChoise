@echo off
echo 🚀 Запускаем React приложение SmartChoice AI...

cd /d "%~dp0"

:: Устанавливаем переменные окружения
set "PATH=C:\Program Files\nodejs;%PATH%"
set "NODE_OPTIONS=--max_old_space_size=4096"

echo 🔍 Проверяем окружение...

:: Проверяем наличие Node.js
"C:\Program Files\nodejs\node.exe" --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js не найден в C:\Program Files\nodejs\
    echo 📖 Установите Node.js с https://nodejs.org
    echo 💡 Или проверьте путь установки
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('"C:\Program Files\nodejs\node.exe" --version') do set NODE_VERSION=%%i
echo ✅ Node.js найден: %NODE_VERSION%

:: Проверяем наличие .env файла
if not exist ".env" (
    if exist "env.example" (
        echo 📝 Создаем .env файл из шаблона...
        copy env.example .env >nul
    ) else (
        echo 📝 Создаем базовый .env файл...
        echo VITE_API_URL=http://localhost:3001/api > .env
        echo VITE_APP_NAME=SmartChoice AI >> .env
    )
)

:: Проверяем наличие node_modules
if not exist "node_modules" (
    echo 📦 Зависимости не найдены. Запустите install-react.bat
    echo 🔧 Пытаемся установить автоматически...
    "C:\Program Files\nodejs\npm.cmd" install --legacy-peer-deps
    if %ERRORLEVEL% neq 0 (
        echo ❌ Ошибка установки зависимостей
        echo 💡 Запустите install-react.bat вручную
        pause
        exit /b 1
    )
)

:: Проверяем основные зависимости
if not exist "node_modules\react" (
    echo ❌ React не установлен корректно
    echo 💡 Запустите install-react.bat
    pause
    exit /b 1
)

if not exist "node_modules\vite" (
    echo ❌ Vite не установлен корректно
    echo 💡 Запустите install-react.bat
    pause
    exit /b 1
)

echo ✅ Все зависимости проверены
echo.
echo 🎯 Запускаем режим разработки...
echo.
echo 📖 Приложение будет доступно по адресу:
echo    🎨 React Frontend: http://localhost:3000
echo    🔗 Backend API: http://localhost:3001 (должен быть запущен отдельно)
echo.
echo 💡 Полезные команды:
echo    • Ctrl+C - остановить сервер
echo    • r + Enter - перезапустить
echo    • o + Enter - открыть в браузере
echo.
echo 🚀 Запускаем...

:: Запускаем Vite dev server с автo-открытием браузера
start "SmartChoice React Dev" cmd /c ""C:\Program Files\nodejs\npm.cmd" run dev -- --open"

:: Резервное открытие браузера через 5 секунд, если по каким-то причинам не открылся автоматически
timeout /t 5 /nobreak >nul
start "" http://localhost:3000

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ Ошибка запуска
    echo 💡 Попробуйте:
    echo    1. Закрыть другие приложения на порту 3000
    echo    2. Перезапустить терминал как администратор
    echo    3. Проверить, что backend запущен на порту 3001
    pause
)
