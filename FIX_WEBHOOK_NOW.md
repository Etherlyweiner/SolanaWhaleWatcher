# 🚨 WEBHOOK NOT CONFIGURED - Fix Now!

**Problem Found:** N8N_WEBHOOK_URL is not set in your .env file
**Impact:** Scanner detects tokens but can't send to N8N → No Discord alerts!

---

## 🔧 FIX IN 3 STEPS (2 Minutes)

### Step 1: Open/Create .env File

```powershell
# Open in notepad
notepad .env
```

If file doesn't exist, create it from template:
```powershell
copy .env.example .env
notepad .env
```

### Step 2: Add This Line

**Add to your .env file:**
```
N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher
```

**Complete .env should look like:**
```env
# Helius Configuration
HELIUS_RPC_URL=https://myrta-kxo6n1-fast-mainnet.helius-rpc.com
HELIUS_API_KEY=f26c6485-96ad-4f9b-9a8f-9d2da59a2394

# N8N Webhook (REQUIRED!)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher

# Other settings...
```

### Step 3: Restart Scanner

```powershell
# Stop old scanner
Stop-Process -Name node -Force

# Start with new config
npm run scan -- --interval=60
```

---

## ✅ VERIFY IT WORKS

### Test 1: Check Config
```powershell
node check-webhook-config.js
```

Should show:
```
✅ N8N_WEBHOOK_URL: SET
   URL: http://localhost:5678/webhook/whale-watcher
```

### Test 2: Manual Test
```powershell
node test-with-real-token.js
```

Should get:
- ✅ 200 OK response
- ✅ Message in Discord

### Test 3: Wait for Real Token
Watch scanner logs for:
```json
{"level":"info","msg":"Webhook notification sent","statusCode":200}
```

Then check Discord!

---

## 🎯 WHY THIS HAPPENED

**The Flow:**
```
Scanner → [CHECK ENV VAR] → N8N → Discord
              ↑
           NOT SET! ❌
```

**What was happening:**
1. Scanner found tokens ✅
2. Evaluated & scored them ✅
3. Checked process.env.N8N_WEBHOOK_URL ❌ (not set)
4. Returned early (Line 376 in scanner.js)
5. Never sent webhook
6. Discord never notified

**After fix:**
1. Scanner found tokens ✅
2. Evaluated & scored them ✅  
3. Checked process.env.N8N_WEBHOOK_URL ✅ (set!)
4. Sends webhook to N8N ✅
5. N8N forwards to Discord ✅
6. You get notifications! 🎉

---

## 📝 QUICK COMMANDS

**Open .env file:**
```powershell
notepad .env
```

**Add this line:**
```
N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher
```

**Save and restart:**
```powershell
Stop-Process -Name node -Force
npm run scan -- --interval=60
```

**Verify:**
```powershell
node check-webhook-config.js
```

---

## 🎉 AFTER FIX

You should see in scanner logs:
```json
{"level":"info","msg":"🎯 TOKEN FLAGGED"}
{"level":"info","msg":"Webhook notification sent","statusCode":200,"mint":"..."}
{"level":"info","msg":"Scan cycle complete","flagged":1}
```

And in Discord:
```
🎯 Profitable Token Detected!
Symbol: TOKEN
Score: 25/100
Mint: `3973hX...`
...
```

**This is the ONLY missing piece!** 🚀
