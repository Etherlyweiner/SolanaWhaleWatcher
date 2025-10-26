# 🎯 System Monitoring Checklist

## 📊 What to Watch (Next 5 Minutes)

### 1. Discord Alert (Immediate - After Test)
**Expected:**
- ✅ Symbol: SOL (not "Unknown")
- ✅ Score: 85/100 (not "0/100")
- ✅ Price: $150.25 (not "N/A")
- ✅ Liquidity: $5,000,000 (not "N/A")
- ✅ All fields populated with real data

**If you see "Unknown" and "N/A":**
- Workflow might not be activated
- Check N8N executions tab for errors

---

### 2. Scanner Logs (New PowerShell Window)
**Expected every 60 seconds:**
```
"Starting scan cycle"
"Discovered candidates" { count: 20-30 }
"Fetching latest pairs from Dexscreener"
"Dexscreener response received" { totalProfiles: 30 }
"Filtered Solana tokens" { count: 26 }
"Scan cycle complete" { candidates: 26, flagged: 0-2 }
```

**If candidates = 0:**
- Check debug logs for Dexscreener issues
- Verify provider is being called

**If flagged = 0 but candidates > 0:**
- Tokens found but none scored > 75
- Lower N8N threshold to 60 for more alerts

---

### 3. N8N Executions (http://localhost:5678)
**Expected:**
- Green checkmark executions
- Click execution → See webhook data
- See "High Score Filter" pass/fail
- See "Discord Notification" sent

**If executions show errors:**
- Red X = Check error message
- Click node to see what failed
- Verify Discord webhook URL is correct

---

### 4. Discord Channel
**Expected:**
- Test alert appears immediately (SOL token)
- Real alerts appear when score > 75
- Rich formatting with all data

---

## 🎯 Success Indicators

✅ **Immediate Success (1 minute):**
- Test alert in Discord with correct SOL data
- N8N execution shows green checkmark
- Scanner window opens and shows logs

✅ **Short Term Success (5 minutes):**
- Scanner finding 20-30 candidates per cycle
- At least 1 N8N execution per minute
- Occasional Discord alerts for high-scoring tokens

✅ **Full Operational (15 minutes):**
- Consistent candidate discovery
- Multiple Discord alerts seen
- No errors in any component
- System running smoothly

---

## 🔧 Quick Fixes

### Problem: No Discord Alert After Test
**Fix:**
1. Check N8N executions - did workflow run?
2. Verify webhook is activated (green toggle)
3. Check Discord webhook URL in workflow

### Problem: Scanner Shows 0 Candidates
**Fix:**
1. Check debug logs for "Dexscreener response"
2. Verify Dexscreener API returning data
3. Check if provider is initialized

### Problem: Candidates Found But No Alerts
**Fix:**
1. Open N8N workflow
2. Change filter from `> 75` to `> 60`
3. Save and wait 60 seconds
4. Should see alerts immediately

---

## 📍 URLs to Keep Open

- **N8N**: http://localhost:5678 (monitor executions)
- **Discord**: Your whale-watcher channel (see alerts)
- **Scanner**: PowerShell window (watch logs)

---

## 🎉 You'll Know It's Working When...

1. Discord shows test alert with **real SOL data**
2. Scanner logs show **candidates: 20+**
3. N8N shows **green executions**
4. Occasional **high-score alerts** in Discord

**If all 4 happen, YOU'RE FULLY OPERATIONAL!** 🚀
