'use strict';

const { roundTo } = require('../util/number');

module.exports = (context) => {
  const name = 'Automated Bot / Grid Trading';

  async function evaluate(inputs) {
    const dexscreener = context.services.dexscreenerProvider;
    const riskManager = context.services.riskManager;

    const marketData = await dexscreener.getMarketData(inputs.mint);
    const priceUsd = marketData?.priceUsd ?? 0;
    const volatility = estimateVolatility(marketData);

    const grid = buildGrid(priceUsd, volatility);

    const plan = riskManager.evaluate({
      bankroll: inputs.bankroll,
      entryPrice: priceUsd,
      strategyRisk:
        'Grid bots perform best in ranging markets. Disable during parabolic trends or when liquidity dries up to avoid cascading stops.',
      positionSize: grid.capitalAllocation,
    });

    plan.notes.push('Factor in bot fees (Sniperoo/Trojan/JitoXAi) and smart contract risk. Start with paper trading if available.');
    plan.notes.push('Keep capital locked in grid below 20% of bankroll to stay nimble for sniper setups.');

    const signals = [
      {
        title: 'Proposed grid parameters',
        detail:
          'Deploy grid with conservative spacing. Monitor slippage during Solana congestion and adjust width if volatility expands.',
        metrics: {
          entries: grid.levelCount,
          lowerBound: `$${roundTo(grid.lowerBound, 6)}`,
          upperBound: `$${roundTo(grid.upperBound, 6)}`,
          stepPercent: `${roundTo(grid.stepPercent * 100, 2)}%`,
          capitalAllocation: `$${roundTo(grid.capitalAllocation, 2)}`,
        },
      },
      {
        title: 'Risk health check',
        detail: 'Use MEV-protected wallets and stop bot if drawdown exceeds 10%.',
        metrics: {
          volatilityScore: roundTo(volatility, 2),
          dailyVolume: `$${(marketData?.volume24h || 0).toLocaleString()}`,
        },
      },
    ];

    const narrative =
      volatility > 0.15
        ? 'Volatility is moderately high. Widen grid spacing and shorten execution horizon to 1–2 days.'
        : 'Ranging conditions detected. Deploy a conservative grid and harvest 10–20% APY target.';

    return {
      name,
      narrative,
      risk: plan,
      signals,
    };
  }

  return {
    name,
    evaluate,
  };
};

function estimateVolatility(marketData) {
  if (!marketData) return 0.1;
  const change24h = Math.abs(marketData.change24h || 0) / 100;
  const proxy = Math.min(0.5, Math.max(0.05, change24h / 2));
  return proxy;
}

function buildGrid(priceUsd, volatility) {
  const stepPercent = Math.max(0.01, volatility * 0.6);
  const levelCount = 8;
  const rangePercent = stepPercent * levelCount;
  const lowerBound = priceUsd * (1 - rangePercent / 2);
  const upperBound = priceUsd * (1 + rangePercent / 2);
  const capitalAllocation = Math.max(100, priceUsd * levelCount * 1.5);

  return {
    stepPercent,
    levelCount,
    lowerBound,
    upperBound,
    capitalAllocation,
  };
}
