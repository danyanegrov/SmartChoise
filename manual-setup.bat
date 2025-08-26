@echo off
echo РУЧНАЯ НАСТРОЙКА DECISION HELPER
echo.
echo Если автоматические скрипты не работают, сделайте это:
echo.
echo 1. Найдите папку с node.exe (например C:\Program Files\nodejs\)
echo 2. Откройте PowerShell в папке проекта
echo 3. Выполните команды:
echo.
echo    "C:\Program Files\nodejs\node.exe" --version
echo    "C:\Program Files\nodejs\npm.exe" install
echo    "C:\Program Files\nodejs\npx.exe" prisma generate
echo    "C:\Program Files\nodejs\npx.exe" prisma migrate dev --name init
echo    "C:\Program Files\nodejs\npm.exe" run dev
echo.
echo (замените путь на свой путь к Node.js)
echo.
pause
