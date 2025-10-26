# START HERE - Complete Setup in 3 Steps

## ✅ What You Have Ready

- ✅ Docker Desktop running
- ✅ N8N running at <http://localhost:5678>
- ✅ Whale Watcher program validated
- ✅ Discord webhook configured in workflow
- ✅ JSON workflow file created

---

## 📝 Step 1: Add One Line to .env

**File to edit**:

```text
c:\Users\Jonat\SolanaWhaleWatcher\.env
```

**Line to add** (at the end):

```bash
N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher
```

**Save the file.**

---

## 📥 Step 2: Import Workflow to N8N

### Method 1: Import from File (Easiest)

1. Open <http://localhost:5678> in browser
2. Click the **menu icon** (≡ three lines, top left)
3. Click **"Import from File"**
4. Click **"Select file"**
5. Navigate to and select:

   ```text
   c:\Users\Jonat\SolanaWhaleWatcher\n8n-workflows\whale-watcher-discord-alerts.json
   ```

6. Click **"Import"**

### Method 2: Copy & Paste

1. Open <http://localhost:5678>
2. Press **Ctrl + I**
3. Open this file in Notepad:

   ```text
   c:\Users\Jonat\SolanaWhaleWatcher\n8n-workflows\whale-watcher-discord-alerts.json
   ```

4. **Select All** (Ctrl + A)
5. **Copy** (Ctrl + C)
6. **Paste** into N8N (Ctrl + V)
7. Click **"Import"**

---

## ✅ Step 3: Activate Workflow

**In N8N**:

1. You'll see the imported workflow
2. Click the **"Active" toggle** (top right) - it should turn green
3. Click **"Save"** button

**Verify you see**:

- Workflow name: "Whale Watcher - Discord Alerts"
- 3 nodes: Webhook → High Score Filter → Discord Notification
- Green "Active" badge

---

## 🚀 Step 4: Test It

**Run the scanner**:

```bash
cd c:\Users\Jonat\SolanaWhaleWatcher
npm run scan
```

**What happens**:

1. 🔍 Scanner analyzes Solana tokens
2. 📊 Finds tokens with score > 75
3. 📡 Sends data to N8N webhook
4. 🤖 N8N processes and filters
5. 💬 Discord receives rich alert

**Check your Discord channel!**

---

## 📋 Quick Reference

### Files You Need

| File | Purpose | Action |
|------|---------|--------|
| `.env` | Add webhook URL | Edit: add 1 line |
| `whale-watcher-discord-alerts.json` | N8N workflow | Import to N8N |

### URLs

- **N8N**: <http://localhost:5678>
- **Webhook**: <http://localhost:5678/webhook/whale-watcher>

### Commands

```bash
# Validate setup
npm run validate

# Start scanner (continuous)
npm run scan

# Analyze single token
npm run analyze -- --mint=<TOKEN_ADDRESS>

# Stop scanner
Ctrl + C
```

---

## 🔍 Troubleshooting

### Issue: Webhook not receiving data

**Check**:

1. N8N workflow is "Active" (green toggle)
2. `.env` file has webhook URL
3. Restart terminal after updating `.env`
4. Check N8N: Click "Executions" to see logs

### Issue: Discord not receiving messages

**Check**:

1. Discord webhook URL is correct in JSON file
2. Test the Discord node directly in N8N
3. Verify webhook wasn't deleted in Discord

### View Logs

```bash
# N8N logs
docker logs n8n

# Check if N8N is running
docker ps
```

---

## 🎉 Success Indicators

You'll know it's working when you see:

✅ Scanner console shows: "Sending to webhook..."
✅ N8N Executions shows: New workflow runs
✅ Discord shows: Rich token alerts with scores

---

## 📚 Additional Resources

- **Full Guide**: `n8n-workflows/README.md`
- **Docker Setup**: `docs/DOCKER_N8N_SETUP.md`
- **User Guide**: `USER_GUIDE.md`

---

**That's it! Just 3 steps and you're automated!** 🚀

Your Discord will start receiving alerts for high-quality tokens automatically.
