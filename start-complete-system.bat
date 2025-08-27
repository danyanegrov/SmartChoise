@echo off
echo ========================================
echo SmartChoice AI - Complete System Startup
echo ========================================
echo.

echo [1/5] Installing Backend Dependencies...
cd /d "%~dp0"
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

echo.
echo [2/5] Installing Frontend Dependencies...
cd /d "%~dp0\react-app"
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed

echo.
echo [3/5] Starting Backend Server...
cd /d "%~dp0"
start "Backend Server" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo [4/5] Starting Frontend Development Server...
cd /d "%~dp0\react-app"
start "Frontend Server" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo [5/5] System Status Check...
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo 🚀 System Startup Complete!
echo ========================================
echo.
echo 📍 Backend: http://localhost:3001
echo 📍 Frontend: http://localhost:3000
echo 📍 Database: Integrated CSV files
echo 📍 Perplexity API: Integrated
echo.
echo 🔍 Testing API endpoints...
echo.

REM Test backend health
echo Testing Backend Health...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is responding
) else (
    echo ⚠️ Backend may still be starting up
)

echo.
echo 🎯 Next Steps:
echo 1. Wait for both servers to fully start
echo 2. Open http://localhost:3000 in your browser
echo 3. Test the database integration
echo 4. Test Perplexity API functionality
echo.
echo Press any key to open the application...
pause >nul

start http://localhost:3000
echo.
echo 🌐 Opening SmartChoice AI in your browser...
echo.
echo Press any key to exit this script...
pause >nul
