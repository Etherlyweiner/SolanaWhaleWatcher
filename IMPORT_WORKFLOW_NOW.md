# 🚀 IMPORT N8N WORKFLOW - DO THIS NOW!

**This is the ONLY thing preventing alerts from working!**

---

## 📍 Current Situation

- ✅ Scanner code: Working perfectly
- ✅ Evaluation logic: Correct
- ✅ Workflow file: Ready (`whale-watcher-discord-FIXED.json`)
- ❌ **N8N: No active workflow (not imported yet!)**

**This is why you haven't seen any alerts!**

---

## 🎯 Import Steps (Takes 2 Minutes)

### Step 1: Open N8N

Open your browser and go to:
```
http://localhost:5678
```

### Step 2: Add New Workflow

Click the **"+ Add workflow"** button (top right corner)

### Step 3: Import File

1. Click the **⋮ (three dots)** menu button (top right)
2. Select **"Import from File"**
3. Navigate to: `c:\Users\Jonat\SolanaWhaleWatcher\n8n-workflows\`
4. Select file: **`whale-watcher-discord-FIXED.json`**
5. Click **"Open"**

### Step 4: Activate Workflow

1. Find the **"Inactive/Active"** toggle switch (top right, near the three dots menu)
2. Click it to turn it **GREEN** (Active)
3. Click **"Save"** button (top right)

### Step 5: Verify

You should see:
- Workflow name: "Whale Watcher - Discord Alerts (FIXED)"
- 3 nodes: Webhook → High Score Filter → Discord Notification
- Green "Active" toggle
- "Saved" status

---

## ✅ After Import

### Test the Complete Pipeline

```powershell
cd c:\Users\Jonat\SolanaWhaleWatcher
node test-with-real-token.js
```

**Expected output:**
```
✅ Webhook Response: 200
Response: {"message":"Workflow was started"}
🎉 SUCCESS! Check:
1. N8N Executions: http://localhost:5678
2. Discord for alert message
```

**Then check:**
1. N8N Executions tab (should show green checkmark)
2. Discord channel (should show whale alert message)

---

## 🔄 Start Scanner

```powershell
cd c:\Users\Jonat\SolanaWhaleWatcher
npm run scan -- --interval=60
```

**Watch for:**
```
"candidates": 22
"flagged": 0    ← Waiting for token scoring > 20
"flagged": 1+   ← ALERT SENT! Check Discord!
```

---

## ⏱️ Timeline

- **After import**: System ready
- **After test**: Verify complete pipeline works
- **After starting scanner**: First alert within 1-10 minutes

---

## 🎉 That's It!

Once you import and activate the workflow:
- Scanner webhooks will reach N8N ✅
- N8N will filter scores > 20 ✅
- Discord will receive alerts ✅
- **You'll see your first whale alert!** 🐋💎

---

**Do this now, then come back and tell me when you see the first alert!** 🚀
