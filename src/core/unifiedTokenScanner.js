'use strict';

class UnifiedTokenScanner {
  constructor(context) {
    this.context = context;
    this.log = context.logger.child('unified-scanner');
    this.dexscreener = null; // Will be initialized with enhanced Dexscreener provider
    this.isRunning = false;
    this.scanInterval = 30000; // 30 seconds (Dexscreener rate limit friendly)
  }

  async initialize() {
    // Load enhanced Dexscreener provider
    const DexscreenerEnhanced = require('../data/providers/dexscreenerProviderEnhanced');
    this.dexscreener = new DexscreenerEnhanced(this.context);
    this.log.info('Unified token scanner initialized');
  }

  async start() {
    if (this.isRunning) {
      this.log.warn('Unified scanner already running');
      return;
    }

    await this.initialize();
    this.isRunning = true;
    this.log.info('Starting unified Dexscreener token scanner', { 
      interval: `${this.scanInterval / 1000}s`,
      sources: 'Pump.fun, Raydium, Orca, Meteora, ALL Solana DEXes'
    });

    // Main scan loop
    this.scanLoop();
  }

  async scanLoop() {
    while (this.isRunning) {
      try {
        await this.scanCycle();
      } catch (error) {
        this.log.error('Scan cycle failed', { error: error.message, stack: error.stack });
      }

      // Wait before next cycle
      await new Promise(resolve => setTimeout(resolve, this.scanInterval));
    }
  }

  async scanCycle() {
    const startTime = Date.now();

    try {
      // Step 1: Get new pairs from ALL DEXes via Dexscreener (last 5 minutes)
      const newPairs = await this.dexscreener.getNewPairs(5);
      
      this.log.info('New token scan', { 
        count: newPairs.length,
        sources: 'ALL DEXes (Pump.fun, Raydium, Orca, etc.)'
      });

      if (newPairs.length === 0) {
        this.log.debug('No new pairs found');
        return;
      }

      // Step 2: Filter by minimum liquidity ($10k+)
      const liquidPairs = this.dexscreener.filterByLiquidity(newPairs, 10000);
      
      this.log.info('Filtered by liquidity', {
        total: newPairs.length,
        qualified: liquidPairs.length,
        minLiquidity: '$10k'
      });

      // Step 3: Group by DEX to show breakdown
      const byDex = {};
      liquidPairs.forEach(pair => {
        if (!byDex[pair.dexId]) byDex[pair.dexId] = 0;
        byDex[pair.dexId]++;
      });
      
      if (Object.keys(byDex).length > 0) {
        this.log.info('DEX breakdown', byDex);
      }

      // Step 4: Process each qualified pair
      for (const pair of liquidPairs) {
        // Skip if already processed
        if (this.dexscreener.hasSeenPair(pair.pairAddress)) {
          continue;
        }

        // NEW TOKEN DETECTED! 🚨
        await this.handleNewToken(pair);
        
        // Mark as seen to prevent duplicates
        this.dexscreener.markPairAsSeen(pair.pairAddress);
      }

      const duration = Date.now() - startTime;
      this.log.debug('Unified scan complete', { 
        duration: `${duration}ms`,
        newPairs: newPairs.length,
        qualified: liquidPairs.length
      });

    } catch (error) {
      this.log.error('Unified scan failed', { error: error.message });
    }
  }

  async handleNewToken(pair) {
    this.log.info('🎯 NEW TOKEN DETECTED', {
      symbol: pair.baseToken.symbol,
      dex: pair.dexId,
      liquidity: `$${pair.liquidity.usd.toLocaleString()}`,
      ageMinutes: pair.ageMinutes.toFixed(1)
    });

    // Build new token alert payload
    const alert = {
      type: 'NEW_TOKEN',
      priority: 'CRITICAL',
      mint: pair.baseToken.address,
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name || pair.baseToken.symbol,
      score: this.calculateTokenScore(pair),
      data: {
        dex: {
          id: pair.dexId,
          pairAddress: pair.pairAddress,
          chain: pair.chainId,
        },
        token: {
          address: pair.baseToken.address,
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name,
        },
        quote: {
          address: pair.quoteToken.address,
          symbol: pair.quoteToken.symbol,
        },
        market: {
          priceUsd: pair.priceUsd,
          priceNative: pair.priceNative,
          liquidityUsd: pair.liquidity.usd,
          volume24h: pair.volume.h24,
          volume6h: pair.volume.h6,
          volume1h: pair.volume.h1,
          fdv: pair.fdv,
          marketCap: pair.marketCap,
        },
        priceChange: {
          h24: pair.priceChange.h24,
          h6: pair.priceChange.h6,
          h1: pair.priceChange.h1,
          m5: pair.priceChange.m5,
        },
        transactions: {
          h24: pair.txns.h24,
          h6: pair.txns.h6,
          h1: pair.txns.h1,
          m5: pair.txns.m5,
        },
        timing: {
          createdAt: new Date(pair.createdAt).toISOString(),
          ageMinutes: pair.ageMinutes,
        },
      },
      reasons: this.generateReasons(pair),
      actions: {
        buy: `https://jup.ag/swap/SOL-${pair.baseToken.address}`,
        chart: pair.url || `https://dexscreener.com/solana/${pair.baseToken.address}`,
        dex: this.getDexUrl(pair),
      },
      timing: {
        detectedAt: new Date().toISOString(),
        tokenCreatedAt: new Date(pair.createdAt).toISOString(),
        ageMinutes: pair.ageMinutes,
        windowSeconds: 300, // 5 minute window for best entry
      },
    };

    // Send webhook notification
    await this.notifyWebhook(alert);
  }

  /**
   * Calculate token score based on liquidity, volume, age, and transactions
   */
  calculateTokenScore(pair) {
    let score = 50; // Base score

    // Liquidity scoring (0-25 points)
    if (pair.liquidity.usd >= 100000) score += 25;
    else if (pair.liquidity.usd >= 50000) score += 20;
    else if (pair.liquidity.usd >= 25000) score += 15;
    else if (pair.liquidity.usd >= 10000) score += 10;

    // Age scoring - newer is better (0-15 points)
    if (pair.ageMinutes < 1) score += 15;
    else if (pair.ageMinutes < 2) score += 12;
    else if (pair.ageMinutes < 3) score += 10;
    else if (pair.ageMinutes < 5) score += 5;

    // Volume scoring (0-15 points)
    if (pair.volume.h1 >= 50000) score += 15;
    else if (pair.volume.h1 >= 25000) score += 12;
    else if (pair.volume.h1 >= 10000) score += 10;
    else if (pair.volume.h1 >= 5000) score += 5;

    // Transaction activity (0-10 points)
    const totalTxns = (pair.txns.h1?.buys || 0) + (pair.txns.h1?.sells || 0);
    if (totalTxns >= 100) score += 10;
    else if (totalTxns >= 50) score += 7;
    else if (totalTxns >= 25) score += 5;
    else if (totalTxns >= 10) score += 3;

    // Price momentum bonus (0-5 points)
    if (pair.priceChange.h1 > 50) score += 5;
    else if (pair.priceChange.h1 > 25) score += 3;
    else if (pair.priceChange.h1 > 10) score += 2;

    return Math.min(100, score);
  }

  /**
   * Generate reasons why this token is interesting
   */
  generateReasons(pair) {
    const reasons = [];

    // DEX source
    const dexName = this.getDexName(pair.dexId);
    reasons.push(`🆕 New token on ${dexName} (${pair.ageMinutes.toFixed(1)} minutes old)`);

    // Liquidity
    if (pair.liquidity.usd >= 100000) {
      reasons.push(`💰 Excellent liquidity: $${pair.liquidity.usd.toLocaleString()}`);
    } else if (pair.liquidity.usd >= 50000) {
      reasons.push(`💧 Strong liquidity: $${pair.liquidity.usd.toLocaleString()}`);
    } else if (pair.liquidity.usd >= 25000) {
      reasons.push(`💧 Good liquidity: $${pair.liquidity.usd.toLocaleString()}`);
    } else {
      reasons.push(`💧 Minimum liquidity met: $${pair.liquidity.usd.toLocaleString()}`);
    }

    // Volume
    if (pair.volume.h1 > 0) {
      reasons.push(`📊 Early volume: $${pair.volume.h1.toLocaleString()} in 1h`);
    }
    if (pair.volume.h24 > 0) {
      reasons.push(`📈 24h volume: $${pair.volume.h24.toLocaleString()}`);
    }

    // Transactions
    const txns1h = (pair.txns.h1?.buys || 0) + (pair.txns.h1?.sells || 0);
    if (txns1h >= 50) {
      reasons.push(`🔥 Active trading: ${txns1h} transactions in 1h`);
    }

    // Price momentum
    if (pair.priceChange.h1 > 0) {
      reasons.push(`📈 Price up ${pair.priceChange.h1.toFixed(1)}% in 1h`);
    }

    // Always mention the opportunity
    reasons.push(`⚡ First 5 minutes - optimal entry window`);

    return reasons;
  }

  /**
   * Get user-friendly DEX name
   */
  getDexName(dexId) {
    const dexNames = {
      'pumpswap': 'Pump.fun',
      'raydium': 'Raydium',
      'orca': 'Orca',
      'meteora': 'Meteora',
      'phoenix': 'Phoenix',
    };
    return dexNames[dexId.toLowerCase()] || dexId;
  }

  /**
   * Get DEX-specific URL for trading
   */
  getDexUrl(pair) {
    const dexId = pair.dexId.toLowerCase();
    const token = pair.baseToken.address;

    switch (dexId) {
      case 'pumpswap':
        return `https://pump.fun/${token}`;
      case 'raydium':
        return `https://raydium.io/swap/?inputMint=sol&outputMint=${token}`;
      case 'orca':
        return `https://www.orca.so/?tokenIn=So11111111111111111111111111111111111111112&tokenOut=${token}`;
      default:
        return `https://jup.ag/swap/SOL-${token}`;
    }
  }

  async notifyWebhook(alert) {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      this.log.warn('No webhook URL configured - skipping notification');
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });

      if (response.ok) {
        this.log.info('✅ New token alert sent', { 
          mint: alert.mint,
          symbol: alert.symbol,
          dex: alert.data.dex.id,
          score: alert.score,
          status: response.status
        });
      } else {
        const text = await response.text();
        this.log.warn('Webhook failed', { 
          status: response.status,
          statusText: response.statusText,
          body: text
        });
      }
    } catch (error) {
      this.log.error('Failed to send webhook', { error: error.message });
    }
  }

  stop() {
    this.isRunning = false;
    this.log.info('Unified token scanner stopped');
  }
}

module.exports = UnifiedTokenScanner;
