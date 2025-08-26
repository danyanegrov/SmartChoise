@echo off
title 📁 SmartChoice AI - Copy to English Folder

echo ========================================
echo 📁 Copying project to English folder...
echo ========================================
echo.

cd /d "%~dp0"

:: Check if we're in the right directory
if not exist "react-app" (
    echo ❌ Error: react-app folder not found
    echo Make sure this script is in the project root folder
    pause
    exit /b 1
)

:: Go to parent directory (Desktop)
cd ..

:: Create new folder with English name
set "NEW_FOLDER=smartchoice-ai-project"

echo 🗂️ Creating new folder: %NEW_FOLDER%
if exist "%NEW_FOLDER%" (
    echo ⚠️ Folder %NEW_FOLDER% already exists
    set /p choice="Delete and recreate? (y/n): "
    if /i "!choice!"=="y" (
        echo 🗑️ Removing old folder...
        rmdir /s /q "%NEW_FOLDER%"
    ) else (
        echo ❌ Operation cancelled
        pause
        exit /b 1
    )
)

mkdir "%NEW_FOLDER%"

echo 📋 Copying all files...
echo This may take a few moments...
echo.

:: Copy all files excluding problematic folders
xcopy "Решение 2\*" "%NEW_FOLDER%\" /E /I /H /Y /EXCLUDE:exclude.txt

:: Create exclude list for node_modules (they're large and can be reinstalled)
echo node_modules > exclude.txt
echo .git >> exclude.txt
echo dist >> exclude.txt

echo.
echo ✅ Copy completed!
echo.
echo 📂 New project location: %CD%\%NEW_FOLDER%
echo.
echo 🚀 Next steps:
echo 1. cd %NEW_FOLDER%
echo 2. cd react-app
echo 3. npm install
echo 4. npm run dev
echo.

set /p choice="🚀 Open new folder now? (y/n): "
if /i "%choice%"=="y" (
    explorer "%NEW_FOLDER%"
    cd "%NEW_FOLDER%"
    echo.
    echo 📍 You are now in: %CD%
    echo.
    echo 💡 To start React app:
    echo    cd react-app
    echo    npm install  
    echo    npm run dev
)

:: Clean up
if exist exclude.txt del exclude.txt

pause
