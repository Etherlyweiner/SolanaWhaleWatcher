# N8N Integration - Quick Start Guide

**For**: Solana Whale Watcher 2.0  
**Time Required**: 15-30 minutes  
**Difficulty**: Beginner-friendly

---

## 🎯 What You'll Build

By the end of this guide, you'll have:

1. ✅ N8N running locally
2. ✅ Webhook workflow receiving scanner data
3. ✅ Discord notifications for profitable tokens
4. ✅ (Optional) Claude AI analysis integrated

---

## Prerequisites ✅

You already have:

- ✅ Node.js v25.0.0
- ✅ npm/npx 11.6.2
- ✅ Whale Watcher fully configured
- ✅ All APIs validated

**You're ready to start!**

---

## Step 1: Start N8N (5 minutes)

### Option A: Quick Start with npx (Recommended for Testing)

```bash
npx n8n
```

**What happens**:

- Downloads N8N automatically
- Starts on <http://localhost:5678>
- Opens in your browser
- Data is temporary (lost on restart)

### Option B: Global Install (Recommended for Production)

```bash
# Install globally
npm install -g n8n

# Start N8N
n8n start
```

**What happens**:

- Permanent installation
- Data persisted in `~/.n8n`
- Starts on <http://localhost:5678>

### First-Time Setup

1. **N8N Opens in Browser**: <http://localhost:5678>
2. **Create Account**:
   - Email: <your-email@example.com>
   - Password: (your secure password)
   - Note: This is LOCAL only, not sent anywhere

3. **Welcome Screen**: Click "Get Started"

---

## Step 2: Create Your First Workflow (10 minutes)

### 2.1: Create New Workflow

1. Click **"+ New Workflow"** (top right)
2. Name it: **"Whale Watcher - Discord Alerts"**
3. Click **"Save"**

### 2.2: Add Webhook Trigger

1. Click the **"+"** button in the workflow canvas
2. Search for: **"Webhook"**
3. Click **"Webhook"** node
4. Configure:
   - **HTTP Method**: POST
   - **Path**: `whale-watcher`
   - **Authentication**: None (for testing)
   - **Respond**: Immediately
   - **Response Code**: 200

5. Click **"Listen for Test Event"** (button at bottom)
6. **Copy the webhook URL** - it will look like:

   ```
   http://localhost:5678/webhook-test/whale-watcher
   ```

### 2.3: Test the Webhook

Open a new terminal and run:

```bash
# Test the webhook
curl -X POST http://localhost:5678/webhook-test/whale-watcher \
  -H "Content-Type: application/json" \
  -d '{"test": "data", "mint": "ABC123", "score": 85}'
```

**In N8N**: You should see the test data appear!

---

## Step 3: Add Discord Notification (5 minutes)

### 3.1: Get Discord Webhook URL

1. **Open Discord** and go to your server
2. Right-click on the channel you want notifications in
3. Click **"Edit Channel"** → **"Integrations"**
4. Click **"Webhooks"** → **"New Webhook"**
5. Name it: **"Whale Watcher Bot"**
6. **Copy the Webhook URL**
7. Click **"Save Changes"**

Your webhook URL looks like:

```
https://discord.com/api/webhooks/123456789/ABC-XYZ-TOKEN
```

### 3.2: Add Discord Node in N8N

1. **In your N8N workflow**, click the **"+"** after the Webhook node
2. Search for: **"Discord"**
3. Select **"Discord"** node
4. Configure:
   - **Resource**: Webhook
   - **Operation**: Send Message to Webhook
   - **Webhook URL**: (paste your Discord webhook URL)
   - **Text**: Click the expression button and enter:

     ```
     🎯 Profitable Token Detected!
     
     Score: {{ $json.score }}/100
     Mint: {{ $json.mint }}
     ```

5. Click **"Execute Node"** to test

**Check Discord**: You should see the test message!

---

## Step 4: Connect Whale Watcher (5 minutes)

### 4.1: Activate Workflow

1. In N8N workflow, toggle **"Active"** (top right)
2. Click **"Save"**
3. **Copy the Production Webhook URL**:

   ```
   http://localhost:5678/webhook/whale-watcher
   ```

### 4.2: Configure Whale Watcher

1. Open your `.env` file:

   ```bash
   code c:\Users\Jonat\SolanaWhaleWatcher\.env
   ```

2. Add the N8N webhook URL:

   ```bash
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher
   ```

3. Save the file

### 4.3: Test End-to-End

```bash
# Start the scanner
cd c:\Users\Jonat\SolanaWhaleWatcher
npm run scan
```

**What happens**:

1. Scanner finds profitable tokens
2. Sends data to N8N webhook
3. N8N forwards to Discord
4. **You get notified!** 🎉

---

## Step 5: Enhance with Claude AI (Optional, 10 minutes)

### 5.1: Get Claude API Key

1. Go to: <https://console.anthropic.com/>
2. Sign up or log in
3. Navigate to **"API Keys"**
4. Click **"Create Key"**
5. **Copy your API key**: `sk-ant-...`

### 5.2: Add Claude Node in N8N

1. **In your workflow**, click **"+"** between Webhook and Discord
2. Search for: **"HTTP Request"**
3. Select **"HTTP Request"** node
4. Configure:
   - **Method**: POST
   - **URL**: `https://api.anthropic.com/v1/messages`
   - **Authentication**: Generic Credential Type
     - **Header Name**: `x-api-key`
     - **Header Value**: (paste your Claude API key)
   - **Headers**:

     ```json
     {
       "anthropic-version": "2023-06-01",
       "content-type": "application/json"
     }
     ```

   - **Body**:

     ```json
     {
       "model": "claude-3-sonnet-20240229",
       "max_tokens": 1024,
       "messages": [{
         "role": "user",
         "content": "Analyze this Solana token for investment potential:\n\nMint: {{ $json.mint }}\nScore: {{ $json.score }}\nReasons: {{ $json.reasons }}\n\nProvide: 1) Risk assessment 2) Entry strategy 3) Exit plan"
       }]
     }
     ```

5. Click **"Execute Node"** to test

### 5.3: Update Discord Message

1. Click on the **Discord node**
2. Update the **Text** field:

   ```
   🎯 Profitable Token Detected!
   
   **Score**: {{ $('Webhook').item.json.score }}/100
   **Mint**: {{ $('Webhook').item.json.mint }}
   
   **Claude AI Analysis**:
   {{ $('HTTP Request').item.json.content[0].text }}
   ```

3. Click **"Save"**

---

## Step 6: Monitor & Iterate (Ongoing)

### View Workflow Executions

1. In N8N, click **"Executions"** (left sidebar)
2. See all webhook triggers and results
3. Debug any failures

### Check Logs

```bash
# Whale Watcher logs
cd c:\Users\Jonat\SolanaWhaleWatcher
npm run scan

# Look for webhook success messages
```

### Adjust Scanner Criteria

Edit `src/core/scanner.js` to customize:

- Minimum score threshold
- Whale concentration ranges
- Volume requirements
- Liquidity thresholds

---

## Troubleshooting

### N8N Not Starting

**Issue**: `npx n8n` fails

**Fix**:

```bash
# Clear npx cache
npx clear-npx-cache

# Try again
npx n8n
```

### Webhook Not Receiving Data

**Issue**: Scanner runs but N8N doesn't receive data

**Checklist**:

- [ ] N8N workflow is **Active** (toggle on)
- [ ] Webhook URL in `.env` matches N8N
- [ ] Scanner is running: `npm run scan`
- [ ] Check N8N execution log for errors

**Test manually**:

```bash
curl -X POST http://localhost:5678/webhook/whale-watcher \
  -H "Content-Type: application/json" \
  -d '{"mint":"TEST","score":90,"reasons":["test"]}'
```

### Discord Not Receiving Messages

**Issue**: N8N receives data but Discord doesn't

**Checklist**:

- [ ] Discord webhook URL is correct
- [ ] Discord channel has webhook permissions
- [ ] Test Discord node directly in N8N
- [ ] Check Discord rate limits (30/min)

### Claude API Errors

**Issue**: HTTP Request node fails

**Common fixes**:

- Verify API key is correct
- Check header names (case-sensitive)
- Ensure `anthropic-version` header is present
- Review Claude API documentation

---

## Next Steps

### Expand Your Workflow

1. **Add Database Logging**:
   - PostgreSQL node
   - MongoDB node
   - Airtable node

2. **Multi-Channel Alerts**:
   - Telegram node
   - Email node (Gmail, SMTP)
   - SMS node (Twilio)

3. **Advanced Filtering**:
   - IF node to filter by score > 80
   - Switch node for different alert levels
   - Function node for custom logic

4. **Trading Bot Integration**:
   - Connect to exchange APIs
   - Automated buy/sell orders
   - Portfolio tracking

### Production Deployment

For 24/7 operation:

1. **Install Docker Desktop**:
   - Download: <https://www.docker.com/products/docker-desktop>

2. **Run N8N in Docker**:

   ```bash
   docker run -d \
     --name n8n \
     -p 5678:5678 \
     -v ~/.n8n:/home/node/.n8n \
     n8nio/n8n
   ```

3. **Set Up Reverse Proxy** (optional):
   - Use nginx or Caddy
   - Add SSL certificate
   - Custom domain

4. **Configure Authentication**:
   - Enable basic auth in N8N
   - Use environment variables for secrets
   - Implement webhook authentication

---

## Resources

### Official Documentation

- **N8N Docs**: <https://docs.n8n.io>
- **Webhook Docs**: <https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/>
- **Discord Docs**: <https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.discord/>
- **Claude API**: <https://docs.anthropic.com/claude/reference/getting-started-with-the-api>

### Whale Watcher Docs

- **N8N Integration Guide**: `docs/N8N_INTEGRATION.md`
- **System Analysis**: `docs/SYSTEM_ANALYSIS_REPORT.md`
- **User Guide**: `USER_GUIDE.md`

### Community

- **N8N Forum**: <https://community.n8n.io>
- **Discord**: <https://discord.gg/n8n>

---

## Summary Checklist

- [ ] N8N installed and running
- [ ] First workflow created
- [ ] Webhook trigger configured
- [ ] Discord notifications working
- [ ] Whale Watcher connected (`.env` configured)
- [ ] End-to-end test successful
- [ ] (Optional) Claude AI integrated
- [ ] Workflow active and monitoring

---

**Congratulations! You've successfully integrated N8N with Solana Whale Watcher!** 🎉

Start the scanner and watch the profitable tokens roll in:

```bash
npm run scan
```

Your autonomous trading intelligence is now live! 🚀💎
