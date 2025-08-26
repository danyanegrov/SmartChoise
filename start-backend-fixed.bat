@echo off
title SmartChoice AI - Backend Server

echo 🔗 Starting Backend API Server...
echo.

cd /d "%~dp0"

:: Fix path with quotes
set "NODEJS_PATH=C:\Program Files\nodejs"

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

:: Setup environment variables
echo 📝 Setting up environment...
set PORT=3001
set DATABASE_URL=file:./dev.db
set JWT_SECRET=decision-helper-dev-secret-2024
set NODE_ENV=development

echo ✅ Environment variables set:
echo    PORT=%PORT%
echo    DATABASE_URL=%DATABASE_URL%
echo.

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

:: Check database
if not exist "prisma\dev.db" (
    echo 🗄️ Setting up database...
    "%NODEJS_PATH%\npx.cmd" prisma migrate dev --name init
    if %ERRORLEVEL% neq 0 (
        echo ⚠️ Database setup had issues, continuing...
    )
)

echo 🎯 Starting backend server...
echo.
echo 📖 Backend API will be available at:
echo    ➤ http://localhost:3001
echo    ➤ Health check: http://localhost:3001/health
echo.
echo 💡 Press Ctrl+C to stop the server
echo.

:: Start backend with environment
"%NODEJS_PATH%\node.exe" src/server.js

echo.
echo Backend server stopped.
pause
