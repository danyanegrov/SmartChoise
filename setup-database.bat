@echo off
echo Настраиваем базу данных...
echo.

echo Шаг 1: Генерируем Prisma клиент
npx prisma generate
echo ✅ Prisma клиент создан

echo.
echo Шаг 2: Применяем миграции базы данных
npx prisma migrate dev --name init
echo ✅ Миграции применены

echo.
echo 🎉 База данных готова!
echo.
echo Теперь можете запустить: start-server.bat
echo.
pause
