# 🚀 Ultimatum Platform — Windows Server Deployment Guide

This folder contains all configuration files and automation scripts required to host and auto-deploy **Ultimatum** on a Windows Server connected to your external Microsoft SQL Server database.

---

## 📁 Deployment Files Overview

| File | Purpose |
| :--- | :--- |
| **`setup-server.ps1`** | **Run Once**: Automatically checks Node.js, installs PM2, and opens Firewall ports 80/443. |
| **`database-schema.sql`** | Complete master SQL script to create all tables, indexes, and initial data in `Ultimatum_abc`. |
| **`env.production.example`** | Production environment template pre-configured with your `Ultimatum_abc` database credentials. |
| **`deploy.ps1`** | One-click PowerShell script that pulls changes from GitHub, builds, and reloads the site. |
| **`ecosystem.config.js`** | PM2 Process Manager configuration for running `server.js` continuously. |
| **`Caddyfile`** | Caddy reverse proxy configuration for `ultimatumroom.com` with **automatic free SSL** and WebSocket support. |
| **`web.config`** | Alternative IIS reverse proxy configuration if using Windows IIS instead of Caddy. |
| **`github-actions-deploy.yml`** | GitHub Actions workflow template for automatic deployment on every `git push`. |

---

## ⚡ Quick Deployment Walkthrough (Step-by-Step)

### Step 1: Database Setup
1. Open your SQL management tool (e.g., SSMS, Azure Data Studio, or DBeaver) and connect to database **`Ultimatum_abc`** with user **`User_Ultimatum_abc`**.
2. Run the master database script:
   👉 **`deployment\database-schema.sql`**
3. Ensure your Windows Server's public IP address is allowed through your external SQL server's firewall on port `1433`.

---

### Step 2: One-Time Server Initial Setup (PowerShell as Administrator)
```powershell
# Run the automated server setup script to install PM2 and open Firewall ports:
powershell -ExecutionPolicy Bypass -File C:\apps\Ultimatum\deployment\setup-server.ps1
```

---

### Step 3: Clone Repository & Setup Environment
On your Windows server, open PowerShell:
```powershell
# 1. Create a permanent app directory
mkdir C:\apps -Force
cd C:\apps

# 2. Clone your repository
git clone https://github.com/OsamaBinAhsan/Ultimatum.git
cd Ultimatum

# 3. Create .env.local from the provided example
copy deployment\env.production.example .env.local
notepad .env.local
```
> In Notepad, replace `REPLACE_WITH_YOUR_SQL_HOST_OR_IP` with your actual SQL Server IP or hostname, then save and close.

---

### Step 4: First Build & Run with PM2
```powershell
# 1. Install dependencies
npm install

# 2. Build production assets
npm run build

# 3. Start server via PM2
pm2 start deployment\ecosystem.config.js
pm2 save

# 4. Install PM2 as a Windows Background Service (auto-starts on Windows reboot)
pm2-service-install -n "PM2_Ultimatum"
```
The application is now running locally on `http://localhost:3000`.

---

### Step 5: Domain & Free SSL (Caddy Reverse Proxy)
1. Point your DNS records for `ultimatumroom.com` and `www.ultimatumroom.com` (Type `A`) to your Windows Server's public IP.
2. Download **[Caddy for Windows](https://caddyserver.com/download)** (`caddy.exe`).
3. Place `caddy.exe` and `deployment\Caddyfile` into `C:\caddy\`.
4. Allow HTTP/HTTPS ports through Windows Firewall:
```powershell
New-NetFirewallRule -DisplayName "HTTP 80" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS 443" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```
5. Run Caddy:
```powershell
cd C:\caddy
.\caddy.exe run
```
Caddy will automatically provision free Let's Encrypt SSL certificates for **`ultimatumroom.com`** and proxy all traffic and WebSockets to your app!

---

### Step 6: Updating Your Website from GitHub

Whenever you push new changes to GitHub, open PowerShell on your server and run:
```powershell
powershell -ExecutionPolicy Bypass -File C:\apps\Ultimatum\deployment\deploy.ps1
```
This script will automatically:
1. `git pull origin main`
2. `npm install`
3. `npm run build`
4. `pm2 reload ultimatum` (zero-downtime reload)
