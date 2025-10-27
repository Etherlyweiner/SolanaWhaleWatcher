# Helius API Authentication - Complete Breakdown

## 🔍 Issue Summary

The program is receiving **HTTP 401 Unauthorized** errors when calling the Helius RPC endpoint, indicating authentication failure. This document provides a complete breakdown of Helius API authentication, endpoint structure, and how to resolve the issue.

---

## 📚 Helius API Architecture

Helius provides **TWO distinct services** with potentially different authentication methods:

### 1. **RPC Endpoints** (Solana JSON-RPC)

- **Purpose**: Standard Solana blockchain RPC calls (getTokenSupply, getSignaturesForAddress, etc.)
- **Base URL**: `https://mainnet.helius-rpc.com/`
- **Authentication**: API key embedded in URL as query parameter
- **Format**: `https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY`

### 2. **REST API Endpoints** (Helius-specific services)

- **Purpose**: Enhanced Helius services (token metadata, webhooks, analytics)
- **Base URL**: `https://api.helius.xyz/`
- **Authentication**: API key as query parameter
- **Format**: `https://api.helius.xyz/v0/endpoint?api-key=YOUR_API_KEY`

---

## 🔐 How the Program Uses Helius

### Current Configuration Structure

The program expects **3 environment variables**:

```bash
# Required - RPC endpoint with embedded API key
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_RPC_API_KEY

# Optional - REST API base URL (has default)
HELIUS_REST_URL=https://api.helius.xyz

# Optional - Separate API key for REST endpoints
HELIUS_API_KEY=YOUR_REST_API_KEY
```

### What Each Component Does

#### RPC Client (`src/data/providers/heliusRpc.js`)

```javascript
// Makes JSON-RPC calls directly to the RPC URL
// Examples: getTokenSupply, getTokenLargestAccounts, getMultipleAccounts
const response = await fetchJson(
  config.rpcUrl,  // Uses HELIUS_RPC_URL (already includes ?api-key=...)
  {
    method: 'POST',
    body: { jsonrpc: '2.0', method: 'getTokenSupply', params: [...] }
  }
);
```

#### REST Client (`src/data/providers/heliusRest.js`)

```javascript
// Makes REST API calls for enhanced services
// Example: token metadata lookup
const url = new URL('v1/token-metadata', config.restUrl);
url.searchParams.set('api-key', config.apiKey);  // Adds ?api-key=...

const response = await fetchJson(url.toString(), {
  method: 'POST',
  body: { mintAccounts: [...] },
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`  // ALSO adds Bearer token
  }
});
```

**NOTE**: The REST client is adding the API key in **TWO places** (query param + Authorization header). This might be redundant or incorrect based on Helius documentation.

---

## ⚠️ Current Problem: 401 Unauthorized

### Error Details

```
HTTP 401 Unauthorized for https://mainnet.helius-rpc.com/?api-key=ad42d0ce-6fe3-4005-8c2c-2d8debc7d0f8
```

### Possible Causes

1. **API Key Expired or Revoked**
   - Helius API keys can expire or be rotated
   - Free tier keys might have been disabled
   - Account might have been suspended

2. **Incorrect API Key Format**
   - The key might be for a different service (REST vs RPC)
   - Some Helius accounts use "Secure RPC endpoints" with different URLs

3. **Rate Limit Exceeded**
   - Free tier has request limits
   - 401 might be returned instead of 429 for rate limits

4. **Account Issue**
   - Free trial expired
   - Payment issue
   - Account needs verification

---

## ✅ Solution: Get New Helius Credentials

### Step 1: Access Helius Dashboard

1. Go to [https://dashboard.helius.dev](https://dashboard.helius.dev)
2. Sign up for a new account or log in to existing account
3. Navigate to **API Keys** section

### Step 2: Create/Locate Your API Key

Helius typically provides **ONE API key** that works for both RPC and REST endpoints.

**What to look for:**

- API key format: Usually a UUID-like string (e.g., `f26c6485-96ad-4f9b-9a8f-9d2da59a2394`)
- Endpoint URL provided in dashboard

### Step 3: Identify Your Endpoint Type

Helius offers different endpoint types:

#### Option A: Standard RPC Endpoints

```
Mainnet: https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
Devnet: https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

#### Option B: Secure RPC Endpoints (Account-Specific)

```
Format: https://abc-123-fast-mainnet.helius-rpc.com
```

- NO API key in URL (embedded in the unique subdomain)
- More secure as the API key isn't visible in logs
- Specific to your account

### Step 4: Update Environment Variables

Based on what you find in the dashboard:

**If using Standard RPC:**

```bash
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_NEW_KEY
HELIUS_API_KEY=YOUR_NEW_KEY
```

**If using Secure RPC:**

```bash
HELIUS_RPC_URL=https://YOUR-UNIQUE-ID-fast-mainnet.helius-rpc.com
HELIUS_API_KEY=YOUR_NEW_KEY
```

---

## 🔍 Verification Process

### Method 1: Test RPC Endpoint Directly

```bash
# Test RPC endpoint with curl
curl -X POST "https://mainnet.helius-rpc.com/?api-key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getHealth"
  }'
```

**Expected Response:**

```json
{
  "jsonrpc": "2.0",
  "result": "ok",
  "id": 1
}
```

**401 Unauthorized Response:**

```json
{
  "error": "Unauthorized"
}
```

### Method 2: Test with Solana Token Query

```bash
# Test token supply query (SOL token)
curl -X POST "https://mainnet.helius-rpc.com/?api-key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTokenSupply",
    "params": ["So11111111111111111111111111111111111111112"]
  }'
```

**Expected Response:**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "value": {
      "amount": "...",
      "decimals": 9,
      "uiAmount": ...,
      "uiAmountString": "..."
    }
  },
  "id": 1
}
```

### Method 3: Use the Program's Built-in Validator

```bash
# Run the validation utility
npm run validate
```

This will test both RPC and REST endpoints and report which are working.

---

## 🛠️ Fix the REST API Implementation

The current REST client has a potential issue - it's adding the API key in **two places**:

1. Query parameter: `?api-key=YOUR_KEY`
2. Authorization header: `Bearer YOUR_KEY`

### According to Helius Documentation

The correct method is **query parameter only** for most endpoints:

```bash
curl "https://api.helius.xyz/v0/addresses/WALLET/transactions?api-key=YOUR_KEY"
```

### Recommended Fix

Update `src/data/providers/heliusRest.js`:

```javascript
async function request(path, { method = 'POST', body = {} } = {}) {
  ensureRestConfigured();

  const url = new URL(path, ensureTrailingSlash(config.restUrl));
  if (config.apiKey) {
    url.searchParams.set('api-key', config.apiKey);
  }

  return fetchJson(
    url.toString(),
    {
      method,
      body,
      headers: {
        'Content-Type': 'application/json',
        // REMOVE the Authorization header - not needed for Helius
      },
    },
    {
      retries: config.maxRetries,
      baseDelayMs: config.baseRetryMs,
    }
  );
}
```

---

## 📊 Helius Account Tiers & Limits

### Free Tier

- **Requests**: Limited per month
- **RPC Methods**: Standard Solana RPC only
- **Rate Limits**: Lower
- **May require**: Credit card verification even for free tier

### Paid Tiers

- **Developer**: $49/month
- **Professional**: $249/month
- **Enterprise**: Custom pricing

### Rate Limits

- Free tier: ~100 requests/second
- Paid tiers: Higher limits based on plan

---

## 🎯 Action Plan

### Immediate Steps

1. **Verify API Key Status**

   ```bash
   # Test current key
   curl -X POST "https://mainnet.helius-rpc.com/?api-key=ad42d0ce-6fe3-4005-8c2c-2d8debc7d0f8" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
   ```

2. **Get New Key if Needed**
   - Log in to [dashboard.helius.dev](https://dashboard.helius.dev)
   - Navigate to API Keys
   - Create new key or copy existing

3. **Update .env File**

   ```bash
   HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=NEW_KEY
   HELIUS_API_KEY=NEW_KEY
   ```

4. **Test Again**

   ```bash
   npm run validate
   ```

### Long-term Improvements

1. **Fix REST Client** - Remove redundant Authorization header
2. **Add Better Error Messages** - Distinguish between auth errors and rate limits
3. **Implement Retry Logic** - Handle rate limits gracefully
4. **Monitor Usage** - Track API call counts to avoid limits

---

## 🔗 Resources

- **Helius Dashboard**: <https://dashboard.helius.dev>
- **Authentication Docs**: <https://www.helius.dev/docs/api-reference/authentication>
- **RPC Endpoints**: <https://www.helius.dev/docs/api-reference/endpoints>
- **Solana RPC Methods**: <https://www.helius.dev/docs/api-reference/rpc>
- **Support**: <https://discord.com/invite/6GXdee3gBj>

---

## 💡 Why the Program Still Works

The program demonstrates **graceful degradation**:

1. When Helius RPC fails → Falls back to cached holder data
2. When Helius REST fails → Skips token metadata
3. When all Helius fails → Uses Dexscreener for market data

This is why you can still analyze tokens even with the 401 error!

---

**Next Steps**: Get your new API key from the Helius dashboard and update the `.env` file.
