@echo off
echo Starting TaxoGuessr...
cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Dependencies not found. Installing...
    call npm install
    if %errorlevel% neq 0 (
        echo Error installing dependencies.
        pause
        exit /b
    )
)

echo Launching application...
call npm start
pause
