@echo off
echo ==========================================
echo      Fixing TaxoGuessr Installation
echo ==========================================
echo.
echo 1. Removing existing node_modules (this fixes OS mismatches)...
if exist "node_modules" (
    rmdir /s /q node_modules
) else (
    echo node_modules folder not found (skipping removal).
)

echo.
echo 2. Installing dependencies...
echo    (This may take a few minutes, please wait)
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm install failed. Please check your internet connection or Node.js installation.
    pause
    exit /b
)

echo.
echo 3. Installation complete!
echo.
echo Now you can run 'start_game.bat' to launch the app.
pause
