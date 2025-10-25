'use strict';

const STRATEGY_MODULES = [
  '../../strategies/sniperStrategy',
  '../../strategies/copyTradingStrategy',
  '../../strategies/momentumStrategy',
  '../../strategies/gridStrategy',
];

module.exports = (context) => {
  const logger = context.logger.child('repo:strategy');

  const strategies = STRATEGY_MODULES.map((modulePath) => {
    const factory = require(modulePath);
    const strategy = factory(context);
    return strategy;
  });

  async function evaluateAll(inputs) {
    const results = [];

    for (const strategy of strategies) {
      try {
        const evaluation = await strategy.evaluate(inputs);
        if (evaluation) {
          results.push(evaluation);
        }
      } catch (error) {
        logger.error('Strategy evaluation failed', {
          strategy: strategy.name,
          error: error.message,
        });
      }
    }

    return results;
  }

  return {
    evaluateAll,
  };
};
