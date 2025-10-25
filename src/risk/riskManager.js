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
    const positionSize = plan.positionSize || roundTo(bankroll * maxPositionPercent, 2);
    const stopLossUsd = roundTo(positionSize * (1 - stopLossPercent), 2);
    const takeProfitTargets = profitTargets.map((target) => roundTo(positionSize * target, 2));

    const riskProfile = {
      bankroll,
      positionSizeUsd: positionSize,
      stopLossUsd,
      takeProfitUsd: takeProfitTargets[0] || roundTo(positionSize * 2, 2),
      takeProfitTargets,
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

    // Validate position size
    const maxAllowedPosition = roundTo(bankroll * 0.1, 2); // 10% is aggressive
    if (positionSize > maxAllowedPosition) {
      riskProfile.notes.push(
        `Position size exceeds recommended limit (${positionSize} > ${maxAllowedPosition}). Consider reducing size.`
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
