@echo off
echo Устанавливаем Decision Helper Backend...
echo.

echo Шаг 1: Создаем .env файл
copy env.example .env
echo ✅ .env файл создан

echo.
echo Шаг 2: Устанавливаем зависимости
npm install
echo ✅ Зависимости установлены

echo.
echo Шаг 3: Создаем папки для логов
mkdir logs 2>nul
echo ✅ Папки созданы

echo.
echo 🎉 Проект готов к настройке!
echo.
echo СЛЕДУЮЩИЕ ШАГИ:
echo 1. Отредактируйте .env файл
echo 2. Запустите setup-database.bat
echo.
pause
