'use strict';

const logger = require('../util/logger');

/**
 * Autonomous Token Scanner
 * Monitors Pump.fun launches, Dexscreener trending, and holder data
 * to automatically discover tokens meeting profitability criteria
 */

const SCAN_CRITERIA = {
  // Whale activity thresholds
  minWhaleConcentration: 0.15,  // Top 5 holders must own at least 15%
  maxWhaleConcentration: 0.50,  // But not more than 50% (distribution risk)
  minAccumulationDelta: 5000,   // Whales adding at least 5k tokens
  
  // Launch characteristics (Pump.fun)
  maxAgeMinutes: 15,
  minLiquidityUsd: 10000,
  maxRugScore: 40,
  maxTeamSharePercent: 20,
  
  // Market metrics (Dexscreener)
  minVolumeUsd: 50000,
  minVolumeSpikeRatio: 2.5,     // 24h vol / 6h vol
  minRsiMomentum: 60,
  maxRsiOverbought: 85,
};

class TokenScanner {
  constructor(context) {
    this.context = context;
    this.log = logger('core:scanner');
    this.flaggedTokens = new Map();  // mint -> scan result
    this.scanInterval = null;
  }

  /**
   * Start autonomous scanning
   * @param {Object} options - Scan configuration
   * @param {number} options.intervalSeconds - How often to scan (default: 60)
   * @param {Function} options.onTokenFlagged - Callback when token meets criteria
   */
  start(options = {}) {
    const {
      intervalSeconds = 60,
      onTokenFlagged = null,
    } = options;

    if (this.scanInterval) {
      this.log.warn('Scanner already running');
      return;
    }

    this.log.info('Starting autonomous token scanner', { intervalSeconds });
    this.onTokenFlagged = onTokenFlagged;

    // Initial scan
    this.scan().catch(err => this.log.error('Initial scan failed', { error: err.message }));

    // Schedule periodic scans
    this.scanInterval = setInterval(() => {
      this.scan().catch(err => this.log.error('Scheduled scan failed', { error: err.message }));
    }, intervalSeconds * 1000);
  }

  /**
   * Stop autonomous scanning
   */
  stop() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
      this.log.info('Scanner stopped');
    }
  }

  /**
   * Execute a single scan cycle
   * @returns {Promise<Array>} Array of flagged tokens
   */
  async scan() {
    const startTime = Date.now();
    this.log.info('Starting scan cycle');

    const candidates = await this.discoverCandidates();
    this.log.info('Discovered candidates', { count: candidates.length });

    const flagged = [];
    for (const candidate of candidates) {
      try {
        const evaluation = await this.evaluateCandidate(candidate);
        if (evaluation.meets_criteria) {
          flagged.push(evaluation);
          this.flaggedTokens.set(candidate.mint, evaluation);
          
          this.log.info('🎯 TOKEN FLAGGED', {
            mint: candidate.mint,
            score: evaluation.score,
            reasons: evaluation.reasons,
          });

          // Send webhook notification
          await this.notifyWebhook(evaluation);

          // Send Discord notification (if configured)
          if (this.onTokenFlagged) {
            this.onTokenFlagged(evaluation);
          }
        }
      } catch (error) {
        this.log.error('Failed to evaluate candidate', { mint: candidate.mint, error: error.message });
      }
    }

    const duration = Date.now() - startTime;
    this.log.info('Scan cycle complete', { 
      duration: `${duration}ms`, 
      candidates: candidates.length,
      flagged: flagged.length,
    });

    return flagged;
  }

  /**
   * Discover candidate tokens from multiple sources
   * @returns {Promise<Array>} Array of candidate objects with mint addresses
   */
  async discoverCandidates() {
    const candidates = [];

    // Source 1: Pump.fun recent launches
    try {
      const launches = await this.context.providers.pumpfun.getRecentLaunches();
      for (const launch of launches) {
        const ageMinutes = (Date.now() - launch.timestamp) / 1000 / 60;
        if (ageMinutes <= SCAN_CRITERIA.maxAgeMinutes) {
          candidates.push({
            mint: launch.mint,
            source: 'pumpfun',
            age_minutes: ageMinutes,
          });
        }
      }
      this.log.debug('Pump.fun candidates', { count: candidates.length });
    } catch (error) {
      this.log.warn('Failed to fetch Pump.fun launches', { error: error.message });
    }

    // Source 2: Dexscreener trending/gainers
    // TODO: Add Dexscreener trending API integration
    // This would require a new provider method to fetch trending tokens

    return candidates;
  }

  /**
   * Evaluate a candidate token against criteria
   * @param {Object} candidate - Candidate object with mint address
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateCandidate(candidate) {
    const { mint } = candidate;
    const reasons = [];
    let score = 0;

    // Fetch all required data
    const [holderData, marketData, launchData] = await Promise.all([
      this.fetchHolderData(mint),
      this.fetchMarketData(mint),
      this.fetchLaunchData(mint),
    ]);

    // Criterion 1: Whale concentration (sweet spot)
    if (holderData) {
      const whaleConcentration = holderData.topFiveShare || 0;
      if (whaleConcentration >= SCAN_CRITERIA.minWhaleConcentration && 
          whaleConcentration <= SCAN_CRITERIA.maxWhaleConcentration) {
        reasons.push(`✅ Whale concentration: ${(whaleConcentration * 100).toFixed(1)}%`);
        score += 25;
      }

      // Check for whale accumulation
      const topHolders = holderData.holders || [];
      const accumulators = topHolders.filter(h => h.delta && h.delta > SCAN_CRITERIA.minAccumulationDelta);
      if (accumulators.length > 0) {
        reasons.push(`✅ ${accumulators.length} whales accumulating`);
        score += 20;
      }
    }

    // Criterion 2: Launch characteristics
    if (launchData) {
      if (launchData.rugScore < SCAN_CRITERIA.maxRugScore) {
        reasons.push(`✅ Low rug score: ${launchData.rugScore.toFixed(1)}%`);
        score += 20;
      }
      if (launchData.liquidityUsd >= SCAN_CRITERIA.minLiquidityUsd) {
        reasons.push(`✅ Sufficient liquidity: $${launchData.liquidityUsd.toLocaleString()}`);
        score += 15;
      }
      if (launchData.teamSharePercent <= SCAN_CRITERIA.maxTeamSharePercent) {
        reasons.push(`✅ Low team share: ${launchData.teamSharePercent.toFixed(1)}%`);
        score += 10;
      }
    }

    // Criterion 3: Market momentum
    if (marketData) {
      if (marketData.volume24hUsd >= SCAN_CRITERIA.minVolumeUsd) {
        reasons.push(`✅ Strong volume: $${marketData.volume24hUsd.toLocaleString()}`);
        score += 10;
      }

      const volumeRatio = marketData.volume24hUsd / (marketData.volume6hUsd || 1);
      if (volumeRatio >= SCAN_CRITERIA.minVolumeSpikeRatio) {
        reasons.push(`✅ Volume spike: ${volumeRatio.toFixed(1)}x`);
        score += 10;
      }
    }

    // Decision: Flag if score >= 60 (at least 3-4 criteria met)
    const meets_criteria = score >= 60;

    return {
      mint,
      symbol: marketData?.symbol || '???',
      meets_criteria,
      score,
      reasons,
      data: {
        holder: holderData,
        market: marketData,
        launch: launchData,
      },
      evaluated_at: new Date().toISOString(),
    };
  }

  /**
   * Fetch holder data for a token
   */
  async fetchHolderData(mint) {
    try {
      const holders = await this.context.loaders.solana.loadHolders(mint);
      if (!holders || holders.length === 0) return null;

      const top5 = holders.slice(0, 5);
      const totalSupply = holders.reduce((sum, h) => sum + (h.balance || 0), 0);
      const topFiveBalance = top5.reduce((sum, h) => sum + (h.balance || 0), 0);
      const topFiveShare = totalSupply > 0 ? topFiveBalance / totalSupply : 0;

      return {
        holders: holders.slice(0, 25),
        topFiveShare,
        totalHolders: holders.length,
      };
    } catch (error) {
      this.log.warn('Failed to fetch holder data', { mint, error: error.message });
      return null;
    }
  }

  /**
   * Fetch market data for a token
   */
  async fetchMarketData(mint) {
    try {
      const market = await this.context.providers.dexscreener.getTokenData(mint);
      if (!market) return null;

      return {
        symbol: market.symbol,
        priceUsd: market.priceUsd,
        volume24hUsd: market.volume?.h24 || 0,
        volume6hUsd: market.volume?.h6 || 0,
        liquidityUsd: market.liquidity?.usd || 0,
      };
    } catch (error) {
      this.log.warn('Failed to fetch market data', { mint, error: error.message });
      return null;
    }
  }

  /**
   * Fetch launch data for a token
   */
  async fetchLaunchData(mint) {
    try {
      const launches = await this.context.providers.pumpfun.getRecentLaunches();
      const launch = launches.find(l => l.mint === mint);
      if (!launch) return null;

      return {
        creator: launch.creator,
        liquidityUsd: launch.liquidityUsd || 0,
        teamSharePercent: launch.teamSharePercent || 0,
        rugScore: launch.rugScore || 0,
        ageMinutes: (Date.now() - launch.timestamp) / 1000 / 60,
      };
    } catch (error) {
      this.log.warn('Failed to fetch launch data', { mint, error: error.message });
      return null;
    }
  }

  /**
   * Get all currently flagged tokens
   * @returns {Array} Array of flagged token evaluations
   */
  getFlaggedTokens() {
    return Array.from(this.flaggedTokens.values());
  }

  /**
   * Clear flagged tokens older than specified minutes
   * @param {number} maxAgeMinutes - Clear tokens flagged longer than this
   */
  clearStaleFlags(maxAgeMinutes = 60) {
    const now = Date.now();
    let cleared = 0;

    for (const [mint, evaluation] of this.flaggedTokens.entries()) {
      const age = (now - new Date(evaluation.evaluated_at).getTime()) / 1000 / 60;
      if (age > maxAgeMinutes) {
        this.flaggedTokens.delete(mint);
        cleared++;
      }
    }

    if (cleared > 0) {
      this.log.info('Cleared stale flags', { count: cleared });
    }
  }

  /**
   * Send webhook notification to N8N or other services
   * @param {Object} evaluation - Token evaluation result
   * @returns {Promise<void>}
   */
  async notifyWebhook(evaluation) {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      return;
    }

    const https = require('https');
    const http = require('http');
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
      const protocol = url.protocol === 'https:' ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      await new Promise((resolve, reject) => {
        const req = protocol.request(options, (res) => {
          this.log.info('Webhook notification sent', { 
            statusCode: res.statusCode,
            mint: evaluation.mint,
          });
          resolve();
        });

        req.on('error', (error) => {
          this.log.error('Webhook notification failed', { 
            error: error.message,
            mint: evaluation.mint,
          });
          reject(error);
        });

        req.write(data);
        req.end();
      });
    } catch (error) {
      this.log.error('Webhook error', { error: error.message });
    }
  }
}

module.exports = TokenScanner;
