# N8N Workflow Integration Guide

## Overview

**N8N** is a powerful workflow automation platform that can connect Solana Whale Watcher to external services like Discord, Telegram, email, databases, and more. This guide shows how to integrate the Whale Watcher with N8N for automated trading alerts and data processing.

## Why N8N?

- **Visual Workflow Builder**: Drag-and-drop interface to connect services
- **Self-Hosted**: Run on your own infrastructure for privacy
- **Extensive Integrations**: 200+ pre-built nodes (Discord, Telegram, Airtable, etc.)
- **Webhooks**: Receive real-time notifications from Whale Watcher
- **Scheduled Triggers**: Run analysis on a schedule automatically

---

## Architecture: Whale Watcher + N8N + Claude AI

```text
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

[Solana Whale Watcher]
         │
         │ (HTTP POST via Webhook)
         ↓
    [N8N Workflow]
         │
         ├──→ [Filter Node] ──→ Only high-score tokens (>80)
         │
         ├──→ [Claude AI Node] ──→ Analyze narrative & risk
         │                          Generate trading strategy
         ↓
    [Discord Notification]
         │
         ↓ 
    [Your Trading Bot]
         └──→ Execute trade via Telegram/API
```

---

## Setup Instructions

### Prerequisites

1. **Install N8N** (Docker recommended):

   ```bash
   docker run -it --rm \
     --name n8n \
     -p 5678:5678 \
     -v ~/.n8n:/home/node/.n8n \
     n8nio/n8n
   ```

2. **Access N8N**: Navigate to `http://localhost:5678`

3. **Get Discord Webhook URL** (optional):

   - Discord Server → Server Settings → Integrations → Webhooks
   - Create webhook, copy URL

### Step 1: Configure Whale Watcher Webhook

Add to your `.env` file:

```bash
# N8N Webhook URL (N8N will generate this)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher

# Discord Webhook (for direct notifications)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN
```

### Step 2: Create N8N Workflow

#### Node 1: Webhook Trigger (Start)

1. Add **Webhook** node to canvas
2. Set **HTTP Method**: `POST`
3. Set **Path**: `/whale-watcher`
4. Copy the **Production URL** and add to `.env` as `N8N_WEBHOOK_URL`

#### Node 2: Filter High-Value Tokens

1. Add **IF** node
2. Condition: `{{ $json["score"] }} >= 80`
3. Route **true** to continue, **false** to stop

#### Node 3: Claude AI Analysis (Optional)

1. Add **HTTP Request** node
2. Configure **Anthropic Claude API**:

   - Method: `POST`
   - URL: `https://api.anthropic.com/v1/messages`
   - Headers:
     - `x-api-key`: `YOUR_CLAUDE_API_KEY`
     - `anthropic-version`: `2023-06-01`
     - `content-type`: `application/json`
   - Body:

     ```json
     {
       "model": "claude-3-5-sonnet-20241022",
       "max_tokens": 1024,
       "messages": [{
         "role": "user",
         "content": "Analyze this Solana token opportunity:\n\nToken: {{ $json['symbol'] }}\nMint: {{ $json['mint'] }}\nScore: {{ $json['score'] }}/100\nReasons: {{ $json['reasons'].join(', ') }}\n\nProvide:\n1. Risk assessment (1-10)\n2. Entry strategy\n3. Red flags to watch\n4. Recommended position size"
       }]
     }
     ```

#### Node 4: Discord Notification

1. Add **Discord** node (or **HTTP Request** for webhook)
2. For webhook approach:

   - Method: `POST`
   - URL: `{{ $env.DISCORD_WEBHOOK_URL }}`
   - Body:

     ```json
     {
       "embeds": [{
         "title": "🎯 Profitable Token Detected",
         "description": "{{ $json['symbol'] }} - Score: {{ $json['score'] }}/100",
         "color": 65280,
         "fields": [
           {
             "name": "Mint Address",
             "value": "```{{ $json['mint'] }}```"
           },
           {
             "name": "Reasons",
             "value": "{{ $json['reasons'].join('\n') }}"
           },
           {
             "name": "Claude Analysis",
             "value": "{{ $node['Claude AI'].json['content'][0]['text'] }}"
           }
         ]
       }]
     }
     ```

#### Node 5: Save to Database (Optional)

1. Add **PostgreSQL** / **MongoDB** / **Airtable** node
2. Store flagged tokens for later analysis

---

## Whale Watcher Integration Code

### Add Webhook Support to Scanner

Update `src/core/scanner.js` to send webhooks when tokens are flagged:

```javascript
// In scanner.js, add webhook notification
async notifyWebhook(evaluation) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return;

  const https = require('https');
  const { URL } = require('url');

  const payload = {
    mint: evaluation.mint,
    symbol: evaluation.symbol,
    score: evaluation.score,
    reasons: evaluation.reasons,
    data: evaluation.data,
    timestamp: evaluation.evaluated_at,
  };

  try {
    const url = new URL(webhookUrl);
    const data = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      port: url.port || 5678,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      this.log.info('Webhook sent', { statusCode: res.statusCode });
    });

    req.on('error', (error) => {
      this.log.error('Webhook failed', { error: error.message });
    });

    req.write(data);
    req.end();
  } catch (error) {
    this.log.error('Webhook error', { error: error.message });
  }
}
```

Then call it in the `scan()` method:

```javascript
if (evaluation.meets_criteria) {
  flagged.push(evaluation);
  this.flaggedTokens.set(candidate.mint, evaluation);
  
  // Send webhook notification
  await this.notifyWebhook(evaluation);
  
  // Send Discord notification (if configured)
  if (this.onTokenFlagged) {
    this.onTokenFlagged(evaluation);
  }
}
```

---

## Example Workflows

### Workflow 1: Auto-Notify High-Score Tokens

**Trigger**: Whale Watcher webhook
**Filter**: Score >= 85
**Action**: Discord notification

### Workflow 2: Claude AI Deep Analysis

**Trigger**: Whale Watcher webhook
**Filter**: Score >= 75 AND whale accumulation detected
**AI Analysis**: Send data to Claude for risk assessment
**Action**: Discord embed with AI insights

### Workflow 3: Multi-Channel Alerts

**Trigger**: Whale Watcher webhook
**Parallel Actions**:

- Discord notification
- Telegram message
- Email alert
- Save to Google Sheets

### Workflow 4: Scheduled Scans

**Trigger**: Cron schedule (every 5 minutes)
**Action**: HTTP request to local Whale Watcher API
**Process**: Filter results, notify via Discord

---

## Claude AI Prompt Templates

### Risk Assessment Prompt

```text
Analyze this Solana memecoin opportunity:

Token: {{ symbol }}
Mint: {{ mint }}
Score: {{ score }}/100

Whale Activity:
- Top 5 holder concentration: {{ whale_concentration }}%
- Accumulation detected: {{ accumulation }}

Market Data:
- 24h Volume: ${{ volume }}
- Liquidity: ${{ liquidity }}

Launch Info:
- Age: {{ age }} minutes
- Rug Score: {{ rug_score }}%

Provide:
1. Risk score (1-10, where 10 is highest risk)
2. Is this likely a rug pull? Why/why not?
3. Recommended entry strategy
4. Red flags to monitor
5. Position sizing recommendation

Be concise and actionable.
```

### Entry Strategy Prompt

```text
Given this token data, create a step-by-step entry strategy:

Token: {{ symbol }} ({{ mint }})
Current Price: ${{ price }}
24h Volume: ${{ volume }}
Whale Concentration: {{ whale_concentration }}%

Include:
1. Entry price range
2. Position size (% of bankroll)
3. Stop loss placement
4. Take profit targets (2x, 5x, 10x)
5. Time horizon (scalp, swing, hold)
6. Monitoring checklist

Format as a trading plan I can execute immediately.
```

---

## Advanced: API Endpoint for N8N

Create a simple HTTP server in Whale Watcher to expose an API:

```javascript
// src/server/api.js
const http = require('http');
const createContext = require('../core/context');
const TokenScanner = require('../core/scanner');

async function startApiServer(port = 3000) {
  const context = await createContext();
  const scanner = new TokenScanner(context);

  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && req.url === '/scan') {
      // Manual scan trigger
      const results = await scanner.scan();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, flagged: results }));
    } else if (req.method === 'GET' && req.url === '/flagged') {
      // Get all flagged tokens
      const flagged = scanner.getFlaggedTokens();
      res.writeHead(200);
      res.end(JSON.stringify({ tokens: flagged }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });

  server.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
  });
}

module.exports = { startApiServer };
```

Then N8N can poll this API on a schedule!

---

## Benefits of This Setup

✅ **Autonomous Operation**: Scanner runs 24/7, N8N handles notifications
✅ **Multi-Channel Alerts**: Discord, Telegram, Email, SMS
✅ **AI-Enhanced**: Claude adds context and risk analysis
✅ **Persistent Storage**: Save opportunities to databases
✅ **Zero Manual Monitoring**: Get notified only when criteria met

---

## Next Steps

1. Set up N8N locally or on a VPS
2. Create basic webhook workflow (Trigger → Discord)
3. Test with `npm run scan` command
4. Add Claude AI node for deep analysis
5. Expand to multi-channel notifications
6. Build trading bot integration (Telegram bots, APIs)

**Ready to automate your Solana trading intelligence!** 🚀
