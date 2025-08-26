@echo off
echo 🧪 Тестируем Decision Helper API...
echo.

echo 1. Health Check:
curl -s http://localhost:3001/health
echo.
echo.

echo 2. Регистрация пользователя:
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\",\"age\":25,\"personalityType\":\"introvert\",\"anxietyLevel\":5}"
echo.
echo.

echo 3. Проверяем что база данных создалась:
if exist "dev.db" (
    echo ✅ База данных dev.db создана
) else (
    echo ❌ База данных не найдена
)

echo.
echo Тестирование завершено!
pause
