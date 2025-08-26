@echo off
title SmartChoice AI - Полный запуск системы

echo ========================================
echo 🧠 SmartChoice AI - Decision Helper
echo ========================================
echo.
echo Выберите версию для запуска:
echo.
echo 1. 🔥 React + TypeScript (Современная версия)
echo 2. 📄 Vanilla JS (Оригинальная версия)
echo 3. 🔧 Только Backend API
echo 4. 🧪 Тестирование интеграции
echo 5. ❌ Выход
echo.
set /p choice="Введите номер (1-5): "

if "%choice%"=="1" goto react
if "%choice%"=="2" goto vanilla
if "%choice%"=="3" goto backend
if "%choice%"=="4" goto test
if "%choice%"=="5" goto exit
goto invalid

:react
echo.
echo 🚀 Запускаем React + TypeScript версию...
echo.

:: Проверяем готовность React зависимостей
cd react-app
if not exist "node_modules" (
    echo 📦 Зависимости React не найдены
    echo 🔧 Пытаемся установить автоматически...
    echo.
    call install-react.bat
    if %ERRORLEVEL% neq 0 (
        echo.
        echo ❌ Не удалось установить зависимости React
        echo 💡 Запустите install-react.bat вручную
        pause
        goto end
    )
)
cd ..

echo 📖 Будет запущено:
echo    🎨 React App: http://localhost:3000
echo    🔗 Backend API: http://localhost:3001
echo.

:: Запускаем backend в фоне
echo ⚙️ Запускаем backend API...
start "SmartChoice Backend API" cmd /c "run-server-simple.bat"

:: Ждем больше времени для запуска backend
echo ⏳ Ждем запуска backend (5 секунд)...
timeout /t 5 /nobreak >nul

:: Проверяем доступность backend
echo 🔍 Проверяем backend...
curl -s http://localhost:3001/health >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Backend запущен и доступен
) else (
    echo ⚠️ Backend пока недоступен (это нормально, дайте еще время)
)

:: Запускаем React
echo.
echo 🎨 Запускаем React приложение...
cd react-app
start "SmartChoice React Frontend" cmd /c "start-react.bat"
cd ..

echo.
echo ✅ Система запускается!
echo.
echo 📖 Откройте в браузере:
echo    🎨 http://localhost:3000 (React Frontend)
echo    🔗 http://localhost:3001/health (Backend Health)
echo.
echo 💡 Если React не откроется автоматически:
echo    1. Подождите 30-60 секунд
echo    2. Откройте http://localhost:3000 вручную
echo    3. Проверьте, что нет ошибок в окне React
echo.
echo 🛑 Для остановки закройте оба окна терминала
goto end

:vanilla
echo.
echo 📄 Запускаем Vanilla JS версию...
echo.
echo 📖 Откроется:
echo    🌐 Frontend: http://localhost:3000
echo    🔗 Backend API: http://localhost:3001
echo.

:: Запускаем backend
echo ⚙️ Запускаем backend...
start "SmartChoice Backend" cmd /c "run-server-simple.bat"

:: Ждем 3 секунды
timeout /t 3 /nobreak >nul

:: Запускаем frontend
echo 🌐 Запускаем frontend сервер...
start "SmartChoice Frontend" cmd /c "start-frontend.bat"

echo.
echo ✅ Система запущена!
echo 📖 Откройте: http://localhost:3000
goto end

:backend
echo.
echo 🔧 Запускаем только Backend API...
echo.
echo 📖 Будет доступен: http://localhost:3001
echo.

start "SmartChoice Backend" cmd /c "run-server-simple.bat"

echo ✅ Backend запущен!
goto end

:test
echo.
echo 🧪 Запускаем тестирование...
echo.

:: Запускаем backend
echo ⚙️ Запускаем backend...
start "SmartChoice Backend" cmd /c "run-server-simple.bat"

:: Ждем 3 секунды
timeout /t 3 /nobreak >nul

:: Запускаем frontend для тестов
echo 🌐 Запускаем тестовый сервер...
start "SmartChoice Test" cmd /c "start-frontend.bat"

echo.
echo ✅ Тестовая среда запущена!
echo 📖 Откройте: http://localhost:3000/test-integration.html
goto end

:invalid
echo.
echo ❌ Неверный выбор. Попробуйте снова.
echo.
goto start

:exit
echo.
echo 👋 До свидания!
goto end

:end
echo.
echo 💡 Для остановки закройте окна или нажмите Ctrl+C
echo.
pause
