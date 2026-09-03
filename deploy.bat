@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo   [ULTIMATUM] Starting Deployment on Windows
echo ========================================================

REM 1. Ensure .env.local exists
if not exist ".env.local" (
    if exist "env.local.txt" (
        copy "env.local.txt" ".env.local"
        echo Created .env.local from env.local.txt
    )
)

REM 2. Ensure PM2 and global npm paths are in PATH
set "PATH=%APPDATA%\npm;%ProgramFiles%\nodejs;%PATH%"

REM 3. Pull latest code from GitHub
echo.
echo >>> [1/4] Pulling latest changes from GitHub...
call git pull origin main

REM 4. Install dependencies
echo.
echo >>> [2/4] Installing dependencies...
call npm.cmd install --production=false

REM 5. Build Next.js production bundle
echo.
echo >>> [3/4] Compiling Next.js production build...
call npm.cmd run build

REM 6. Start or reload with PM2
echo.
echo >>> [4/4] Starting / Reloading PM2 process...
call pm2.cmd describe ultimatum >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call pm2.cmd reload ultimatum
) else (
    call pm2.cmd start server.js --name ultimatum
    call pm2.cmd save
)

echo.
echo ========================================================
echo   [SUCCESS] Ultimatum is updated and live on PM2!
echo   Local Address: http://localhost:3000
echo ========================================================
