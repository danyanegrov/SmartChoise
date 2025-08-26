@echo off
echo 🏗️ Сборка production версии React приложения...

cd /d "%~dp0"

:: Проверяем зависимости
if not exist "node_modules" (
    echo 📦 Устанавливаем зависимости...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo ❌ Ошибка установки зависимостей
        pause
        exit /b 1
    )
)

echo 🔍 Проверяем типы TypeScript...
npm run type-check
if %ERRORLEVEL% neq 0 (
    echo ⚠️ Найдены ошибки TypeScript, но продолжаем сборку...
)

echo 🏗️ Собираем production версию...
npm run build

if %ERRORLEVEL% equ 0 (
    echo ✅ Сборка завершена успешно!
    echo 📂 Файлы находятся в папке: dist/
    echo.
    echo 🌐 Для запуска production сервера используйте:
    echo    npm run preview
    echo.
    echo 📖 Или разместите содержимое папки dist/ на веб-сервере
) else (
    echo ❌ Ошибка сборки
)

pause
