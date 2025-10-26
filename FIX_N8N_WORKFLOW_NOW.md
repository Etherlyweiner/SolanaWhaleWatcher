# 🔧 Fix N8N Workflow - Data Mapping Issue

## 🚨 Problem Found!

**Issue**: N8N Webhook v2 nests POST data under `body` object
- Workflow was looking for: `$json.score`
- Actual location: `$json.body.score`

**Result**: All data showed as "Unknown", "N/A", score 0

---

## ✅ Solution: Import Fixed Workflow

### Step 1: Open N8N (30 seconds)
1. Go to http://localhost:5678
2. Click "Workflows" in left sidebar
3. Find "Whale Watcher - Discord Alerts"

### Step 2: Import Fixed Workflow (1 minute)
1. Click "+ Add workflow" (top right)
2. Click three dots menu → "Import from File"
3. Select: `n8n-workflows\whale-watcher-discord-FIXED.json`
4. Click "Save" (top right)
5. Click "Activate" toggle (top right)

### Step 3: Deactivate Old Workflow (30 seconds)
1. Go back to "Workflows"
2. Find the OLD workflow (without "FIXED")
3. Click the toggle to DEACTIVATE it
4. This prevents duplicates

---

## 🧪 Test the Fixed Workflow

Run this command to test:

```bash
node test-with-real-token.js
```

**Check Discord** - you should now see:
- ✅ Symbol: SOL
- ✅ Score: 85/100
- ✅ Mint address displayed
- ✅ Price: $150.25
- ✅ Liquidity: $5,000,000
- ✅ All other data populated!

---

## 📊 What Was Fixed

### Before (BROKEN):
```javascript
$json.score              // undefined → "0"
$json.symbol             // undefined → "Unknown"
$json.data.market.priceUsd  // undefined → "N/A"
```

### After (WORKING):
```javascript
$json.body.score         // 85
$json.body.symbol        // "SOL"
$json.body.data.market.priceUsd  // 150.25
```

---

## 🎯 Quick Test Script

I also sent a test with score 88 just now. Check Discord for:
- Symbol: SOL-TEST
- Score: 88/100
- All market data populated

---

## ⚡ Next: Start Scanner with Debug

Once you verify the workflow works, restart scanner:

```bash
npm run scan -- --interval=60
```

With debug logging, we'll see:
- How many tokens Dexscreener returns
- Why scanner shows 0 candidates
- Exact fix needed

**Ready to import the fixed workflow?** Just follow the 3 steps above! 🚀
