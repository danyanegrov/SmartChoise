@echo off
echo 🚀 Starting React Development Server...
echo.

cd /d "%~dp0"

:: Set Node.js path
set "PATH=C:\Program Files\nodejs;%PATH%"

:: Check Node.js
echo 🔍 Checking Node.js...
"C:\Program Files\nodejs\node.exe" --version
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js not found
    pause
    exit /b 1
)

:: Check npm
echo 🔍 Checking npm...
"C:\Program Files\nodejs\npm.cmd" --version
if %ERRORLEVEL% neq 0 (
    echo ❌ npm not found
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules\vite" (
    echo 📦 Installing dependencies...
    "C:\Program Files\nodejs\npm.cmd" install
)

echo.
echo 🎯 Starting Vite dev server...
echo 📖 Server will be available at:
echo    ➤ Local: http://localhost:3000
echo    ➤ Network: http://localhost:3000
echo.
echo 💡 Press Ctrl+C to stop
echo.

:: Start Vite
"C:\Program Files\nodejs\npm.cmd" run dev

echo.
echo Server stopped.
pause
