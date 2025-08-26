@echo off
echo Запускаем с прямым путем к Node.js...
echo.

REM Проверяем разные возможные пути
set NODE_PATH=""

if exist "C:\Program Files\nodejs\node.exe" (
    set NODE_PATH=C:\Program Files\nodejs
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set NODE_PATH=C:\Program Files (x86)\nodejs
)

if %NODE_PATH%=="" (
    echo ❌ Node.js не найден! 
    echo Найдите папку с node.exe и сообщите мне путь
    pause
    exit /b 1
)

echo ✅ Используем Node.js из: %NODE_PATH%
echo.

REM Добавляем в PATH для этой сессии
set PATH=%NODE_PATH%;%PATH%

echo Проверяем версии:
node --version
npm --version

echo.
echo Устанавливаем зависимости...
npm install

echo.
echo Настраиваем окружение...
if not exist .env (
    echo Создаем .env файл...
    copy env.example .env
)

echo.
echo Генерируем Prisma клиент...
npx prisma generate

echo.
echo Применяем миграции базы данных...
npx prisma migrate dev --name init

echo.
echo 🚀 Запускаем сервер...
npm run dev
