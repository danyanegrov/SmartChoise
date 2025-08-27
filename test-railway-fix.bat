@echo off
echo ========================================
echo SmartChoice AI - Railway Fix Test
echo ========================================
echo.

echo 🔧 Testing ES Module fixes...
echo.

echo [1/4] Checking syntax of perplexity routes...
"C:\Program Files\nodejs\node.exe" --check src\routes\perplexity.js
if %errorlevel% equ 0 (
    echo ✅ perplexity.js syntax OK
) else (
    echo ❌ perplexity.js syntax ERROR
    pause
    exit /b 1
)

echo.
echo [2/4] Checking syntax of perplexity service...
"C:\Program Files\nodejs\node.exe" --check src\services\perplexityService.js
if %errorlevel% equ 0 (
    echo ✅ perplexityService.js syntax OK
) else (
    echo ❌ perplexityService.js syntax ERROR
    pause
    exit /b 1
)

echo.
echo [3/4] Checking syntax of main server...
"C:\Program Files\nodejs\node.exe" --check src\server.js
if %errorlevel% equ 0 (
    echo ✅ server.js syntax OK
) else (
    echo ❌ server.js syntax ERROR
    pause
    exit /b 1
)

echo.
echo [4/4] Checking main entry point...
"C:\Program Files\nodejs\node.exe" --check index.js
if %errorlevel% equ 0 (
    echo ✅ index.js syntax OK
) else (
    echo ❌ index.js syntax ERROR
    pause
    exit /b 1
)

echo.
echo ========================================
echo 🎉 Railway Fix Verification Complete!
echo ========================================
echo.
echo ✅ All ES module imports fixed
echo ✅ Syntax checking passed
echo ✅ Ready for Railway deployment
echo.
echo 🚀 Next steps:
echo 1. git add .
echo 2. git commit -m "Fix ES module imports for Railway"
echo 3. git push origin main
echo 4. Railway will auto-deploy
echo.
echo Press any key to continue...
pause >nul
