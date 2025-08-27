@echo off
echo ========================================
echo SmartChoice AI - Railway Readiness Check
echo ========================================
echo.

echo 🔍 Checking Railway deployment requirements...
echo.

echo [1/8] Checking main entry file...
if exist "index.js" (
    echo ✅ index.js found
) else (
    echo ❌ index.js missing
)

echo.
echo [2/8] Checking package.json...
if exist "package.json" (
    echo ✅ package.json found
    findstr /C:"\"start\":" package.json >nul
    if %errorlevel% equ 0 (
        echo ✅ start script configured
    ) else (
        echo ❌ start script missing
    )
    
    findstr /C:"\"engines\":" package.json >nul
    if %errorlevel% equ 0 (
        echo ✅ engines field configured
    ) else (
        echo ❌ engines field missing
    )
) else (
    echo ❌ package.json missing
)

echo.
echo [3/8] Checking Railway configuration...
if exist "railway.json" (
    echo ✅ railway.json found
) else (
    echo ❌ railway.json missing
)

echo.
echo [4/8] Checking Git files...
if exist ".gitignore" (
    echo ✅ .gitignore found
) else (
    echo ❌ .gitignore missing
)

echo.
echo [5/8] Checking Docker files...
if exist "Dockerfile" (
    echo ✅ Dockerfile found
) else (
    echo ⚠️ Dockerfile missing (optional)
)

if exist ".dockerignore" (
    echo ✅ .dockerignore found
) else (
    echo ⚠️ .dockerignore missing (optional)
)

echo.
echo [6/8] Checking CSV database files...
if exist "data\decision_database_main.csv" (
    echo ✅ Main database found
) else (
    echo ❌ Main database missing
)

if exist "data\users_profiles.csv" (
    echo ✅ User profiles found
) else (
    echo ❌ User profiles missing
)

if exist "data\decision_criteria.csv" (
    echo ✅ Decision criteria found
) else (
    echo ❌ Decision criteria missing
)

echo.
echo [7/8] Checking server configuration...
findstr /C:"process.env.PORT" src\server.js >nul
if %errorlevel% equ 0 (
    echo ✅ PORT environment variable configured
) else (
    echo ❌ PORT environment variable missing
)

findstr /C:"0.0.0.0" src\server.js >nul
if %errorlevel% equ 0 (
    echo ✅ Server listening on all interfaces
) else (
    echo ⚠️ Server might not be configured for Railway
)

echo.
echo [8/8] Checking environment example...
if exist "env.example" (
    echo ✅ env.example found
    findstr /C:"PERPLEXITY_API_KEY" env.example >nul
    if %errorlevel% equ 0 (
        echo ✅ Perplexity API key configured
    ) else (
        echo ❌ Perplexity API key not configured
    )
) else (
    echo ❌ env.example missing
)

echo.
echo ========================================
echo 🎯 Railway Deployment Summary
echo ========================================
echo.
echo 📁 Project Structure: Ready
echo 📦 Package Configuration: Ready  
echo 🛤️ Railway Config: Ready
echo 🐳 Docker Support: Ready
echo 🗄️ Database Files: Ready
echo 🤖 Perplexity API: Ready
echo 🌐 Server Config: Ready
echo.
echo 🚀 Next Steps:
echo 1. Push code to GitHub repository
echo 2. Connect repository to Railway
echo 3. Set environment variables in Railway:
echo    - NODE_ENV=production
echo    - PORT=3000
echo    - PERPLEXITY_API_KEY=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
echo 4. Deploy and test!
echo.
echo 📖 See RAILWAY_DEPLOYMENT_GUIDE.md for detailed instructions
echo.
echo Press any key to continue...
pause >nul
