'use strict';

const { fetchJson } = require('../../util/http');
const { TtlCache } = require('../../util/cache');
const { roundTo } = require('../../util/number');

const DEFAULT_CACHE_TTL_MS = 15_000;

function buildBase(config) {
  return config?.baseUrl ? config.baseUrl.replace(/\/+$/, '') : 'https://api.dexscreener.com';
}

class DexscreenerProvider {
  constructor(context) {
    this.ctx = context;
    this.logger = context.logger.child('provider:dexscreener');
    this.config = context.config.providers.dexscreener || {};
    this.baseUrl = buildBase(this.config);
    this.cache = new TtlCache({ ttlMs: this.config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS });
  }

  async _get(path, { useCache = true, ttlMs } = {}) {
    const url = `${this.baseUrl}${path}`;
    const cacheKey = `dex:${url}`;

    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    }

    const response = await fetchJson(
      url,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
      {
        retries: this.config.retry?.attempts ?? this.config.maxRetries ?? 2,
        baseDelayMs: this.config.retry?.baseDelayMs ?? this.config.baseRetryMs ?? 250,
        jitterMs: this.config.retry?.jitterMs,
      }
    );

    if (useCache) {
      this.cache.set(cacheKey, response, ttlMs ?? this.config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS);
    }

    return response;
  }

  async tokenProfilesLatest() {
    const data = await this._get('/token-profiles/latest/v1', { ttlMs: 30_000 });
    return Array.isArray(data) ? data : data?.items || [];
  }

  async tokenBoostsLatest() {
    const data = await this._get('/token-boosts/latest/v1', { ttlMs: 30_000 });
    return Array.isArray(data) ? data : data?.items || [];
  }

  async tokenBoostsTop() {
    const data = await this._get('/token-boosts/top/v1', { ttlMs: 30_000 });
    return Array.isArray(data) ? data : data?.items || [];
  }

  async ordersForToken(chainId, tokenAddress) {
    if (!chainId || !tokenAddress) {
      throw new Error('ordersForToken requires chainId and tokenAddress');
    }
    const path = `/orders/v1/${encodeURIComponent(chainId)}/${encodeURIComponent(tokenAddress)}`;
    return this._get(path, { ttlMs: 60_000 });
  }

  async pairByPairId(chainId, pairId) {
    if (!chainId || !pairId) {
      throw new Error('pairByPairId requires chainId and pairId');
    }
    const path = `/latest/dex/pairs/${encodeURIComponent(chainId)}/${encodeURIComponent(pairId)}`;
    const data = await this._get(path, { ttlMs: 10_000 });
    const pair = data?.pairs?.[0];
    return this._normalizePair(pair);
  }

  async searchPairs(query, limit = 50) {
    if (!query) {
      return [];
    }
    const path = `/latest/dex/search?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit)}`;
    const data = await this._get(path, { ttlMs: 10_000 });
    return (data?.pairs || []).map((pair) => this._normalizePair(pair)).filter(Boolean);
  }

  async tokenPools(chainId, tokenAddress) {
    if (!chainId || !tokenAddress) {
      throw new Error('tokenPools requires chainId and tokenAddress');
    }
    const path = `/token-pairs/v1/${encodeURIComponent(chainId)}/${encodeURIComponent(tokenAddress)}`;
    const pools = await this._get(path, { ttlMs: 15_000 });
    const array = Array.isArray(pools) ? pools : pools?.pairs || [];
    return array.map((pool) => this._normalizePool(pool)).filter(Boolean);
  }

  async tokensByAddresses(chainId, tokenAddresses = []) {
    if (!chainId || !Array.isArray(tokenAddresses) || tokenAddresses.length === 0) {
      throw new Error('tokensByAddresses requires chainId and a non-empty tokenAddresses array');
    }

    const joined = tokenAddresses
      .slice(0, 30)
      .map((address) => encodeURIComponent(address))
      .join(',');
    const path = `/tokens/v1/${encodeURIComponent(chainId)}/${joined}`;
    const data = await this._get(path, { ttlMs: 15_000 });
    return (data?.pairs || []).map((pair) => this._normalizePair(pair)).filter(Boolean);
  }

  async primaryPairForMint(chainId, mint) {
    const pairs = await this.tokensByAddresses(chainId, [mint]);
    if (!pairs.length) {
      return null;
    }
    return this._selectPrimaryPair(pairs);
  }

  async getMarketData(mint, { chainId } = {}) {
    const targetChain = chainId || this.config.defaultChainId || 'solana';
    const pair = await this.primaryPairForMint(targetChain, mint);
    if (!pair) {
      return null;
    }

    return {
      pairAddress: pair.pairAddress,
      dexId: pair.dexId,
      chainId: pair.chainId,
      baseToken: pair.baseToken,
      priceUsd: pair.priceUsd,
      volume24h: pair.volume?.h24 ?? null,
      fdvUsd: pair.fdv ?? null,
      change1h: pair.priceChange?.h1 ?? null,
      change24h: pair.priceChange?.h24 ?? null,
      liquidityUsd: pair.liquidityUsd,
    };
  }

  async getMomentumSignals(mint, { chainId } = {}) {
    const targetChain = chainId || this.config.defaultChainId || 'solana';
    const pair = await this.primaryPairForMint(targetChain, mint);
    if (!pair) {
      return {
        breakoutProbability: 0,
        volumeSpike: false,
        rsi: null,
      };
    }

    const change1h = pair.priceChange?.h1 ?? 0;
    const change24h = pair.priceChange?.h24 ?? 0;
    const volume6h = pair.volume?.h6 ?? 0;
    const volume24h = pair.volume?.h24 ?? 0;
    const liquidityUsd = pair.liquidityUsd ?? 0;

    const volumeSpike = volume24h > (volume6h * 3 || 0);
    const momentumScore = Math.max(0, Math.min(1, (Number(change1h) + Number(change24h) / 4) / 100));

    return {
      breakoutProbability: roundTo(momentumScore, 2),
      volumeSpike,
      rsi: this._deriveRsi(Number(change1h), Number(change24h), liquidityUsd),
    };
  }

  async getLatestPairs(chainId = 'solana', limit = 20) {
    // Use token-profiles/latest endpoint which shows newest tokens
    const path = `/token-profiles/latest/v1`;
    try {
      this.logger.info('Fetching latest pairs from Dexscreener', { path, chainId, limit });
      const data = await this._get(path, { ttlMs: 5000, useCache: false });
      const profiles = Array.isArray(data) ? data : [];
      
      this.logger.info('Dexscreener response received', { 
        totalProfiles: profiles.length,
        chainId 
      });
      
      // Filter for Solana tokens and map to our format
      const solanaTokens = profiles.filter(profile => profile.chainId === chainId);
      this.logger.info('Filtered Solana tokens', { count: solanaTokens.length });
      
      const result = solanaTokens
        .slice(0, limit)
        .map((profile) => ({
          mint: profile.tokenAddress,
          symbol: profile.icon ? null : profile.tokenAddress?.slice(0, 6), // Use icon as symbol if available
          name: profile.description || 'Unknown',
          pairAddress: null,
          dexId: null,
          priceUsd: null,
          liquidityUsd: 1, // Placeholder - will be fetched in evaluation
          volume24h: null,
          pairCreatedAt: null,
          timestamp: Date.now(),
        }))
        .filter((token) => token.mint);
      
      this.logger.info('Returning formatted tokens', { 
        count: result.length,
        firstToken: result[0]?.mint 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch latest pairs', { error: error.message, chainId });
      return [];
    }
  }

  _normalizePair(raw) {
    if (!raw) {
      return null;
    }
    const base = raw.baseToken || {};
    const quote = raw.quoteToken || {};
    const priceUsd = raw.priceUsd ?? raw.price;

    return {
      chainId: raw.chainId,
      dexId: raw.dexId,
      url: raw.url,
      pairAddress: raw.pairAddress,
      baseToken: {
        address: base.address,
        symbol: base.symbol,
        name: base.name,
        decimals: base.decimals,
      },
      quoteToken: {
        address: quote.address,
        symbol: quote.symbol,
        name: quote.name,
        decimals: quote.decimals,
      },
      priceUsd: priceUsd != null ? roundTo(parseFloat(priceUsd), 6) : null,
      priceNative: raw.priceNative ?? null,
      liquidityUsd: raw.liquidity?.usd ?? null,
      volume: raw.volume || {},
      priceChange: raw.priceChange || {},
      txns: raw.txns || {},
      fdv: raw.fdv ?? null,
      marketCap: raw.marketCap ?? null,
      pairCreatedAt: raw.pairCreatedAt ?? null,
      info: raw.info || {},
      boosts: raw.boosts || {},
    };
  }

  _normalizePool(raw) {
    if (!raw) {
      return null;
    }
    return {
      chainId: raw.chainId,
      dexId: raw.dexId,
      url: raw.url,
      pairAddress: raw.pairAddress,
      baseToken: raw.baseToken,
      quoteToken: raw.quoteToken,
      priceUsd: raw.priceUsd != null ? roundTo(parseFloat(raw.priceUsd), 6) : null,
      liquidityUsd: raw.liquidity?.usd ?? null,
    };
  }

  _selectPrimaryPair(pairs) {
    if (pairs.length === 1) {
      return pairs[0];
    }

    const sorted = [...pairs].sort((a, b) => {
      const liquidityA = a.liquidityUsd ?? 0;
      const liquidityB = b.liquidityUsd ?? 0;
      if (liquidityA !== liquidityB) {
        return liquidityB - liquidityA;
      }
      const volumeA = a.volume?.h24 ?? 0;
      const volumeB = b.volume?.h24 ?? 0;
      return volumeB - volumeA;
    });

    return sorted[0];
  }

  _deriveRsi(change1h, change24h, liquidityUsd) {
    const normalized = Math.max(-100, Math.min(100, change1h * 2 + change24h / 2));
    const base = 50 + normalized / 2;
    const liquidityAdjust = liquidityUsd > 250000 ? 5 : liquidityUsd > 50000 ? 2 : -3;
    return Math.max(0, Math.min(100, Math.round(base + liquidityAdjust)));
  }
}

function createProvider(context) {
  return new DexscreenerProvider(context);
}

module.exports = createProvider;
module.exports.DexscreenerProvider = DexscreenerProvider;
