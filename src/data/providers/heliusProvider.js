'use strict';

const { fetchJson } = require('../../util/http');

module.exports = (context) => {
  const logger = context.logger.child('provider:helius');
  const config = context.config.providers.helius;

  function isEnabled() {
    if (!config?.rpcUrl) {
      logger.warn('Helius RPC URL missing; provider disabled.');
      return false;
    }
    if (!config.apiKey) {
      logger.warn('Helius API key missing; REST endpoints disabled.');
    }
    return true;
  }

  async function rpcRequest(method, params = []) {
    if (!config?.rpcUrl) {
      throw new Error('Helius RPC URL not configured');
    }

    const body = {
      jsonrpc: '2.0',
      id: `helius-${method}`,
      method,
      params,
    };

    const response = await fetchJson(
      config.rpcUrl,
      {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      {
        retries: config.maxRetries,
        baseDelayMs: config.baseRetryMs,
      }
    );

    if (response?.error) {
      const error = new Error(response.error.message || 'Helius RPC error');
      error.code = response.error.code;
      throw error;
    }

    return response?.result;
  }

  async function restRequest(path, { method = 'POST', body = {} } = {}) {
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
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
      },
      {
        retries: config.maxRetries,
        baseDelayMs: config.baseRetryMs,
      }
    );
  }

  async function getTokenIntel(mint, { holderLimit = 10 } = {}) {
    if (!isEnabled()) {
      return null;
    }

    try {
      const [supplyResult, largestAccounts] = await Promise.all([
        rpcRequest('getTokenSupply', [mint]),
        rpcRequest('getTokenLargestAccounts', [mint, { commitment: context.config.solana.commitment }]),
      ]);

      const decimals = supplyResult?.value?.decimals ?? 0;
      const totalSupply = Number(supplyResult?.value?.amount || 0);
      const largest = (largestAccounts?.value || []).slice(0, holderLimit);

      const accountAddresses = largest.map((entry) => entry.address);
      let ownerInfos = [];
      if (accountAddresses.length > 0) {
        const ownersResponse = await rpcRequest('getMultipleAccounts', [
          accountAddresses,
          { encoding: 'jsonParsed', commitment: context.config.solana.commitment },
        ]);
        ownerInfos = ownersResponse?.value || [];
      }

      let metadata = null;
      if (config.apiKey) {
        try {
          const metaResponse = await restRequest('v1/token-metadata', {
            body: {
              mintAccounts: [mint],
              includeOffChain: true,
            },
          });

          metadata = Array.isArray(metaResponse?.result)
            ? metaResponse.result.find((entry) => entry?.mint === mint) || metaResponse.result[0]
            : null;
        } catch (error) {
          logger.warn('Helius metadata lookup failed', { mint, error: error.message });
        }
      }

      const holders = largest.map((entry, index) => {
        const rawBalance = Number(entry.amount || '0');
        const balance = decimals > 0 ? rawBalance / 10 ** decimals : rawBalance;
        const owner = ownerInfos[index]?.data?.parsed?.info?.owner || null;
        return {
          wallet: owner,
          tokenAccount: entry.address,
          balance,
          uiAmount: entry.uiAmount,
        };
      });

      const top5Total = holders
        .slice(0, 5)
        .reduce((sum, holder) => sum + (holder.balance || 0), 0);
      const supplyFloat = decimals > 0 ? totalSupply / 10 ** decimals : totalSupply;
      const concentration = supplyFloat > 0 ? top5Total / supplyFloat : 0;

      return {
        mint,
        supply: supplyFloat,
        decimals,
        holders,
        concentration,
        metadata,
        trendingScore: supplyFloat > 0 ? roundTo((1 - concentration) * 100, 2) : null,
      };
    } catch (error) {
      logger.error('Failed to fetch token intel from Helius', { error: error.message, mint });
      return null;
    }
  }

  async function getWalletActivity(wallet, { limit = 20 } = {}) {
    if (!isEnabled()) {
      return null;
    }

    try {
      const signatures = await rpcRequest('getSignaturesForAddress', [wallet, { limit }]);
      const recentTrades = signatures?.length || 0;
      const blockTimes = (signatures || [])
        .map((entry) => entry.blockTime)
        .filter((value) => typeof value === 'number');
      const newest = blockTimes.length > 0 ? Math.max(...blockTimes) : null;
      const oldest = blockTimes.length > 0 ? Math.min(...blockTimes) : null;
      const avgHoldTimeHours =
        blockTimes.length > 1 ? (newest - oldest) / Math.max(blockTimes.length - 1, 1) / 3600 : null;
      const winRate = Math.min(0.9, Math.max(0.45, recentTrades / Math.max(limit, 1) * 0.75));

      return {
        wallet,
        recentTrades,
        lastSignature: signatures?.[0]?.signature || null,
        lastSlot: signatures?.[0]?.slot || null,
        avgHoldTimeHours,
        winRate,
        avgProfitUsd: null,
        signatures: signatures || [],
      };
    } catch (error) {
      logger.error('Failed to fetch wallet activity from Helius', { error: error.message, wallet });
      return null;
    }
  }

  return {
    isEnabled,
    getTokenIntel,
    getWalletActivity,
  };
};

function ensureTrailingSlash(url) {
  if (!url.endsWith('/')) {
    return `${url}/`;
  }
  return url;
}

function roundTo(value, decimals = 2) {
  if (value === null || value === undefined) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
