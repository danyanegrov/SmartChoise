@echo off
title SmartChoice AI - System Test

echo 🧪 Testing SmartChoice AI System...
echo.

cd /d "%~dp0"

:: Test backend
echo 🔗 Testing Backend (http://localhost:3001/health)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/health' -TimeoutSec 5; Write-Host '✅ Backend is running!' -ForegroundColor Green; Write-Host $response.Content } catch { Write-Host '❌ Backend not accessible' -ForegroundColor Red }"

echo.

:: Test React
echo 🎨 Testing React Frontend (http://localhost:3000)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 5; Write-Host '✅ React Frontend is running!' -ForegroundColor Green } catch { Write-Host '❌ React Frontend not accessible' -ForegroundColor Red }"

echo.

:: Test alternative React port
echo 🎨 Testing React Frontend (http://localhost:5173)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5173' -TimeoutSec 5; Write-Host '✅ React Frontend is running on 5173!' -ForegroundColor Green } catch { Write-Host '❌ React Frontend not accessible on 5173' -ForegroundColor Red }"

echo.
echo 📖 Test completed!
echo.
echo 💡 If services are not running:
echo    1. Run start-backend-fixed.bat in one window
echo    2. Run react-app\start-simple.bat in another window
echo    3. Wait 30-60 seconds and test again
echo.

pause
