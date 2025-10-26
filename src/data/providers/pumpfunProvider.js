
'use strict';

const { fetchJson } = require('../../util/http');
const { TtlCache } = require('../../util/cache');

module.exports = (context) => {
  const logger = context.logger.child('provider:pumpfun');
  const config = context.config.providers.pumpfun;
  const cache = new TtlCache({ ttlMs: config.cacheTtlMs ?? context.config.cache.ttlMs });

  async function getRecentLaunches(options = {}) {
    if (!config?.enabled) {
      logger.warn('Pump.fun provider disabled in config.');
      return [];
    }

    const limit = options.limit || 20;
    const offset = options.offset || 0;

    const cacheKey = `${limit}:${offset}:${options.order || 'new'}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return cloneLaunches(cached);
    }

    try {
      const url = buildBrowseUrl(config.baseUrl, { limit, offset, order: options.order || 'new' });
      const response = await fetchJson(
        url,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
        {
          retries: config.maxRetries,
          baseDelayMs: config.baseRetryMs,
        }
      );

      const items = normalizeLaunchPayload(response);
      const normalized = items.map((item) => ({
        mint: item.mint,
        name: item.name,
        symbol: item.symbol,
        launchedAt: item.launchedAt,
        initialLiquidity: item.initialLiquidity,
        teamSharePercent: item.teamSharePercent,
        rugScore: item.rugScore,
        creator: item.creator,
      }));

      cache.set(cacheKey, normalized, config.cacheTtlMs ?? context.config.cache.ttlMs / 2);

      return cloneLaunches(normalized);
    } catch (error) {
      logger.debug('Pump.fun API unavailable (optional, using Dexscreener)', { error: error.message });
      return [];
    }
  }

  return {
    getRecentLaunches,
  };
};

function cloneLaunches(list = []) {
  return list.map((item) => ({ ...item }));
}

function buildBrowseUrl(baseUrl, { limit, offset, order }) {
  const url = new URL('browse/new', ensureTrailingSlash(baseUrl));
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  if (order) {
    url.searchParams.set('order', order);
  }
  return url.toString();
}

function normalizeLaunchPayload(response) {
  if (!response) return [];
  const list = Array.isArray(response.tokens)
    ? response.tokens
    : Array.isArray(response.items)
    ? response.items
    : Array.isArray(response) ? response : [];

  return list.map((entry) => ({
    mint: entry.mintAddress || entry.mint || null,
    name: entry.name || entry.tokenName || 'Unknown',
    symbol: entry.symbol || entry.tokenSymbol || null,
    launchedAt: entry.createdAt || entry.launchDate || new Date().toISOString(),
    initialLiquidity: Number(entry.initialLiquidity || entry.liquidity || 0),
    teamSharePercent: Number(entry.teamAllocation || entry.teamShare || 0),
    rugScore: entry.rugScore != null ? Number(entry.rugScore) : null,
    creator: entry.creator || entry.owner || null,
  }));
}

function ensureTrailingSlash(url) {
  return url.endsWith('/') ? url : `${url}/`;
}
