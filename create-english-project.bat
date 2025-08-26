@echo off
title 📁 SmartChoice AI - Create English Project

echo ========================================
echo 📁 Creating English project folder...
echo ========================================
echo.

cd /d "%~dp0"

:: Go to Desktop
cd ..

:: Create new folder
set "NEW_FOLDER=smartchoice-ai-project"

if exist "%NEW_FOLDER%" (
    echo ⚠️ Folder already exists, removing...
    rmdir /s /q "%NEW_FOLDER%"
)

mkdir "%NEW_FOLDER%"
cd "%NEW_FOLDER%"

echo 📋 Copying project files...

:: Copy specific files and folders
xcopy "..\Решение 2\*.js" . /Y >nul 2>&1
xcopy "..\Решение 2\*.html" . /Y >nul 2>&1
xcopy "..\Решение 2\*.css" . /Y >nul 2>&1
xcopy "..\Решение 2\*.md" . /Y >nul 2>&1
xcopy "..\Решение 2\*.bat" . /Y >nul 2>&1
xcopy "..\Решение 2\*.json" . /Y >nul 2>&1
xcopy "..\Решение 2\*.txt" . /Y >nul 2>&1

:: Copy directories
if exist "..\Решение 2\src" xcopy "..\Решение 2\src" src\ /E /I /Y >nul 2>&1
if exist "..\Решение 2\prisma" xcopy "..\Решение 2\prisma" prisma\ /E /I /Y >nul 2>&1
if exist "..\Решение 2\ml-service" xcopy "..\Решение 2\ml-service" ml-service\ /E /I /Y >nul 2>&1

:: Copy React app
if exist "..\Решение 2\react-app" (
    echo 📁 Copying React app...
    mkdir react-app
    xcopy "..\Решение 2\react-app\src" react-app\src\ /E /I /Y >nul 2>&1
    xcopy "..\Решение 2\react-app\public" react-app\public\ /E /I /Y >nul 2>&1
    xcopy "..\Решение 2\react-app\*.json" react-app\ /Y >nul 2>&1
    xcopy "..\Решение 2\react-app\*.ts" react-app\ /Y >nul 2>&1
    xcopy "..\Решение 2\react-app\*.html" react-app\ /Y >nul 2>&1
    xcopy "..\Решение 2\react-app\*.bat" react-app\ /Y >nul 2>&1
    xcopy "..\Решение 2\react-app\*.md" react-app\ /Y >nul 2>&1
    xcopy "..\Решение 2\react-app\env.example" react-app\ /Y >nul 2>&1
)

echo.
echo ✅ Project copied successfully!
echo.
echo 📂 New location: %CD%
echo.
echo 🚀 To start the React app:
echo.
echo   cd react-app
echo   npm install
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.

explorer .

pause
