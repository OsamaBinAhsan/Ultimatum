# ==============================================================================
# Ultimatum Platform - One-Time Windows Server Initial Setup Script
# Run this ONCE in PowerShell as Administrator when configuring a new server.
# Usage: powershell -ExecutionPolicy Bypass -File .\deployment\setup-server.ps1
# ==============================================================================

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   ULTIMATUM PLATFORM - WINDOWS SERVER INITIAL SETUP    " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Enable PowerShell Script Execution
Write-Host "`n>>> [1/4] Enabling PowerShell script execution..." -ForegroundColor Yellow
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
Write-Host "PowerShell execution policy configured." -ForegroundColor Green

# 2. Check Node.js & npm
Write-Host "`n>>> [2/4] Checking Node.js and npm..." -ForegroundColor Yellow
try {
    $nodeVer = node -v
    $npmVer = npm -v
    Write-Host "Node.js detected: $nodeVer" -ForegroundColor Green
    Write-Host "npm detected: $npmVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please download and install Node.js 20 LTS from: https://nodejs.org" -ForegroundColor Red
    Exit 1
}

# 3. Install Global Process Manager (PM2)
Write-Host "`n>>> [3/4] Installing PM2 and PM2 Windows Service globally..." -ForegroundColor Yellow
npm.cmd install -g pm2 pm2-windows-service

# 4. Open Inbound Firewall Ports for HTTP (80) and HTTPS (443)
Write-Host "`n>>> [4/4] Configuring Windows Defender Firewall for Ports 80 and 443..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "Ultimatum Web (HTTP 80)" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Ultimatum Secure (HTTPS 443)" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    Write-Host "Firewall rules for Ports 80 and 443 created successfully." -ForegroundColor Green
} catch {
    Write-Host "Firewall rules could not be created automatically. Please ensure ports 80 and 443 are open." -ForegroundColor Yellow
}

Write-Host "`n=========================================================" -ForegroundColor Green
Write-Host "   [SUCCESS] Server environment is ready!              " -ForegroundColor Green
Write-Host "   Next Step: Run '.\deployment\deploy.ps1' to launch! " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
