# Docker + N8N Setup Guide

**Status**: Installing Docker for N8N containerized deployment  
**Date**: October 25, 2025

---

## 📋 What We're Doing

1. ✅ Install Docker Desktop for Windows
2. ✅ Run N8N in Docker container
3. ✅ Connect Whale Watcher to N8N
4. ✅ Build automation workflows

---

## 🐳 Step 1: Install Docker Desktop

### Download Docker Desktop

**Direct Download Link**:
<https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe>

**Official Page**: <https://www.docker.com/products/docker-desktop>

### Installation Steps

1. **Run the Installer**
   - Double-click `Docker Desktop Installer.exe`
   - Accept the license agreement
   - **Important**: Check "Use WSL 2 instead of Hyper-V" (recommended)
   - Click "OK"

2. **Wait for Installation**
   - Takes 3-5 minutes
   - Downloads ~500MB

3. **Restart Computer** (if prompted)
   - Docker may require a restart
   - Save all work before restarting

4. **Launch Docker Desktop**
   - Find Docker Desktop in Start Menu
   - First launch takes ~1 minute
   - Wait for "Docker Desktop is running" message

5. **Accept Terms** (first time only)
   - Docker Service Agreement
   - Can skip Docker account creation

### Verify Installation

Open PowerShell and run:

```powershell
docker --version
docker info
```

**Expected output**:

```text
Docker version 24.x.x, build xxxxx
```

---

## 🚀 Step 2: Run N8N in Docker

### Basic Start Command

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**What this does**:

- `-d`: Run in background (detached)
- `--name n8n`: Container name
- `-p 5678:5678`: Map port 5678 to localhost
- `-v ~/.n8n:/home/node/.n8n`: Persist data
- `n8nio/n8n`: Official N8N image

### PowerShell Command (Windows)

```powershell
docker run -d --name n8n -p 5678:5678 -v ${env:USERPROFILE}\.n8n:/home/node/.n8n n8nio/n8n
```

### First Run

**First time only**:

- Docker downloads N8N image (~300MB)
- Takes 2-3 minutes
- Subsequent starts are instant

### Check N8N Status

```bash
# Check if container is running
docker ps

# View N8N logs
docker logs n8n

# Follow logs in real-time
docker logs -f n8n
```

### Access N8N

Open browser: **<http://localhost:5678>**

---

## 🔧 Docker Management Commands

### Start/Stop N8N

```bash
# Stop N8N
docker stop n8n

# Start N8N
docker start n8n

# Restart N8N
docker restart n8n
```

### Remove N8N Container

```bash
# Stop and remove container
docker stop n8n
docker rm n8n

# Remove with data (careful!)
docker stop n8n
docker rm n8n
Remove-Item -Recurse -Force ~/.n8n
```

### Update N8N

```bash
# Stop current container
docker stop n8n
docker rm n8n

# Pull latest image
docker pull n8nio/n8n

# Start with new image
docker run -d --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```

---

## 🎯 Step 3: Configure Whale Watcher

### Update .env File

Add N8N webhook URL:

```bash
# In c:\Users\Jonat\SolanaWhaleWatcher\.env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher
```

### Test Connection

```bash
# From Whale Watcher directory
cd c:\Users\Jonat\SolanaWhaleWatcher

# Run scanner
npm run scan
```

---

## 📊 Architecture Diagram

```text
┌─────────────────────┐
│  Solana Blockchain  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Whale Watcher      │
│  (Node v25)         │
│  - Scanner          │
│  - Analysis         │
│  - Strategies       │
└──────────┬──────────┘
           │ HTTP POST
           ▼
┌─────────────────────┐
│  N8N (Docker)       │
│  (Node v20)         │
│  Port: 5678         │
└──────────┬──────────┘
           │
           ├─► Discord
           ├─► Telegram
           ├─► Email
           ├─► Database
           └─► Claude AI
```

---

## 🔍 Troubleshooting

### Docker Desktop Won't Start

**Issue**: "Docker Desktop starting..." forever

**Solutions**:

1. Restart computer
2. Check Windows features:
   - Open "Turn Windows features on or off"
   - Enable "Virtual Machine Platform"
   - Enable "Windows Subsystem for Linux"
   - Restart

3. Update WSL:

   ```powershell
   wsl --update
   ```

### Port 5678 Already in Use

**Issue**: Port conflict

**Solution**:

```bash
# Use different port
docker run -d --name n8n -p 5679:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n

# Access at: http://localhost:5679
```

### Container Keeps Restarting

**Issue**: N8N container crashes

**Check logs**:

```bash
docker logs n8n
```

**Common fixes**:

- Ensure port 5678 is free
- Check disk space
- Verify data directory permissions

### Can't Access N8N in Browser

**Checklist**:

- [ ] Docker Desktop is running
- [ ] Container is running: `docker ps`
- [ ] No firewall blocking port 5678
- [ ] Try: `http://127.0.0.1:5678`

---

## ✅ Success Checklist

- [ ] Docker Desktop installed
- [ ] Docker Desktop running
- [ ] N8N container started
- [ ] N8N accessible at <http://localhost:5678>
- [ ] N8N account created
- [ ] First workflow created
- [ ] Webhook URL configured in Whale Watcher
- [ ] End-to-end test successful

---

## 🎉 Next Steps

Once N8N is running:

1. **Create First Workflow**
   - Open <http://localhost:5678>
   - Follow Quick Start Guide
   - Add Webhook → Discord flow

2. **Connect Whale Watcher**
   - Configure `.env` file
   - Start scanner: `npm run scan`
   - Watch Discord for alerts

3. **Enhance Workflow**
   - Add Claude AI analysis
   - Multi-channel notifications
   - Database logging

---

## 📚 Resources

- **Docker Docs**: <https://docs.docker.com/desktop/windows/>
- **N8N Docker**: <https://docs.n8n.io/hosting/installation/docker/>
- **Whale Watcher Guide**: `docs/N8N_QUICKSTART_GUIDE.md`

---

Ready to automate! 🚀
