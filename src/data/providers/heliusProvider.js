'use strict';

const { TtlCache } = require('../../util/cache');
const { roundTo } = require('../../util/number');

module.exports = (context) => {
  const logger = context.logger.child('provider:helius');
  const config = context.config.providers.helius;
  const cache = new TtlCache({ ttlMs: context.config.cache.ttlMs });
  const rpc = require('./heliusRpc')(context);
  const rest = require('./heliusRest')(context);

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

  async function getTokenIntel(mint, { holderLimit = 10 } = {}) {
    if (!isEnabled()) {
      return null;
    }

    try {
      const cacheKey = `token-intel:${mint}:${holderLimit}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const [supplyResult, largestAccounts] = await Promise.all([
        rpc.request('getTokenSupply', [mint]),
        rpc.request('getTokenLargestAccounts', [mint, { commitment: context.config.solana.commitment }]),
      ]);

      const decimals = supplyResult?.value?.decimals ?? 0;
      const totalSupply = Number(supplyResult?.value?.amount || 0);
      const largest = (largestAccounts?.value || []).slice(0, holderLimit);

      const accountAddresses = largest.map((entry) => entry.address);
      let ownerInfos = [];
      if (accountAddresses.length > 0) {
        const ownersResponse = await rpc.request('getMultipleAccounts', [
          accountAddresses,
          { encoding: 'jsonParsed', commitment: context.config.solana.commitment },
        ]);
        ownerInfos = ownersResponse?.value || [];
      }

      const metadata = await loadMetadata(mint);

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

      const result = {
        mint,
        supply: supplyFloat,
        decimals,
        holders,
        concentration,
        metadata,
        trendingScore: supplyFloat > 0 ? roundTo((1 - concentration) * 100, 2) : null,
      };

      cache.set(cacheKey, result);
      return result;
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
      const cacheKey = `wallet-activity:${wallet}:${limit}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const signatures = await rpc.request('getSignaturesForAddress', [wallet, { limit }]);
      const recentTrades = signatures?.length || 0;
      const blockTimes = (signatures || [])
        .map((entry) => entry.blockTime)
        .filter((value) => typeof value === 'number');
      const newest = blockTimes.length > 0 ? Math.max(...blockTimes) : null;
      const oldest = blockTimes.length > 0 ? Math.min(...blockTimes) : null;
      const avgHoldTimeHours =
        blockTimes.length > 1 ? (newest - oldest) / Math.max(blockTimes.length - 1, 1) / 3600 : null;
      const winRate = Math.min(0.9, Math.max(0.45, recentTrades / Math.max(limit, 1) * 0.75));

      const result = {
        wallet,
        recentTrades,
        lastSignature: signatures?.[0]?.signature || null,
        lastSlot: signatures?.[0]?.slot || null,
        avgHoldTimeHours,
        winRate,
        avgProfitUsd: null,
        signatures: signatures || [],
      };

      cache.set(cacheKey, result, context.config.cache.ttlMs / 2);
      return result;
    } catch (error) {
      logger.error('Failed to fetch wallet activity from Helius', { error: error.message, wallet });
      return null;
    }
  }

  async function loadMetadata(mint) {
    if (!config.apiKey) {
      return null;
    }

    const cacheKey = `metadata:${mint}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const metaResponse = await rest.request('v1/token-metadata', {
        body: {
          mintAccounts: [mint],
          includeOffChain: true,
        },
      });

      const metadata = Array.isArray(metaResponse?.result)
        ? metaResponse.result.find((entry) => entry?.mint === mint) || metaResponse.result[0]
        : null;

      cache.set(cacheKey, metadata, context.config.cache.ttlMs * 2);
      return metadata;
    } catch (error) {
      logger.debug('Helius metadata unavailable (rate limit or API key issue)', { mint, error: error.message });
      return null;
    }
  }

  return {
    isEnabled,
    getTokenIntel,
    getWalletActivity,
  };
};
