@echo off
echo Ищем и настраиваем Node.js...
echo.

echo Проверяем возможные местоположения Node.js:
echo.

if exist "C:\Program Files\nodejs\node.exe" (
    echo ✅ Найден в: C:\Program Files\nodejs\
    set NODE_PATH=C:\Program Files\nodejs
    goto :found
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    echo ✅ Найден в: C:\Program Files (x86)\nodejs\
    set NODE_PATH=C:\Program Files (x86)\nodejs
    goto :found
)

echo ❌ Node.js не найден в стандартных местах
echo Пожалуйста, найдите папку с node.exe и сообщите мне путь
pause
exit /b 1

:found
echo.
echo Добавляем в PATH для текущей сессии...
set PATH=%NODE_PATH%;%PATH%

echo Проверяем работу:
node --version
npm --version

echo.
echo ✅ Node.js настроен для текущей сессии!
echo.
echo Для постоянного добавления в PATH:
echo 1. Откройте "Переменные среды" в Windows
echo 2. Добавьте %NODE_PATH% в переменную PATH
echo.
pause
