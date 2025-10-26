'use strict';

const fs = require('fs');
const path = require('path');

module.exports = (context) => {
  const logger = context.logger.child('loader:solana');

  async function getTokenHolders(mint, limit = 25) {
    try {
      const helius = context.services.heliusProvider;
      if (helius?.isEnabled()) {
        const intel = await helius.getTokenIntel(mint, { holderLimit: limit });
        if (intel?.holders?.length) {
          return intel.holders.slice(0, limit).map((holder, index) => ({
            rank: index + 1,
            wallet: holder.wallet || holder.tokenAccount,
            balance: holder.balance ?? holder.uiAmount ?? 0,
          }));
        }
      }
      logger.debug('Helius did not return holders; using fallback', { mint });
    } catch (error) {
      // Many tokens don't have SPL holder data - this is normal
      if (error.code === -32602 || error.message?.includes('not a Token mint')) {
        logger.debug('Token has no holder data (normal for non-SPL tokens)', { mint });
      } else {
        logger.warn('Helius token holder fetch failed; using fallback', { error: error.message, mint });
      }
    }

    try {
      const fallbackFile = resolveExisting([
        path.resolve(process.cwd(), 'data', 'cache', 'holdersbalances.json'),
        path.resolve(process.cwd(), 'holdersbalances.json'),
        path.resolve(process.cwd(), 'output3.json'),
      ]);

      if (!fallbackFile) {
        logger.warn('No holder cache found; returning placeholder data');
        return buildPlaceholderHolders(limit);
      }

      const raw = await fs.promises.readFile(fallbackFile, 'utf8');
      const data = JSON.parse(raw);
      return data
        .slice(0, limit)
        .map((entry, index) => ({
          rank: index + 1,
          wallet: entry.wallet,
          balance: sanitizeBalance(entry.balance),
        }))
        .filter((entry) => entry.balance !== null);
    } catch (error) {
      logger.error('Failed to load token holders from cache', { error: error.message, mint });
      return buildPlaceholderHolders(limit);
    }
  }

  async function getWalletActivity(wallets, options = {}) {
    const helius = context.services.heliusProvider;
    if (!helius?.isEnabled()) {
      logger.warn('Helius disabled; wallet activity unavailable');
      return wallets.map((wallet) => buildDefaultActivity(wallet));
    }

    const summaries = await Promise.all(
      wallets.map(async (wallet) => {
        try {
          const activity = await helius.getWalletActivity(wallet, options);
          return activity || buildDefaultActivity(wallet);
        } catch (error) {
          logger.error('Helius wallet activity fetch failed', { wallet, error: error.message });
          return buildDefaultActivity(wallet);
        }
      })
    );

    return summaries.filter(Boolean);
  }

  async function getTokenMetadata(mint) {
    try {
      const helius = context.services.heliusProvider;
      if (helius?.isEnabled()) {
        const intel = await helius.getTokenIntel(mint, { holderLimit: 1 });
        if (intel?.metadata) {
          return {
            mint,
            symbol: intel.metadata.symbol || intel.metadata.symbols?.[0] || 'TOKEN',
            name: intel.metadata.name || intel.metadata.symbol || 'Token',
            image: intel.metadata.image || null,
          };
        }
      }
    } catch (error) {
      logger.error('Failed to obtain token metadata from Helius', { error: error.message, mint });
    }

    const defaultSymbol = mint === context.config.app.defaultMint ? 'SOL' : 'TOKEN';
    const defaultName = mint === context.config.app.defaultMint ? 'Solana' : 'Custom Token';
    return {
      mint,
      symbol: defaultSymbol,
      name: defaultName,
    };
  }

  return {
    getTokenHolders,
    getWalletActivity,
    getTokenMetadata,
  };
};

function resolveExisting(paths) {
  for (const candidate of paths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function buildPlaceholderHolders(limit) {
  return Array.from({ length: limit }, (_, index) => ({
    rank: index + 1,
    wallet: `PlaceholderWallet${index + 1}`,
    balance: Math.max(1, (limit - index) * 1000),
  }));
}

function sanitizeBalance(rawBalance) {
  const numeric = Number(rawBalance);
  if (Number.isNaN(numeric)) {
    return null;
  }
  return numeric / 1e6;
}

function buildDefaultActivity(wallet) {
  return {
    wallet,
    recentTrades: 0,
    lastSignature: null,
    lastSlot: null,
    avgHoldTimeHours: null,
    winRate: 0,
    avgProfitUsd: null,
    signatures: [],
  };
}
