# ==============================================================================
# Ultimatum Platform - Windows Server Deploy / Update Script
# Run this script anytime you want to bring changes from GitHub to your live site
# Usage: powershell -ExecutionPolicy Bypass -File .\deployment\deploy.ps1
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  [ULTIMATUM] Starting Deployment on Windows Server     " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Navigate to project root directory
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Resolve-Path "$SCRIPT_DIR\.."
Set-Location $PROJECT_ROOT
Write-Host "Working Directory: $PROJECT_ROOT" -ForegroundColor Gray

# 1. Pull latest code from GitHub
Write-Host "`n>>> [1/4] Pulling latest changes from GitHub..." -ForegroundColor Yellow
git pull origin main

# 2. Install / verify dependencies
Write-Host "`n>>> [2/4] Installing/verifying npm dependencies..." -ForegroundColor Yellow
npm.cmd install --production=false

# 3. Build production bundle
Write-Host "`n>>> [3/4] Compiling Next.js production build..." -ForegroundColor Yellow
npm.cmd run build

# Auto-copy env.local.txt to .env.local if needed
if (-not (Test-Path ".env.local") -and (Test-Path "env.local.txt")) {
    Copy-Item "env.local.txt" ".env.local"
    Write-Host "Created .env.local from env.local.txt" -ForegroundColor Green
}

# Refresh PATH and ensure npm global path is included
$env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$npmGlobalPath = "$env:APPDATA\npm"
if ($env:PATH -notlike "*$npmGlobalPath*") {
    $env:PATH = "$npmGlobalPath;$env:PATH"
}

# 4. Restart or start application with PM2
Write-Host "`n>>> [4/4] Reloading application process with zero downtime..." -ForegroundColor Yellow

$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"

cmd.exe /c "pm2 describe ultimatum" >$null 2>&1
$describeExit = $LASTEXITCODE

if ($describeExit -eq 0) {
    cmd.exe /c "pm2 reload ultimatum"
} else {
    cmd.exe /c "pm2 start server.js --name ultimatum"
    cmd.exe /c "pm2 save"
}

$ErrorActionPreference = $prevErrorAction

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  [SUCCESS] Ultimatum is updated and live!             " -ForegroundColor Green
Write-Host "  Domain: https://ultimatumroom.com                    " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
