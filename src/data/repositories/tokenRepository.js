'use strict';

module.exports = (context) => {
  const logger = context.logger.child('repo:token');

  async function getTokenProfile({ mint }) {
    const loader = context.services.solanaLoader;
    const gmgn = context.services.gmgnProvider;
    const dexscreener = context.services.dexscreenerProvider;

    const [metadata, intel, market] = await Promise.all([
      safeCall(() => loader.getTokenMetadata(mint), 'metadata'),
      safeCall(() => gmgn.getTokenIntel(mint), 'gmgn'),
      safeCall(() => dexscreener.getMarketData(mint), 'market'),
    ]);

    const profile = {
      mint,
      symbol: metadata?.symbol || 'TKN',
      name: metadata?.name || metadata?.symbol || 'Unknown Token',
      market: market || {},
      intel: intel || {},
      riskTags: buildRiskTags(intel, market),
    };

    logger.debug('Token profile built', { mint, symbol: profile.symbol });
    return profile;
  }

  return {
    getTokenProfile,
  };
};

async function safeCall(fn, label) {
  try {
    return await fn();
  } catch (error) {
    console.warn(`TokenRepository ${label} fetch failed: ${error.message}`);
    return null;
  }
}

function buildRiskTags(intel, market) {
  const tags = [];

  if (intel?.rugCheckScore && intel.rugCheckScore > 0.7) {
    tags.push('High Rug Risk');
  }
  if (intel?.rugCheckScore && intel.rugCheckScore < 0.3) {
    tags.push('Low Rug Risk');
  }
  if (market?.volume24h && market.volume24h > 1_000_000) {
    tags.push('High Volume');
  }
  if (market?.change24h && market.change24h > 100) {
    tags.push('Parabolic Move');
  }

  return tags;
}
