@echo off
title 🧪 SmartChoice AI - Тест интеграции React + Backend

echo ========================================
echo 🧪 SmartChoice AI - Тест интеграции
echo ========================================
echo.

cd /d "%~dp0"

:: Цвета для вывода
set "GREEN=[32m"
set "RED=[31m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "NC=[0m"

echo %BLUE%🔍 Проверяем компоненты системы...%NC%
echo.

:: 1. Проверяем Node.js
echo %BLUE%1. Проверяем Node.js...%NC%
"C:\Program Files\nodejs\node.exe" --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "tokens=*" %%i in ('"C:\Program Files\nodejs\node.exe" --version') do set NODE_VERSION=%%i
    echo %GREEN%✅ Node.js: !NODE_VERSION!%NC%
) else (
    echo %RED%❌ Node.js не найден%NC%
    goto :error
)

:: 2. Проверяем Backend
echo %BLUE%2. Проверяем Backend API...%NC%
curl -s http://localhost:3001/health >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo %GREEN%✅ Backend API доступен на http://localhost:3001%NC%
) else (
    echo %YELLOW%⚠️ Backend API недоступен%NC%
    echo %YELLOW%   Запустите: run-server-simple.bat%NC%
    set "BACKEND_MISSING=1"
)

:: 3. Проверяем React зависимости
echo %BLUE%3. Проверяем React приложение...%NC%
cd react-app
if exist "node_modules\react" (
    echo %GREEN%✅ React зависимости установлены%NC%
) else (
    echo %YELLOW%⚠️ React зависимости не найдены%NC%
    echo %YELLOW%   Запустите: install-react.bat%NC%
    set "REACT_DEPS_MISSING=1"
)

if exist "src\App.tsx" (
    echo %GREEN%✅ React исходники найдены%NC%
) else (
    echo %RED%❌ React исходники не найдены%NC%
    goto :error
)

:: 4. Проверяем конфигурацию
echo %BLUE%4. Проверяем конфигурацию...%NC%
if exist ".env" (
    echo %GREEN%✅ Конфигурация .env найдена%NC%
) else (
    if exist "env.example" (
        echo %YELLOW%📝 Создаем .env из шаблона...%NC%
        copy env.example .env >nul
        echo %GREEN%✅ Конфигурация создана%NC%
    ) else (
        echo %YELLOW%📝 Создаем базовую конфигурацию...%NC%
        echo VITE_API_URL=http://localhost:3001/api > .env
        echo %GREEN%✅ Конфигурация создана%NC%
    )
)

cd ..

echo.
echo %BLUE%📋 Результаты проверки:%NC%
echo.

if "%BACKEND_MISSING%"=="1" (
    echo %YELLOW%⚠️ Нужно запустить Backend:%NC%
    echo   1. Откройте новый терминал
    echo   2. Выполните: run-server-simple.bat
    echo.
)

if "%REACT_DEPS_MISSING%"=="1" (
    echo %YELLOW%⚠️ Нужно установить зависимости React:%NC%
    echo   1. cd react-app
    echo   2. Выполните: install-react.bat
    echo.
)

if not "%BACKEND_MISSING%"=="1" if not "%REACT_DEPS_MISSING%"=="1" (
    echo %GREEN%🎉 Все компоненты готовы к работе!%NC%
    echo.
    echo %BLUE%🚀 Варианты запуска:%NC%
    echo.
    echo 1. %GREEN%Автоматический запуск всей системы:%NC%
    echo    launch-smartchoice.bat
    echo.
    echo 2. %GREEN%Только React (если backend уже запущен):%NC%
    echo    cd react-app
    echo    start-react.bat
    echo.
    echo 3. %GREEN%Тестирование API:%NC%
    echo    Откройте: http://localhost:3001/health
    echo.
    echo 4. %GREEN%React приложение:%NC%
    echo    Откройте: http://localhost:3000
    echo.
    
    echo %BLUE%💡 Рекомендуется:%NC%
    echo    1. Запустите launch-smartchoice.bat
    echo    2. Выберите "1. React + TypeScript версия"
    echo    3. Дождитесь запуска обеих частей
    echo    4. Откройте http://localhost:3000
    echo.
    
    set /p choice="🚀 Запустить автоматически? (y/n): "
    if /i "%choice%"=="y" (
        echo.
        echo %GREEN%🚀 Запускаем полную систему...%NC%
        call launch-smartchoice.bat
    )
) else (
    echo %YELLOW%⚠️ Система не готова к запуску%NC%
    echo %YELLOW%   Исправьте указанные проблемы и запустите тест снова%NC%
)

echo.
pause
goto :end

:error
echo.
echo %RED%❌ Критическая ошибка в настройке%NC%
echo %RED%   Проверьте установку Node.js и структуру проекта%NC%
echo.
pause

:end
