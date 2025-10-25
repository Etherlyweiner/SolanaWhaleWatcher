'use strict';

module.exports = function createApp(context) {
  const {
    services: { tokenRepository, walletRepository, strategyRepository },
    logger,
  } = context;

  const appLogger = logger.child('app');

  async function analyze(options = {}) {
    const mint = options.mint || context.config.app.defaultMint;
    const token = await tokenRepository.getTokenProfile({ mint });
    const holders = await walletRepository.getTopHolders({ mint, limit: 25 });

    const strategyInputs = {
      mint,
      token,
      holders,
      bankroll: options.bankroll,
      market: token.market,
    };

    const strategies = await strategyRepository.evaluateAll(strategyInputs);

    appLogger.info('Analyze completed', { mint, strategyCount: strategies.length });

    return {
      meta: {
        token,
        market: token.market,
      },
      holders,
      strategies,
    };
  }

  async function stream(options = {}) {
    const intervalMs = (options.interval || 60) * 1000;
    appLogger.info('Stream started', { intervalMs });

    // Basic polling loop
    let active = true;
    const controller = new AbortController();
    controller.signal.addEventListener('abort', () => {
      active = false;
    });

    while (active) {
      try {
        const result = await analyze(options);
        context.logger.info('Stream tick complete', {
          strategies: result.strategies.length,
        });
      } catch (error) {
        context.logger.error('Stream tick failed', { error: error.message });
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return controller;
  }

  return {
    analyze,
    stream,
  };
};
