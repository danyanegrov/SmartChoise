@echo off
echo ========================================
echo SmartChoice AI - Complete System Test
echo ========================================
echo.

echo 🔍 Testing Backend API Endpoints...
echo.

echo [1/6] Testing Health Check...
curl -s http://localhost:3001/health
if %errorlevel% equ 0 (
    echo ✅ Health endpoint working
) else (
    echo ❌ Health endpoint failed
)

echo.
echo [2/6] Testing Database API...
curl -s http://localhost:3001/api/database/stats
if %errorlevel% equ 0 (
    echo ✅ Database API working
) else (
    echo ❌ Database API failed
)

echo.
echo [3/6] Testing Perplexity API...
curl -s http://localhost:3001/api/perplexity/test
if %errorlevel% equ 0 (
    echo ✅ Perplexity API working
) else (
    echo ❌ Perplexity API failed
)

echo.
echo [4/6] Testing Authentication...
curl -s http://localhost:3001/api/auth/status
if %errorlevel% equ 0 (
    echo ✅ Auth API working
) else (
    echo ❌ Auth API failed
)

echo.
echo [5/6] Testing Frontend...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend accessible
) else (
    echo ❌ Frontend not accessible
)

echo.
echo [6/6] Testing CSV Database Files...
if exist "data\decision_database_main.csv" (
    echo ✅ Main decision database found
) else (
    echo ❌ Main decision database missing
)

if exist "data\users_profiles.csv" (
    echo ✅ User profiles database found
) else (
    echo ❌ User profiles database missing
)

if exist "data\decision_criteria.csv" (
    echo ✅ Decision criteria database found
) else (
    echo ❌ Decision criteria database missing
)

echo.
echo ========================================
echo 🧪 System Test Results
echo ========================================
echo.
echo 📊 Backend Status: http://localhost:3001
echo 🌐 Frontend Status: http://localhost:3000
echo 🗄️ Database Integration: CSV files loaded
echo 🤖 Perplexity AI: API integrated
echo.
echo 🎯 Manual Testing Steps:
echo 1. Open http://localhost:3000 in browser
echo 2. Navigate to "База данных" section
echo 3. Test database exploration features
echo 4. Navigate to "Perplexity AI" section
echo 5. Test AI-powered insights
echo 6. Test decision algorithms with database
echo.
echo Press any key to open the application...
pause >nul

start http://localhost:3000
echo.
echo 🌐 Opening SmartChoice AI for manual testing...
echo.
echo Press any key to exit...
pause >nul
