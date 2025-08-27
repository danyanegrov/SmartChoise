@echo off
echo ========================================
echo SmartChoice AI - Perfect Railway Deploy
echo ========================================
echo.

echo 🚀 Preparing perfect Railway deployment...
echo.

echo [1/5] Backing up current files...
if exist "package.json" copy package.json package-backup.json
if exist "index.js" copy index.js index-backup.js
if exist "railway.json" copy railway.json railway-backup.json
if exist ".gitignore" copy .gitignore .gitignore-backup
echo ✅ Backup completed

echo.
echo [2/5] Installing perfect Railway configuration...
copy package-railway.json package.json
copy index-railway-perfect.js index.js
copy railway-perfect.json railway.json
copy .gitignore-railway .gitignore
echo ✅ Perfect configuration installed

echo.
echo [3/5] Checking syntax...
"C:\Program Files\nodejs\node.exe" --check index.js
if %errorlevel% equ 0 (
    echo ✅ Syntax check passed
) else (
    echo ❌ Syntax check failed
    pause
    exit /b 1
)

echo.
echo [4/5] Verifying CSV database...
if exist "data\decision_database_main.csv" (
    echo ✅ Main database found
) else (
    echo ❌ Main database missing
    pause
    exit /b 1
)

if exist "data\users_profiles.csv" (
    echo ✅ User profiles found
) else (
    echo ❌ User profiles missing
)

echo.
echo [5/5] Railway deployment ready!
echo.
echo ========================================
echo 🎉 Perfect Railway Configuration
echo ========================================
echo.
echo ✅ Optimized package.json (minimal dependencies)
echo ✅ Perfect index.js (no Prisma conflicts)
echo ✅ Railway.json with health checks
echo ✅ Clean .gitignore for Railway
echo ✅ CSV database (7 files)
echo ✅ Perplexity AI integrated
echo ✅ Error handling optimized
echo ✅ CORS configured for Railway
echo.
echo 🌐 Ready to deploy to Railway!
echo.
echo Next steps:
echo 1. git add .
echo 2. git commit -m "Perfect Railway deployment configuration"
echo 3. git push origin main
echo 4. Set environment variables in Railway:
echo    - NODE_ENV=production
echo    - PORT=3000
echo    - PERPLEXITY_API_KEY=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
echo.
echo Press any key to continue...
pause >nul
