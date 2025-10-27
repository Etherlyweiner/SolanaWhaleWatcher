'use strict';

const { fetchJson } = require('../../util/http');
const { TtlCache } = require('../../util/cache');

class DexscreenerProviderEnhanced {
  constructor(context) {
    this.ctx = context;
    this.logger = context.logger.child('provider:dexscreener-enhanced');
    this.baseUrl = 'https://api.dexscreener.com/latest/dex';
    this.cache = new TtlCache({ ttlMs: 15000 }); // 15 second cache
    
    // Track which pairs we've already alerted on
    this.seenPairs = new Set();
    
    // Track last batch of pairs to detect new ones
    this.lastPairAddresses = new Set();
  }

  /**
   * Get latest tokens across ALL DEXes on Solana
   * This includes Pump.fun, Raydium, Orca, Meteora, etc.
   * 
   * Uses the search endpoint with Solana-related queries
   */
  async getLatestSolanaTokens() {
    try {
      // We'll use multiple search terms to catch different types of tokens
      const searchTerms = ['SOL', 'Solana', ''];
      const allPairs = [];
      const seenAddresses = new Set();

      for (const term of searchTerms) {
        const url = term ? `${this.baseUrl}/search/?q=${encodeURIComponent(term)}` : `${this.baseUrl}/search/?q=a`; // Generic search
        
        try {
          const response = await fetchJson(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
          });

          if (response?.pairs && Array.isArray(response.pairs)) {
            // Filter for Solana chain only
            const solanaPairs = response.pairs.filter(p => p.chainId === 'solana');
            
            // Deduplicate
            for (const pair of solanaPairs) {
              if (!seenAddresses.has(pair.pairAddress)) {
                allPairs.push(pair);
                seenAddresses.add(pair.pairAddress);
              }
            }
          }
        } catch (error) {
          this.logger.debug('Search term failed', { term, error: error.message });
        }
      }

      this.logger.debug('Fetched Solana pairs', { count: allPairs.length });
      return allPairs;

    } catch (error) {
      this.logger.warn('Failed to fetch latest tokens', { error: error.message });
      return [];
    }
  }

  /**
   * Get new pairs created in the last N minutes
   * Works across ALL DEXes: Pump.fun, Raydium, Orca, etc.
   */
  async getNewPairs(maxAgeMinutes = 5) {
    try {
      const pairs = await this.getLatestSolanaTokens();
      const now = Date.now();
      const maxAgeMs = maxAgeMinutes * 60 * 1000;

      const newPairs = pairs
        .filter(pair => {
          // Check if pair is recent
          if (!pair.pairCreatedAt) return false;
          const pairAge = now - pair.pairCreatedAt;
          if (pairAge > maxAgeMs) return false;

          // Check if we've already seen this pair
          if (this.seenPairs.has(pair.pairAddress)) return false;

          return true;
        })
        .map(pair => this.normalizePair(pair))
        .sort((a, b) => b.createdAt - a.createdAt); // Newest first

      this.logger.info('New pairs found', { 
        total: pairs.length,
        new: newPairs.length,
        maxAge: `${maxAgeMinutes}m`
      });

      return newPairs;
    } catch (error) {
      this.logger.error('Failed to get new pairs', { error: error.message });
      return [];
    }
  }

  /**
   * Normalize pair data to consistent format
   */
  normalizePair(pair) {
    const ageMinutes = (Date.now() - pair.pairCreatedAt) / 1000 / 60;
    
    return {
      // Identifiers
      pairAddress: pair.pairAddress,
      chainId: pair.chainId,
      dexId: pair.dexId,
      
      // Token info
      baseToken: {
        address: pair.baseToken?.address,
        name: pair.baseToken?.name,
        symbol: pair.baseToken?.symbol,
      },
      quoteToken: {
        address: pair.quoteToken?.address,
        name: pair.quoteToken?.name,
        symbol: pair.quoteToken?.symbol,
      },
      
      // Price & Market Data
      priceNative: pair.priceNative,
      priceUsd: pair.priceUsd,
      
      // Liquidity
      liquidity: {
        usd: pair.liquidity?.usd || 0,
        base: pair.liquidity?.base || 0,
        quote: pair.liquidity?.quote || 0,
      },
      
      // Volume
      volume: {
        h24: pair.volume?.h24 || 0,
        h6: pair.volume?.h6 || 0,
        h1: pair.volume?.h1 || 0,
        m5: pair.volume?.m5 || 0,
      },
      
      // Price Changes
      priceChange: {
        h24: pair.priceChange?.h24 || 0,
        h6: pair.priceChange?.h6 || 0,
        h1: pair.priceChange?.h1 || 0,
        m5: pair.priceChange?.m5 || 0,
      },
      
      // Transactions
      txns: {
        h24: pair.txns?.h24 || { buys: 0, sells: 0 },
        h6: pair.txns?.h6 || { buys: 0, sells: 0 },
        h1: pair.txns?.h1 || { buys: 0, sells: 0 },
        m5: pair.txns?.m5 || { buys: 0, sells: 0 },
      },
      
      // FDV & Market Cap
      fdv: pair.fdv,
      marketCap: pair.marketCap,
      
      // Timing
      createdAt: pair.pairCreatedAt,
      ageMinutes: ageMinutes,
      
      // URLs
      url: pair.url,
      
      // Info
      info: pair.info,
    };
  }

  /**
   * Mark a pair as seen (to prevent duplicate alerts)
   */
  markPairAsSeen(pairAddress) {
    this.seenPairs.add(pairAddress);
    this.logger.debug('Pair marked as seen', { pairAddress });
  }

  /**
   * Check if we've already alerted on this pair
   */
  hasSeenPair(pairAddress) {
    return this.seenPairs.has(pairAddress);
  }

  /**
   * Filter pairs by minimum liquidity threshold
   */
  filterByLiquidity(pairs, minLiquidityUsd = 10000) {
    return pairs.filter(pair => pair.liquidity.usd >= minLiquidityUsd);
  }

  /**
   * Filter pairs by DEX (e.g., only Pump.fun tokens)
   */
  filterByDex(pairs, dexIds = []) {
    if (dexIds.length === 0) return pairs;
    return pairs.filter(pair => dexIds.includes(pair.dexId.toLowerCase()));
  }

  /**
   * Get pairs from specific DEXes (Pump.fun, Raydium, etc.)
   */
  async getPairsByDex(dexIds = ['pumpswap', 'raydium', 'orca'], maxAgeMinutes = 5) {
    const newPairs = await this.getNewPairs(maxAgeMinutes);
    return this.filterByDex(newPairs, dexIds);
  }

  /**
   * Clear the seen pairs cache (useful for testing)
   */
  clearSeenPairs() {
    this.seenPairs.clear();
    this.logger.info('Cleared seen pairs cache');
  }
}

module.exports = DexscreenerProviderEnhanced;
