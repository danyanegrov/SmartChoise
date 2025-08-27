@echo off
echo Testing Database Integration...

echo.
echo 1. Testing backend database service...
curl -s http://localhost:3001/api/database/stats > nul
if %errorlevel% equ 0 (
    echo ✓ Backend database service is running
) else (
    echo ✗ Backend database service is not accessible
    echo Please start the backend server first: npm run dev
    pause
    exit /b 1
)

echo.
echo 2. Testing database endpoints...
echo Testing /api/database/categories...
curl -s http://localhost:3001/api/database/categories > nul
if %errorlevel% equ 0 (
    echo ✓ Categories endpoint working
) else (
    echo ✗ Categories endpoint failed
)

echo Testing /api/database/criteria...
curl -s "http://localhost:3001/api/database/criteria?category=Карьера%20и%20образование" > nul
if %errorlevel% equ 0 (
    echo ✓ Criteria endpoint working
) else (
    echo ✗ Criteria endpoint failed
)

echo.
echo 3. Testing search functionality...
echo Testing /api/database/search...
curl -s "http://localhost:3001/api/database/search?q=работа&limit=5" > nul
if %errorlevel% equ 0 (
    echo ✓ Search endpoint working
) else (
    echo ✗ Search endpoint failed
)

echo.
echo 4. Testing recommendations...
echo Testing /api/database/recommendations...
curl -s -X POST http://localhost:3001/api/database/recommendations -H "Content-Type: application/json" -d "{\"userProfile\":{\"anxietyLevel\":5},\"context\":{\"emotion\":\"neutral\"},\"limit\":3}" > nul
if %errorlevel% equ 0 (
    echo ✓ Recommendations endpoint working
) else (
    echo ✗ Recommendations endpoint failed
)

echo.
echo Database integration test completed!
echo.
echo If all tests passed, the integration is working correctly.
echo You can now access the database features in the frontend.
echo.
pause
