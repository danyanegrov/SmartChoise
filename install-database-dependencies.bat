@echo off
echo Installing database integration dependencies...

echo.
echo Installing backend dependencies...
npm install clsx tailwind-merge class-variance-authority

echo.
echo Installing frontend dependencies...
cd react-app
npm install @radix-ui/react-slot @radix-ui/react-label

echo.
echo Dependencies installed successfully!
echo.
echo Next steps:
echo 1. Ensure CSV files are in the data/ folder
echo 2. Start the backend: npm run dev
echo 3. Start the frontend: cd react-app && npm run dev
echo.
echo Database integration is ready!
pause
