@echo off
title SmartChoice AI - Backend Server

echo 🔗 Starting Backend API Server...
echo.

cd /d "%~dp0"

:: Fix path with quotes
set "NODEJS_PATH=C:\Program Files\nodejs"
set "PATH=%NODEJS_PATH%;%PATH%"

echo 🔍 Node.js path: %NODEJS_PATH%
echo 📂 Current directory: %CD%
echo.

:: Test Node.js
echo 🔧 Testing Node.js...
"%NODEJS_PATH%\node.exe" --version
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js test failed
    pause
    exit /b 1
)

:: Setup environment
if not exist ".env" (
    echo 📝 Creating .env file...
    echo PORT=3001 > .env
    echo DATABASE_URL=file:./dev.db >> .env
    echo JWT_SECRET=your-secret-key-here >> .env
) else (
    echo ✅ .env file exists
)

:: Set environment variables explicitly
set PORT=3001
set DATABASE_URL=file:./dev.db
set JWT_SECRET=decision-helper-dev-secret-2024

:: Install if needed
if not exist "node_modules" (
    echo 📦 Installing backend dependencies...
    "%NODEJS_PATH%\npm.cmd" install
    if %ERRORLEVEL% neq 0 (
        echo ❌ Backend installation failed
        pause
        exit /b 1
    )
)

:: Setup database
if not exist "prisma\dev.db" (
    echo 🗄️ Setting up database...
    set DATABASE_URL=file:./dev.db
    "%NODEJS_PATH%\npx.cmd" prisma migrate dev --name init
)

echo 🎯 Starting backend server...
echo.
echo 📖 Backend API will be available at:
echo    ➤ http://localhost:3001
echo    ➤ Health check: http://localhost:3001/health
echo.
echo 💡 Press Ctrl+C to stop the server
echo.

:: Start backend
"%NODEJS_PATH%\node.exe" src/server.js

echo.
echo Backend server stopped.
pause
