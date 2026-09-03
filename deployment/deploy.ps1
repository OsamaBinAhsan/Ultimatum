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

# 4. Restart or start application with PM2
Write-Host "`n>>> [4/4] Reloading application process with zero downtime..." -ForegroundColor Yellow
$pm2Check = pm2 describe ultimatum 2>&1
if ($LASTEXITCODE -eq 0) {
    pm2 reload ultimatum
} else {
    pm2 start server.js --name "ultimatum"
    pm2 save
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  [SUCCESS] Ultimatum is updated and live!             " -ForegroundColor Green
Write-Host "  Domain: https://ultimatumroom.com                    " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
