'use strict';

module.exports = (context) => {
  const logger = context.logger.child('provider:gmgn');

  async function getTokenIntel(mint, options = {}) {
    try {
      const helius = context.services.heliusProvider;
      const intel = await helius.getTokenIntel(mint, {
        holderLimit: options.holderLimit || 20,
      });

      if (!intel) {
        logger.warn('Helius did not return token intel', { mint });
        return null;
      }

      const { metadata, holders = [], concentration, supply } = intel;
      const liquiditySignal = holders.slice(0, 5).reduce((acc, holder) => acc + (holder.balance || 0), 0);
      const rugCheckScore = typeof concentration === 'number' ? Number((1 - concentration).toFixed(3)) : null;
      const trendingScore = typeof concentration === 'number' ? Number(((1 - concentration) * 100).toFixed(2)) : null;

      return {
        mint,
        metadata: metadata || {},
        holders,
        supply,
        concentration,
        trendingScore,
        rugCheckScore,
        socialBuzz: deriveSocialBuzz(holders.length),
        winRateEstimate:
          typeof concentration === 'number'
            ? Number(((1 - concentration) * 0.75 + 0.25).toFixed(2))
            : null,
      };
    } catch (error) {
      logger.error('Failed to gather token intel', { error: error.message, mint });
      return null;
    }
  }

  async function getWhaleWallets(mint, options = {}) {
    try {
      const intel = await getTokenIntel(mint, options);
      if (!intel?.holders?.length) {
        return [];
      }

      const seen = new Set();

      return intel.holders
        .map((holder, index) => {
          const walletAddress = holder.wallet || holder.tokenAccount;
          if (!walletAddress) {
            return null;
          }
          if (seen.has(walletAddress)) {
            return null;
          }
          seen.add(walletAddress);
          return {
            wallet: walletAddress,
            tokenAccount: holder.tokenAccount,
            balance: holder.balance,
            rank: index + 1,
            pnlUsd: holder.balance, // Placeholder approximation; convert to USD elsewhere if needed.
            winRate: Number(Math.max(0.55, 1 - (index + 1) / (intel.holders.length * 1.8)).toFixed(2)),
          };
        })
        .filter(Boolean);
    } catch (error) {
      logger.error('Failed to derive whale wallets', { error: error.message, mint });
      return [];
    }
  }

  return {
    getTokenIntel,
    getWhaleWallets,
  };
};

function deriveSocialBuzz(holderCount) {
  if (holderCount > 5000) return 'viral';
  if (holderCount > 1000) return 'elevated';
  if (holderCount > 200) return 'growing';
  return 'early';
}
