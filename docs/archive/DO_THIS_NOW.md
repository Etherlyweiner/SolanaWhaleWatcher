# 🚀 DO THIS NOW - Your Scanner Already Works

## ✅ GREAT NEWS: Webhook Code Already Built

Your scanner **already has** full N8N integration (lines 103-104, 342-400 in `scanner.js`)

**All you need**: Connect the dots in 2 minutes!

---

## 📝 Step 1: Update .env File

**Open file**:

```text
c:\Users\Jonat\SolanaWhaleWatcher\.env
```

**Add this line at the end**:

```bash
N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher
```

**Save file.**

---

## 📥 Step 2: Import FIXED Workflow to N8N

**Why FIXED?** The original workflow expected different field names. The FIXED version matches your scanner's actual output.

**Import this file**:

```text
c:\Users\Jonat\SolanaWhaleWatcher\n8n-workflows\whale-watcher-discord-alerts-FIXED.json
```

**How**:

1. Open <http://localhost:5678>
2. Press `Ctrl + I`
3. Open the FIXED file in Notepad
4. Copy all (Ctrl + A, Ctrl + C)
5. Paste in N8N (Ctrl + V)
6. Click "Import"
7. Toggle "Active" (green)
8. Click "Save"

---

## 🧪 Step 3: Test It

```bash
cd c:\Users\Jonat\SolanaWhaleWatcher
npm run scan
```

**Watch for**:

- Console: `Webhook notification sent { statusCode: 200 }`
- N8N: New executions appear in "Executions" panel
- Discord: Rich formatted alerts appear in your channel!

---

## 📊 What Your Scanner Sends

```json
{
  "mint": "ABC123...",
  "symbol": "PUMP",
  "score": 85,
  "reasons": [
    "✅ Whale concentration: 18.5%",
    "✅ 3 whales accumulating",
    "✅ Low rug score: 12%"
  ],
  "data": {
    "holder": { "topFiveShare": 0.185, "totalHolders": 1234 },
    "market": { "priceUsd": 1.00, "volume24hUsd": 125000, "liquidityUsd": 45000 },
    "launch": { "rugScore": 12, "ageMinutes": 8 }
  },
  "timestamp": "2025-10-25T18:30:00.000Z"
}
```

---

## 🎯 That's It

**3 actions:**

1. ✅ Add 1 line to `.env`
2. ✅ Import FIXED workflow
3. ✅ Run `npm run scan`

**Time needed:** 2 minutes

**What happens:** Discord alerts start flowing automatically! 🎉

---

**For detailed explanation, see:** `WEBHOOK_VERIFICATION.md`
