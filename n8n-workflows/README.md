# N8N Workflow Import Guide

**Location**: `n8n-workflows/`  
**Date**: October 25, 2025  
**Purpose**: Pre-configured N8N workflows for Solana Whale Watcher

---

## 📁 Available Workflows

### 1. **whale-watcher-discord-alerts.json** (Advanced)

**Features**:

- ✅ Webhook trigger for scanner data
- ✅ High score filter (only alerts for scores > 75)
- ✅ Rich Discord notifications with full analysis
- ✅ Whale activity metrics
- ✅ Strategy recommendations
- ✅ DEX Screener links
- ✅ Timestamp

**Use Case**: Production environment with filtering

### 2. **whale-watcher-simple.json** (Basic)

**Features**:

- ✅ Webhook trigger for scanner data
- ✅ Simple Discord notifications
- ✅ All tokens (no filtering)
- ✅ Minimal formatting

**Use Case**: Testing or getting all alerts

---

## 🚀 How to Import into N8N

### Step 1: Copy Workflow JSON

**Option A - Advanced Workflow**:

```bash
# Read the file
cat c:\Users\Jonat\SolanaWhaleWatcher\n8n-workflows\whale-watcher-discord-alerts.json
```

**Option B - Simple Workflow**:

```bash
# Read the file
cat c:\Users\Jonat\SolanaWhaleWatcher\n8n-workflows\whale-watcher-simple.json
```

### Step 2: Import into N8N

1. **Open N8N**: <http://localhost:5678>
2. **Click** the menu (3 lines, top left)
3. **Select**: "Import from File" or "Import from URL"
4. **Paste the JSON** content
5. **Click**: "Import"

**Alternative Method**:

1. Open N8N
2. Press `Ctrl + I` (or `Cmd + I` on Mac)
3. Paste the JSON
4. Click "Import"

### Step 3: Activate Workflow

1. **Click the workflow** name to open it
2. **Toggle "Active"** (top right)
3. **Click "Save"**

### Step 4: Note Your Webhook URL

**Production URL**:

```text
http://localhost:5678/webhook/whale-watcher
```

---

## ⚙️ Configuration

### Webhook Endpoint

- **Path**: `/whale-watcher`
- **Method**: POST
- **Authentication**: None (for local testing)

### Discord Webhook

**Already configured** with your webhook URL:

```text
https://discord.com/api/webhooks/1431797095727104073/ZDggdyXCxmLSLm6BFa6SCUH-Xgp10C_QfaoBHFqk2KZnvNi34KtZuTceq9TMpO4qCEbQ
```

**To update** (if you create a new Discord webhook):

1. Click the "Discord Notification" node
2. Update the "url" field
3. Save workflow

---

## 🔗 Connect Whale Watcher

### Update .env File

Add this line to `c:\Users\Jonat\SolanaWhaleWatcher\.env`:

```bash
N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher
```

### Restart Scanner (if running)

```bash
# Stop current scanner (Ctrl+C)
# Restart
npm run scan
```

---

## 📊 Workflow Structure Explained

### Advanced Workflow (whale-watcher-discord-alerts.json)

```text
┌─────────────────┐
│  Webhook        │ ← Receives data from Whale Watcher
│  Trigger        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  High Score     │ ← Filters tokens with score > 75
│  Filter (IF)    │
└────────┬────────┘
         │ (if true)
         ▼
┌─────────────────┐
│  Discord        │ ← Sends rich formatted alert
│  Notification   │
└─────────────────┘
```

### Simple Workflow (whale-watcher-simple.json)

```text
┌─────────────────┐
│  Webhook        │ ← Receives data from Whale Watcher
│  Trigger        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Discord        │ ← Sends simple alert
│  Notification   │
└─────────────────┘
```

---

## 📋 Expected Data Format

The workflows expect this JSON structure from Whale Watcher:

```json
{
  "symbol": "PUMP",
  "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "score": 85,
  "reasons": [
    "High whale concentration",
    "Strong momentum",
    "Low liquidity risk"
  ],
  "topHolder": 15.5,
  "whaleCount": 12,
  "marketCap": 50000,
  "strategies": {
    "Sniper": {
      "verdict": "BUY",
      "reasoning": "Early launch detected"
    },
    "Copy Trading": {
      "verdict": "WATCH",
      "reasoning": "Whales accumulating"
    }
  }
}
```

---

## 🧪 Testing the Workflow

### Test 1: Manual Webhook Test

```powershell
# Send test data to webhook
Invoke-RestMethod -Uri "http://localhost:5678/webhook/whale-watcher" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"symbol":"TEST","mint":"ABC123","score":90,"reasons":["Test alert"]}'
```

### Test 2: From Whale Watcher

```bash
# Run a single analysis
npm run analyze -- --mint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### Test 3: Start Scanner

```bash
# Start continuous scanning
npm run scan -- --interval=60
```

---

## 🎨 Customization Options

### Change Score Threshold

**In Advanced Workflow**:

1. Click "High Score Filter" node
2. Change `75` to your desired threshold
3. Save workflow

### Modify Discord Message Format

**In Discord Notification node**:

1. Click the node
2. Edit the "content" field
3. Use N8N expressions: `{{ $json.fieldName }}`
4. Save workflow

### Add More Nodes

**Popular additions**:

- **Database Logger**: Save alerts to PostgreSQL/MongoDB
- **Email Notification**: CC yourself on high-value alerts
- **Telegram Bot**: Multi-channel notifications
- **Claude AI**: Add AI analysis before sending alert
- **Switch Node**: Different alerts for different score ranges

---

## 🔍 Viewing Execution Logs

### In N8N

1. **Click "Executions"" (left sidebar)
2. **See all workflow runs**
3. **Click any execution** to see:
   - Input data
   - Each node's output
   - Execution time
   - Success/failure status

### Debugging

**Enable Debug Mode**:

1. Click workflow settings (⚙️)
2. Enable "Save manual executions"
3. Enable "Save successful executions"
4. See all data flowing through workflow

---

## 🚨 Troubleshooting

### Workflow Not Receiving Data

**Checklist**:

- [ ] Workflow is "Active" (toggle on)
- [ ] N8N container is running: `docker ps`
- [ ] `.env` has correct webhook URL
- [ ] Whale Watcher scanner is running
- [ ] Check N8N logs: `docker logs n8n`

### Discord Not Receiving Messages

**Checklist**:

- [ ] Discord webhook URL is correct
- [ ] Test Discord node directly in N8N
- [ ] Check Discord rate limits (30 messages/min)
- [ ] Verify webhook hasn't been deleted in Discord

### Wrong Data in Discord

**Solutions**:

- Click Discord node
- Check expression syntax: `{{ $json.fieldName }}`
- Test with manual execution
- View execution log to see actual data received

---

## 📚 N8N Expression Cheat Sheet

### Accessing Data

```javascript
{{ $json.fieldName }}              // Access field
{{ $json.nested.field }}           // Nested field
{{ $json.array[0] }}               // Array index
{{ $json.field || 'Default' }}     // Default value
```

### Formatting

```javascript
{{ $json.score.toFixed(2) }}       // Round number
{{ $json.text.toUpperCase() }}     // Uppercase
{{ new Date().toLocaleString() }}  // Current timestamp
{{ JSON.stringify($json, null, 2) }} // Pretty print JSON
```

### Arrays

```javascript
{{ $json.reasons.join('\n• ') }}   // Join with newlines
{{ $json.whales.length }}          // Array length
{{ $json.whales.filter(w => w.score > 80) }} // Filter
```

---

## 🎯 Next Steps

### Beginner

1. ✅ Import simple workflow
2. ✅ Test with manual data
3. ✅ Start Whale Watcher scanner
4. ✅ Verify Discord alerts work

### Intermediate

1. ✅ Import advanced workflow
2. ✅ Adjust score threshold
3. ✅ Customize Discord message
4. ✅ Add database logging

### Advanced

1. ✅ Add Claude AI analysis node
2. ✅ Build multi-channel notifications
3. ✅ Create conditional logic for different token types
4. ✅ Build trading bot integration

---

## 📖 Resources

- **N8N Docs**: <https://docs.n8n.io>
- **N8N Expressions**: <https://docs.n8n.io/code-examples/expressions/>
- **Discord API**: <https://discord.com/developers/docs/resources/webhook>
- **Whale Watcher Docs**: `../docs/`

---

**Your N8N workflows are ready to import and use!** 🚀

**Questions?** Check the execution logs in N8N or review this guide.
