'use strict';

module.exports = (context) => {
  const logger = context.logger.child('provider:nansen');
  const config = context.config.providers.nansen;

  function ensureHelius() {
    const helius = context.services.heliusProvider;
    if (!helius?.isEnabled()) {
      logger.warn('Helius provider disabled; Nansen emulation unavailable.');
      return null;
    }
    return helius;
  }

  async function getTopWallets(options = {}) {
    const helius = ensureHelius();
    if (!helius) {
      return [];
    }

    const watchlist = options.watchlist || config.watchlist || [];
    if (!Array.isArray(watchlist) || watchlist.length === 0) {
      logger.warn('Nansen watchlist empty; configure NANSEN_WATCHLIST to enable copy trading signals.');
      return [];
    }

    const limit = options.limit || 100;
    const walletSummaries = await Promise.all(
      watchlist.map(async (wallet) => {
        try {
          const activity = await helius.getWalletActivity(wallet, { limit });
          if (!activity) {
            return null;
          }
          const score = computeSmartScore(activity);
          const tags = deriveTags(activity);
          return {
            wallet,
            score,
            tags,
            activity,
          };
        } catch (error) {
          logger.error('Failed to gather wallet activity for watchlist wallet', { wallet, error: error.message });
          return null;
        }
      })
    );

    return walletSummaries
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .map((entry) => ({
        wallet: entry.wallet,
        score: entry.score,
        tags: entry.tags,
        recentTrades: entry.activity.recentTrades,
        winRate: entry.activity.winRate,
        avgHoldTimeHours: entry.activity.avgHoldTimeHours,
      }));
  }

  async function getWalletInsights(wallet, options = {}) {
    const helius = ensureHelius();
    if (!helius) {
      return null;
    }

    try {
      const activity = await helius.getWalletActivity(wallet, { limit: options.limit || 100 });
      if (!activity) {
        return null;
      }

      return {
        wallet,
        pnl30d: estimatePnl(activity),
        winRate: activity.winRate,
        avgHoldTimeHours: activity.avgHoldTimeHours,
        recentTrades: activity.recentTrades,
        tags: deriveTags(activity),
      };
    } catch (error) {
      logger.error('Failed to gather wallet insights', { wallet, error: error.message });
      return null;
    }
  }

  return {
    getTopWallets,
    getWalletInsights,
  };
};

function computeSmartScore(activity) {
  const tradeFactor = Math.min(1, (activity.recentTrades || 0) / 50);
  const winRate = activity.winRate || 0.5;
  const holdFactor = activity.avgHoldTimeHours != null ? Math.min(1, activity.avgHoldTimeHours / 12) : 0.5;
  return Math.round((0.5 * winRate + 0.3 * tradeFactor + 0.2 * holdFactor) * 100);
}

function deriveTags(activity) {
  const tags = [];
  if ((activity.recentTrades || 0) > 25) tags.push('High Frequency');
  if ((activity.winRate || 0) > 0.65) tags.push('Smart Money');
  if ((activity.avgHoldTimeHours || 0) < 2) tags.push('Sniper');
  if (activity.avgHoldTimeHours && activity.avgHoldTimeHours > 24) tags.push('Swing Trader');
  return tags.length ? tags : ['Emerging'];
}

function estimatePnl(activity) {
  const base = (activity.recentTrades || 0) * 150;
  const modifier = ((activity.winRate || 0.5) - 0.5) * 1000;
  return Math.round(base + modifier);
}
