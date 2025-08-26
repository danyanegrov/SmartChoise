@echo off
title SmartChoice AI - Master Launcher

echo ========================================
echo 🧠 SmartChoice AI - Complete System
echo ========================================
echo.

cd /d "%~dp0"

:: Check Node.js
set "NODEJS_PATH=C:\Program Files\nodejs"
if not exist "%NODEJS_PATH%\node.exe" (
    echo ❌ Node.js not found at: %NODEJS_PATH%
    echo 📖 Please install Node.js from: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

echo 🚀 Starting SmartChoice AI system...
echo.
echo 📖 This will open 2 windows:
echo    1. 🔗 Backend API Server (port 3001)
echo    2. 🎨 React Frontend (port 3000)
echo.

set /p choice="Continue? (y/n): "
if /i not "%choice%"=="y" exit /b 0

echo.
echo 🔗 Starting Backend API Server...
start "SmartChoice Backend" cmd /c "start-backend-simple.bat"

echo ⏳ Waiting for backend to start (5 seconds)...
timeout /t 5 /nobreak >nul

echo 🎨 Starting React Frontend...
start "SmartChoice React" cmd /c "cd react-app && start-simple.bat"

echo.
echo ✅ System is starting!
echo.
echo 📖 Open these URLs in your browser:
echo    🔗 Backend Health: http://localhost:3001/health
echo    🎨 Frontend App: http://localhost:3000
echo.
echo 💡 Wait 30-60 seconds for everything to load
echo 🛑 Close both terminal windows to stop
echo.

:: Auto-open browser after delay
timeout /t 10 /nobreak >nul
start http://localhost:3000

pause
