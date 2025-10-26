# 🚀 N8N Import Guide - Super Easy

## Step 1: Update .env File

**Open this file in a text editor**:

```text
c:\Users\Jonat\SolanaWhaleWatcher\.env
```

**Add this line at the end**:

```bash
N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher
```

**Save and close.**

---

## Step 2: Copy the Workflow JSON

**Option A - Copy File Path** (Easiest):

1. Open N8N in browser: <http://localhost:5678>
2. Click menu (3 lines, top left)
3. Click "Import from File"
4. Select this file:

   ```text
   c:\Users\Jonat\SolanaWhaleWatcher\n8n-workflows\whale-watcher-discord-alerts.json
   ```
5. Click "Import"
6. Toggle "Active" (top right)
7. Click "Save"

---

**Option B - Copy & Paste**:

1. Open N8N: <http://localhost:5678>
2. Press `Ctrl + I` (Import shortcut)
3. Open this file in text editor:

   ```text
   c:\Users\Jonat\SolanaWhaleWatcher\n8n-workflows\whale-watcher-discord-alerts.json
   ```
4. Select All (`Ctrl + A`)
5. Copy (`Ctrl + C`)
6. Paste into N8N import window (`Ctrl + V`)
7. Click "Import"
8. Toggle "Active"
9. Click "Save"

---

## Step 3: Verify Workflow is Active

In N8N you should see:

- ✅ Workflow name: "Whale Watcher - Discord Alerts"
- ✅ Green "Active" toggle (top right)
- ✅ 3 nodes connected:
  - Webhook
  - High Score Filter
  - Discord Notification

---

## Step 4: Test the Integration

**Open a terminal and run**:

```bash
cd c:\Users\Jonat\SolanaWhaleWatcher
npm run scan
```

**What should happen**:

1. Scanner finds tokens
2. Sends high-score tokens (>75) to N8N
3. N8N processes the data
4. Discord receives rich alerts

**Check Discord** for your alerts! 🎉

---

## Troubleshooting

### Webhook Not Working?

**Check**:

1. N8N workflow is "Active" (green toggle)
2. Docker container is running: `docker ps`
3. `.env` file has the webhook URL
4. Restart scanner after updating `.env`

### View N8N Logs

```bash
docker logs n8n
```

### View Workflow Executions

In N8N, click "Executions" (left sidebar) to see all runs.

---

**You're all set!** 🚀

The workflow JSON is already configured with your Discord webhook URL.
Just import it and start the scanner!
