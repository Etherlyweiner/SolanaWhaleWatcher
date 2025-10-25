'use strict';

const { fetchJson } = require('../../util/http');

module.exports = (context) => {
  const logger = context.logger.child('provider:dexscreener');
  const config = context.config.providers.dexscreener;

  async function getPairs(mint) {
    if (!config?.enabled) {
      logger.warn('Dexscreener provider disabled in config.');
      return [];
    }

    try {
      const url = `${ensureNoTrailingSlash(config.baseUrl)}/tokens/${mint}`;
      const response = await fetchJson(
        url,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        },
        {
          retries: config.maxRetries,
          baseDelayMs: config.baseRetryMs,
        }
      );

      if (!response || !Array.isArray(response.pairs) || response.pairs.length === 0) {
        logger.warn('Dexscreener returned no pairs for mint', { mint });
        return [];
      }

      return response.pairs;
    } catch (error) {
      logger.error('Dexscreener request failed', { error: error.message, mint });
      return [];
    }
  }

  async function getMarketData(mint) {
    const pairs = await getPairs(mint);
    if (!pairs.length) {
      return null;
    }

    const primary = selectPrimaryPair(pairs);
    const priceUsd = safeNumber(primary.priceUsd);
    const volume24h = safeNumber(primary.volume?.h24);
    const fdvUsd = safeNumber(primary.fdv);
    const change1h = safeNumber(primary.priceChange?.h1);
    const change24h = safeNumber(primary.priceChange?.h24);
    const liquidityUsd = safeNumber(primary.liquidity?.usd);

    return {
      pairAddress: primary.pairAddress,
      dexId: primary.dexId,
      chainId: primary.chainId,
      baseToken: primary.baseToken,
      priceUsd,
      volume24h,
      fdvUsd,
      change1h,
      change24h,
      liquidityUsd,
    };
  }

  async function getMomentumSignals(mint) {
    const pairs = await getPairs(mint);
    if (!pairs.length) {
      return {
        breakoutProbability: 0,
        volumeSpike: false,
        rsi: null,
      };
    }

    const primary = selectPrimaryPair(pairs);
    const change1h = safeNumber(primary.priceChange?.h1);
    const change24h = safeNumber(primary.priceChange?.h24);
    const volume24h = safeNumber(primary.volume?.h24);
    const liquidityUsd = safeNumber(primary.liquidity?.usd);

    const volumeSpike = volume24h > (safeNumber(primary.volume?.h6) * 3 || 0);
    const momentumScore = Math.max(0, Math.min(1, (change1h + change24h / 4) / 100));
    const breakoutProbability = roundTo(momentumScore, 2);

    return {
      breakoutProbability,
      volumeSpike,
      rsi: deriveRsi(change1h, change24h, liquidityUsd),
    };
  }

  return {
    getMarketData,
    getMomentumSignals,
  };
};

function ensureNoTrailingSlash(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function selectPrimaryPair(pairs) {
  if (pairs.length === 1) return pairs[0];
  const sorted = [...pairs].sort((a, b) => {
    const liquidityA = safeNumber(a.liquidity?.usd);
    const liquidityB = safeNumber(b.liquidity?.usd);
    if (liquidityA !== liquidityB) {
      return liquidityB - liquidityA;
    }
    const volumeA = safeNumber(a.volume?.h24);
    const volumeB = safeNumber(b.volume?.h24);
    return volumeB - volumeA;
  });
  return sorted[0];
}

function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function deriveRsi(change1h, change24h, liquidityUsd) {
  const normalized = Math.max(-100, Math.min(100, change1h * 2 + change24h / 2));
  const base = 50 + normalized / 2;
  const liquidityAdjust = liquidityUsd > 250000 ? 5 : liquidityUsd > 50000 ? 2 : -3;
  return Math.max(0, Math.min(100, Math.round(base + liquidityAdjust)));
}
