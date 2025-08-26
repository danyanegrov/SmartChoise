@echo off
echo 🌐 Запускаем frontend сервер...

:: Проверяем наличие Python
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Python не найден. Устанавливаем через WinGet...
    winget install Python.Python.3.11
    if %ERRORLEVEL% neq 0 (
        echo ❌ Не удалось установить Python
        echo 📖 Установите Python вручную с https://python.org
        pause
        exit /b 1
    )
)

echo ✅ Python найден
echo 🚀 Запускаем HTTP сервер на порту 3000...
echo.
echo 📖 Откройте в браузере:
echo    🧪 Тест интеграции: http://localhost:3000/test-integration.html
echo    🔐 Авторизация:     http://localhost:3000/auth.html
echo    🏠 Главная:         http://localhost:3000/index.html
echo.
echo 💡 Для остановки нажмите Ctrl+C
echo.

python -m http.server 3000
