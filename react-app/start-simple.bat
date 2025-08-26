@echo off
title SmartChoice AI - React Server

echo 🚀 Starting React Development Server...
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

:: Test npm
echo 🔧 Testing npm...
"%NODEJS_PATH%\npm.cmd" --version
if %ERRORLEVEL% neq 0 (
    echo ❌ npm test failed
    pause
    exit /b 1
)

echo ✅ All tools working
echo.

:: Install if needed
if not exist "node_modules\vite" (
    echo 📦 Installing dependencies...
    "%NODEJS_PATH%\npm.cmd" install --no-optional
    if %ERRORLEVEL% neq 0 (
        echo ❌ Installation failed
        pause
        exit /b 1
    )
)

echo 🎯 Starting Vite dev server...
echo.
echo 📖 After server starts, open in browser:
echo    ➤ http://localhost:3000
echo    ➤ Or check the console output for the actual URL
echo.
echo 💡 Press Ctrl+C to stop the server
echo.

:: Start with explicit paths
"%NODEJS_PATH%\npx.cmd" vite --host 0.0.0.0 --port 3000

echo.
echo Server stopped.
pause
