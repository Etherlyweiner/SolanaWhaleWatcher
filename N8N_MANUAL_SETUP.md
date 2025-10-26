# 🎯 N8N Manual Setup - Step by Step

## Problem Solved

The Discord node in N8N requires complex configuration. **Solution**: Use HTTP Request node instead (much simpler!).

---

## 📋 Option 1: Import CORRECTED Workflow (Easiest)

**Use this file**:
```
c:\Users\Jonat\SolanaWhaleWatcher\n8n-workflows\whale-watcher-discord-CORRECTED.json
```

**Steps**:
1. Open N8N: <http://localhost:5678>
2. Press `Ctrl + I`
3. Paste the JSON from CORRECTED file
4. Click "Import"
5. Toggle "Active"
6. Done! ✅

---

## 📋 Option 2: Build Manually in N8N (15 minutes)

### Step 1: Create New Workflow

1. Open N8N: <http://localhost:5678>
2. Click **"+ Create new workflow"**
3. Name it: **"Whale Watcher - Discord Alerts"**

---

### Step 2: Add Webhook Node

1. Click **"+"** to add node
2. Search: **"Webhook"**
3. Click **"Webhook"** node

**Configure**:
- **HTTP Method**: POST
- **Path**: `whale-watcher`
- **Response Mode**: "On Received"
- Click **"Execute Node"** to activate

**Result**: You'll see the webhook URL:
```
http://localhost:5678/webhook/whale-watcher
```

---

### Step 3: Add IF Node (Score Filter)

1. Click **"+"** after Webhook node
2. Search: **"IF"**
3. Click **"IF"** node

**Configure**:
- **Condition**: Number
- **Value 1**: Click "Expression" tab
  - Paste: `{{ $json.score }}`
- **Operation**: Larger
- **Value 2**: `75`

**What this does**: Only processes tokens with score > 75

---

### Step 4: Add HTTP Request Node (Discord)

1. Click **"+"** after IF node's **"true"** output
2. Search: **"HTTP Request"**
3. Click **"HTTP Request"** node
4. Rename to: **"Discord Notification"**

**Configure**:

#### 4.1 Basic Settings

- **Method**: POST
- **URL**: 
  ```
  https://discord.com/api/webhooks/1431797095727104073/ZDggdyXCxmLSLm6BFa6SCUH-Xgp10C_QfaoBHFqk2KZnvNi34KtZuTceq9TMpO4qCEbQ
  ```

#### 4.2 Body/Parameters

- **Send Body**: ON (toggle switch)
- **Body Content Type**: "JSON"
- Click **"Add Parameter"**
- **Name**: `content`
- **Value**: Click **"Expression"** tab and paste this:

```javascript
🎯 **Profitable Token Detected!**

**Symbol**: {{ $json.symbol || 'Unknown' }}
**Score**: {{ $json.score || 0 }}/100
**Mint**: `{{ $json.mint }}`

**Why This Token:**
{{ $json.reasons ? $json.reasons.join('\n') : 'Analyzing...' }}

**Market Data:**
💰 Price: ${{ $json.data?.market?.priceUsd || 'N/A' }}
💧 Liquidity: ${{ $json.data?.market?.liquidityUsd ? $json.data.market.liquidityUsd.toLocaleString() : 'N/A' }}
📊 24h Volume: ${{ $json.data?.market?.volume24hUsd ? $json.data.market.volume24hUsd.toLocaleString() : 'N/A' }}

**Whale Activity:**
🐋 Top 5 Concentration: {{ $json.data?.holder?.topFiveShare ? ($json.data.holder.topFiveShare * 100).toFixed(1) + '%' : 'N/A' }}
👥 Total Holders: {{ $json.data?.holder?.totalHolders || 'N/A' }}

**Launch Info:**
⏰ Age: {{ $json.data?.launch?.ageMinutes ? $json.data.launch.ageMinutes.toFixed(0) + ' min' : 'N/A' }}
⚠️ Rug Score: {{ $json.data?.launch?.rugScore ? $json.data.launch.rugScore.toFixed(0) + '%' : 'N/A' }}

🔗 **DEX Screener**: https://dexscreener.com/solana/{{ $json.mint }}
⏰ **Detected**: {{ $json.timestamp }}
```

---

### Step 5: Activate Workflow

1. Click **"Active"** toggle (top right) - should turn green
2. Click **"Save"** button

---

## 🧪 Test the Workflow

### Test 1: Manual Test in N8N

1. Click the **Webhook node**
2. Click **"Listen for Test Event"**
3. Open new terminal and run:

```bash
curl -X POST http://localhost:5678/webhook-test/whale-watcher -H "Content-Type: application/json" -d "{\"mint\":\"TEST123\",\"symbol\":\"TEST\",\"score\":85,\"reasons\":[\"Test reason\"],\"data\":{\"market\":{\"priceUsd\":1.5,\"liquidityUsd\":50000,\"volume24hUsd\":100000},\"holder\":{\"topFiveShare\":0.18,\"totalHolders\":500},\"launch\":{\"ageMinutes\":10,\"rugScore\":15}},\"timestamp\":\"2025-10-25T18:00:00.000Z\"}"
```

4. Check Discord for test message!

### Test 2: Real Scanner Test

```bash
cd c:\Users\Jonat\SolanaWhaleWatcher
npm run scan
```

**Watch for**:
- Scanner console: `Webhook notification sent { statusCode: 200 }`
- N8N: New executions in "Executions" panel
- Discord: Real token alerts!

---

## 🎯 Workflow Diagram

```
┌─────────────────┐
│  Webhook        │ ← POST from scanner
│  Trigger        │    (receives token data)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  IF Node        │ ← Filters: score > 75
│  (Score Filter) │
└────────┬────────┘
         │ (true path)
         ▼
┌─────────────────┐
│  HTTP Request   │ ← POST to Discord
│  (Discord)      │    (sends formatted message)
└─────────────────┘
```

---

## 🔧 Troubleshooting

### Discord Not Receiving Messages?

**Check**:
1. HTTP Request node URL is correct
2. Body Content Type is "JSON"
3. Parameter name is exactly `content`
4. Test the webhook directly:

```bash
curl -X POST "https://discord.com/api/webhooks/1431797095727104073/ZDggdyXCxmLSLm6BFa6SCUH-Xgp10C_QfaoBHFqk2KZnvNi34KtZuTceq9TMpO4qCEbQ" -H "Content-Type: application/json" -d "{\"content\":\"Test message from N8N\"}"
```

### Workflow Not Triggering?

**Check**:
1. Workflow is "Active" (green toggle)
2. `.env` has `N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher`
3. Scanner is running: `npm run scan`
4. View N8N logs: `docker logs n8n`

### Expression Errors?

**Common fixes**:
- Use `?.` for optional chaining: `$json.data?.market?.priceUsd`
- Use `||` for fallbacks: `$json.symbol || 'Unknown'`
- Join arrays: `$json.reasons.join('\n')`

---

## 📊 Quick Reference

### Webhook URL
```
http://localhost:5678/webhook/whale-watcher
```

### Discord Webhook URL
```
https://discord.com/api/webhooks/1431797095727104073/ZDggdyXCxmLSLm6BFa6SCUH-Xgp10C_QfaoBHFqk2KZnvNi34KtZuTceq9TMpO4qCEbQ
```

### Scanner Data Structure
```json
{
  "mint": "string",
  "symbol": "string", 
  "score": 85,
  "reasons": ["array of strings"],
  "data": {
    "market": { "priceUsd": 1.5, "liquidityUsd": 50000, "volume24hUsd": 100000 },
    "holder": { "topFiveShare": 0.18, "totalHolders": 500 },
    "launch": { "ageMinutes": 10, "rugScore": 15 }
  },
  "timestamp": "ISO date string"
}
```

---

## ✅ Success Checklist

- [ ] Webhook node created and listening
- [ ] IF node filters score > 75
- [ ] HTTP Request node configured with Discord URL
- [ ] Message template uses expressions for dynamic data
- [ ] Workflow is "Active" (green toggle)
- [ ] Workflow saved
- [ ] Test message sent to Discord successfully
- [ ] Scanner test shows webhook notifications

---

**Need help?** Check N8N's execution logs to see exactly what data is flowing through each node!
