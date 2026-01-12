@echo off
REM Pepasur Quick Setup Script for Windows
REM Run this to set up the entire project quickly

echo 🐸 Pepasur Quick Setup
echo ======================
echo.

REM Check prerequisites
echo Checking prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js v18+
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm not found. Please install npm
    exit /b 1
)

echo ✅ Prerequisites OK
echo.

REM Setup contract
echo 📜 Setting up contracts...
cd contract
call npm install
if errorlevel 1 exit /b 1
echo ✅ Contract dependencies installed
cd ..

REM Setup backend
echo 🔧 Setting up backend...
cd backend
call npm install
if errorlevel 1 exit /b 1
echo ✅ Backend dependencies installed
cd ..

REM Setup frontend
echo 🎨 Setting up frontend...
cd frontend
call npm install
if errorlevel 1 exit /b 1
echo ✅ Frontend dependencies installed
cd ..

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Deploy contracts: cd contract ^&^& npm run deploy
echo 2. Configure .env files with contract addresses
echo 3. Start backend: cd backend ^&^& npm run dev
echo 4. Start frontend: cd frontend ^&^& npm run dev
echo.
echo See QUICK_DEPLOYMENT_GUIDE.md for detailed instructions
pause