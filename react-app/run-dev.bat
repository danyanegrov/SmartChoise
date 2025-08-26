@echo off
echo Starting React Dev Server...

cd /d "%~dp0"

set "PATH=C:\Program Files\nodejs;%PATH%"

echo Starting Vite dev server on port 3000...
echo.
echo After server starts, open: http://localhost:3000
echo.
echo Press Ctrl+C to stop
echo.

npm run dev
