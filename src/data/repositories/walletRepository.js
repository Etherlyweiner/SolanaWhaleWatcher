'use strict';

module.exports = (context) => {
  const logger = context.logger.child('repo:wallet');

  async function getTopHolders({ mint, limit = 25 }) {
    try {
      const holders = await context.services.solanaLoader.getTokenHolders(mint, limit);
      return holders;
    } catch (error) {
      logger.error('Failed to fetch top holders', { error: error.message, mint });
      throw error;
    }
  }

  async function getWalletActivity(wallets, options = {}) {
    return context.services.solanaLoader.getWalletActivity(wallets, options);
  }

  return {
    getTopHolders,
    getWalletActivity,
  };
};
