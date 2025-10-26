# 🎯 SCORING STRATEGY FIX - Focus on What Works

**Date**: October 26, 2025
**Issue**: Unreliable data sources causing weak scores and errors
**Solution**: Redesign scoring to work excellently with Dexscreener only

---

## 🔍 ROOT CAUSE ANALYSIS

### Current Problems

**1. Helius RPC Errors:**
```
"Invalid param: not a Token mint"
```
- Many Solana tokens aren't SPL tokens with holder data
- Helius RPC fails on these tokens
- Scanner treats this as error instead of expected behavior

**2. Pump.fun Completely Down:**
```
HTTP 404 Not Found
```
- API unavailable (probably changed endpoints)
- No launch data available
- 0/45 possible points lost

**3. Weak Scoring:**
```
Current maximum: 20-30 points
Threshold: 20 points (from N8N)
BUT code checks: score >= 60 ❌ MISMATCH!
```

**4. Score Breakdown:**
- Whale concentration: 25 pts ⚠️ (rarely works)
- Whale accumulation: 20 pts ⚠️ (rarely works)
- Rug score: 20 pts ❌ (never works - no Pump.fun)
- Liquidity: 15 pts ❌ (never works - no Pump.fun)
- Team share: 10 pts ❌ (never works - no Pump.fun)
- Strong volume: 10 pts ✅ (works!)
- Volume spike: 10 pts ✅ (works!)

**Maximum possible score: 20 points** (only market data)
**Code requires: 60 points** ← **THIS IS WHY NO ALERTS!**

---

## 💡 STRATEGIC SOLUTION

### Phase 1: Fix Immediate Issues (15 minutes)

**1. Change Internal Threshold**
Current code:
```javascript
const meets_criteria = score >= 60;  // ❌ TOO HIGH!
```

Should be:
```javascript
const meets_criteria = score >= 20;  // ✅ Matches N8N
```

**2. Make Helius Errors Silent**
```javascript
// Catch "not a Token mint" specifically
catch (error) {
  if (error.message.includes('not a Token mint')) {
    logger.debug('Token has no SPL holder data (expected for some tokens)', { mint });
    return null;
  }
  // ... other errors
}
```

**3. Disable Pump.fun Completely**
```javascript
// In scanner.js - just skip it
async fetchLaunchData(mint) {
  // Pump.fun API is down, skip entirely
  return null;
}
```

### Phase 2: Redesign Scoring for Dexscreener Only (30 minutes)

**New Scoring System (0-100 points):**

**Market Momentum (40 points):**
- Strong 24h volume (>$50k): 15 pts
- Massive volume (>$500k): +10 pts (25 total)
- Volume spike (4x+): 15 pts

**Price Action (30 points):**
- 1h price increase (>5%): 10 pts
- 6h price increase (>20%): 10 pts
- 24h price increase (>50%): 10 pts

**Liquidity Health (20 points):**
- Good liquidity (>$10k): 10 pts
- Great liquidity (>$50k): +5 pts (15 total)
- Liquidity locked: 5 pts

**Freshness Bonus (10 points):**
- Very new (<1 hour): 10 pts
- New (<6 hours): 5 pts

**Total: 100 points possible with Dexscreener data only!**

---

## 🔧 IMPLEMENTATION PLAN

### Step 1: Fix Internal Threshold (NOW)

**File:** `src/core/scanner.js` Line 255

**Change:**
```javascript
// OLD:
const meets_criteria = score >= 60;

// NEW:
const meets_criteria = score >= 20; // Match N8N workflow threshold
```

### Step 2: Silence Helius Errors (NOW)

**File:** `src/data/providers/heliusRpcProvider.js`

**Wrap getTokenIntel in better error handling:**
```javascript
async getTokenIntel(mint, options = {}) {
  try {
    // ... existing code ...
    const [supplyResult, largestAccounts] = await Promise.all([
      rpc.request('getTokenSupply', [mint]),
      rpc.request('getTokenLargestAccounts', [mint, { commitment: context.config.solana.commitment }]),
    ]);
    // ...
  } catch (error) {
    // Many tokens don't have SPL holder data - this is normal
    if (error.code === -32602 || error.message?.includes('not a Token mint')) {
      logger.debug('Token has no SPL holder data (normal for some tokens)', { mint });
      return null;
    }
    // Real errors - log them
    logger.error('Helius RPC request failed', { method, params, error: error.message, code: error.code });
    throw error;
  }
}
```

### Step 3: Disable Pump.fun (NOW)

**File:** `src/core/scanner.js`

**Replace fetchLaunchData:**
```javascript
async fetchLaunchData(mint) {
  // Pump.fun API is unavailable - skip entirely
  // Focus on market data from Dexscreener
  this.log.debug('Pump.fun data skipped (API unavailable)', { mint });
  return null;
}
```

### Step 4: Redesign Scoring Algorithm (30 MIN)

**File:** `src/core/scanner.js`

**New evaluateCandidate function:**
```javascript
async evaluateCandidate(candidate) {
  const { mint } = candidate;
  const reasons = [];
  let score = 0;

  // Fetch market data ONLY (reliable source)
  const marketData = await this.fetchMarketData(mint);
  
  if (!marketData) {
    this.log.warn('No market data available for token', { mint });
    return {
      mint,
      symbol: '???',
      meets_criteria: false,
      score: 0,
      reasons: ['❌ No market data available'],
      data: { market: null },
      evaluated_at: new Date().toISOString(),
    };
  }

  // === MARKET MOMENTUM (40 points) ===
  const volume24h = marketData.volume24hUsd || 0;
  const volume6h = marketData.volume6hUsd || 0;
  
  // Strong volume
  if (volume24h >= 50000) {
    reasons.push(`✅ Strong volume: $${(volume24h / 1000).toFixed(0)}k`);
    score += 15;
    
    // Massive volume bonus
    if (volume24h >= 500000) {
      reasons.push(`🔥 Massive volume: $${(volume24h / 1000).toFixed(0)}k`);
      score += 10; // Total 25 for this criterion
    }
  }
  
  // Volume spike
  const volumeRatio = volume6h > 0 ? volume24h / volume6h : 0;
  if (volumeRatio >= 4.0) {
    reasons.push(`✅ Volume spike: ${volumeRatio.toFixed(1)}x`);
    score += 15;
  }

  // === PRICE ACTION (30 points) ===
  const priceChange1h = marketData.priceChange1h || 0;
  const priceChange6h = marketData.priceChange6h || 0;
  const priceChange24h = marketData.priceChange24h || 0;
  
  if (priceChange1h > 5) {
    reasons.push(`✅ 1h pump: +${priceChange1h.toFixed(1)}%`);
    score += 10;
  }
  
  if (priceChange6h > 20) {
    reasons.push(`✅ 6h moon: +${priceChange6h.toFixed(1)}%`);
    score += 10;
  }
  
  if (priceChange24h > 50) {
    reasons.push(`🚀 24h rocket: +${priceChange24h.toFixed(1)}%`);
    score += 10;
  }

  // === LIQUIDITY HEALTH (20 points) ===
  const liquidity = marketData.liquidityUsd || 0;
  
  if (liquidity >= 10000) {
    reasons.push(`✅ Good liquidity: $${(liquidity / 1000).toFixed(0)}k`);
    score += 10;
    
    if (liquidity >= 50000) {
      reasons.push(`💎 Great liquidity: $${(liquidity / 1000).toFixed(0)}k`);
      score += 5; // Total 15 for this criterion
    }
  }
  
  if (marketData.liquidityLocked) {
    reasons.push(`🔒 Liquidity locked`);
    score += 5;
  }

  // === FRESHNESS BONUS (10 points) ===
  const ageMinutes = candidate.age_minutes || 0;
  
  if (ageMinutes < 60) {
    reasons.push(`⚡ Very fresh: ${Math.floor(ageMinutes)} min old`);
    score += 10;
  } else if (ageMinutes < 360) {
    reasons.push(`🆕 Fresh: ${Math.floor(ageMinutes / 60)}h old`);
    score += 5;
  }

  // === DECISION ===
  const meets_criteria = score >= 20; // Match N8N threshold

  return {
    mint,
    symbol: marketData.symbol || '???',
    meets_criteria,
    score,
    reasons,
    data: {
      market: marketData,
      holder: null, // Not using unreliable holder data
      launch: null, // Not using unavailable Pump.fun data
    },
    evaluated_at: new Date().toISOString(),
  };
}
```

---

## 📊 NEW SCORING EXAMPLES

### Good Token Example:
```
Volume: $150k (15 pts)
Volume spike: 6x (15 pts)
1h price: +8% (10 pts)
Liquidity: $25k (10 pts)
Age: 45 min (10 pts)

Total: 60/100 points ✅ Strong alert!
```

### Decent Token Example:
```
Volume: $75k (15 pts)
6h price: +25% (10 pts)
Liquidity: $15k (10 pts)

Total: 35/100 points ✅ Alert (above 20 threshold)
```

### Weak Token (No Alert):
```
Volume: $25k (0 pts)
Price: +2% (0 pts)
Liquidity: $5k (0 pts)

Total: 0/100 points ❌ No alert (correct!)
```

---

## 🎯 BENEFITS OF NEW STRATEGY

### Reliability ✅
- **100% based on working data source** (Dexscreener)
- No dependence on failing APIs
- No "not a Token mint" errors
- Clean logs

### Better Scoring ✅
- **0-100 point scale** fully utilized
- Multiple ways to score high
- Rewards actual market activity
- Catches momentum plays

### Easier Tuning ✅
- Threshold: 20-40 for conservative
- Threshold: 10-20 for aggressive
- All based on real, available data
- Can adjust weights easily

### Catches Real Opportunities ✅
- **High volume** = real interest
- **Price pumping** = momentum
- **Good liquidity** = tradeable
- **Fresh** = early entry

---

## 🚀 IMPLEMENTATION ORDER

### IMMEDIATE (Next 15 minutes):

1. **Fix internal threshold** (Line 255 in scanner.js)
   ```javascript
   const meets_criteria = score >= 20;
   ```

2. **Silence Helius errors** (heliusRpcProvider.js)
   ```javascript
   if (error.code === -32602 || error.message?.includes('not a Token mint')) {
     logger.debug('Token has no SPL holder data (normal)', { mint });
     return null;
   }
   ```

3. **Disable Pump.fun** (scanner.js fetchLaunchData)
   ```javascript
   return null; // Skip entirely
   ```

4. **Restart scanner** - Errors should stop!

### NEXT (30-60 minutes):

5. **Implement new scoring algorithm**
   - Replace evaluateCandidate function
   - Test with live tokens
   - Tune thresholds

6. **Test & verify**
   - Run for 1 hour
   - Check alert quality
   - Adjust weights if needed

---

## 📈 EXPECTED RESULTS

### After Quick Fix (Steps 1-4):
- ✅ No more Helius errors in logs
- ✅ No more Pump.fun 404s
- ✅ Alerts start appearing (matches threshold)
- ⚠️ Still weak scoring (20-30 pts max)

### After Full Fix (Steps 5-6):
- ✅ Clean logs (DEBUG only)
- ✅ Smart scoring (0-100 range)
- ✅ Quality alerts (good tokens score 40-80)
- ✅ Catches real opportunities

---

## 🎯 BOTTOM LINE

**Current Problem:**
- Code requires 60 points
- Maximum possible: 20 points
- Result: **ZERO ALERTS EVER** ❌

**Quick Fix:**
- Change threshold to 20
- Silence expected errors
- Result: **ALERTS START WORKING** ✅

**Full Fix:**
- Redesign scoring for Dexscreener
- Utilize full 0-100 scale
- Result: **SMART, QUALITY ALERTS** 🎯

**This will transform your system from broken to brilliant!** 🚀
