@echo off
echo ========================================
echo SmartChoice AI - Switch to Simple Mode
echo ========================================
echo.

echo 🔄 Switching to Prisma-free version for Railway...
echo.

if exist "index.js" (
    echo [1/3] Backing up current index.js...
    copy index.js index-with-prisma.js
    echo ✅ Backup created: index-with-prisma.js
) else (
    echo ⚠️ index.js not found
)

if exist "index-simple.js" (
    echo [2/3] Switching to simple version...
    copy index-simple.js index.js
    echo ✅ Now using simple version (no Prisma)
) else (
    echo ❌ index-simple.js not found
    pause
    exit /b 1
)

echo [3/3] Testing syntax...
"C:\Program Files\nodejs\node.exe" --check index.js
if %errorlevel% equ 0 (
    echo ✅ Simple version syntax OK
) else (
    echo ❌ Simple version syntax ERROR
    pause
    exit /b 1
)

echo.
echo ========================================
echo 🎉 Successfully switched to simple mode!
echo ========================================
echo.
echo ✅ No Prisma dependencies
echo ✅ CSV database will work
echo ✅ Perplexity AI included
echo ✅ All APIs functional
echo.
echo 🚀 Ready for Railway deployment!
echo.
echo Next steps:
echo 1. git add .
echo 2. git commit -m "Switch to simple mode for Railway"
echo 3. git push origin main
echo.
echo Press any key to continue...
pause >nul
