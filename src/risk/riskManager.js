'use strict';

const { roundTo } = require('../util/number');

module.exports = (context) => {
  const {
    config: {
      risk: {
        maxPositionPercent,
        stopLossPercent,
        profitTargets,
        defaultBankroll,
      },
    },
    logger,
  } = context;

  const riskLogger = logger.child('risk');

  function evaluate(plan) {
    const bankroll = plan.bankroll || defaultBankroll;
    const positionSize = roundTo(bankroll * maxPositionPercent, 2);

    const riskProfile = {
      bankroll,
      positionSize,
      maxPositionPercent,
      stopLossPercent,
      takeProfitLevels: profitTargets.map((target) => ({
        multiple: target,
        targetPrice: plan.entryPrice ? roundTo(plan.entryPrice * target, 6) : null,
      })),
      stopLossPrice: plan.entryPrice
        ? roundTo(plan.entryPrice * (1 - stopLossPercent), 6)
        : null,
      notes: [],
    };

    if (plan.positionSize && plan.positionSize > positionSize) {
      riskProfile.notes.push(
        `Planned position ${plan.positionSize} exceeds guardrail ${positionSize}. Consider reducing size.`
      );
    }

    if (plan.strategyRisk) {
      riskProfile.notes.push(plan.strategyRisk);
    }

    riskLogger.debug('Risk profile evaluated', { plan, riskProfile });
    return riskProfile;
  }

  return {
    evaluate,
  };
};
