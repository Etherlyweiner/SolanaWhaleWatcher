'use strict';

const { roundTo } = require('../util/number');

module.exports = (context) => {
  const name = 'Momentum / Breakout Trading';

  async function evaluate(inputs) {
    const dexscreener = context.services.dexscreenerProvider;
    const riskManager = context.services.riskManager;

    const [marketData, momentum] = await Promise.all([
      dexscreener.getMarketData(inputs.mint),
      dexscreener.getMomentumSignals(inputs.mint),
    ]);

    const priceUsd = marketData?.priceUsd ?? null;
    const change24h = marketData?.change24h ?? 0;
    const volume24h = marketData?.volume24h ?? 0;

    const topFive = inputs.holders.slice(0, 5);
    const totalBalance = inputs.holders.reduce((sum, holder) => sum + (holder.balance || 0), 0);
    const topFiveTotal = topFive.reduce((sum, holder) => sum + (holder.balance || 0), 0);
    const topFiveShare = totalBalance > 0 ? roundTo((topFiveTotal / totalBalance) * 100, 2) : 0;

    const signals = [];

    if (momentum?.volumeSpike) {
      signals.push({
        title: 'Volume spike detected – watch for 1h close confirmation',
        detail:
          'Dexscreener flags abnormal 24h volume. Confirm a higher low and enter on break of recent high with tight stop.',
        metrics: {
          priceUsd: priceUsd ? `$${roundTo(priceUsd, 6)}` : 'n/a',
          volume24h: `$${volume24h.toLocaleString()}`,
          change24h: `${roundTo(change24h, 1)}%`,
          breakoutProbability: `${roundTo((momentum.breakoutProbability || 0) * 100, 1)}%`,
          rsi: momentum.rsi,
        },
      });
    }

    signals.push({
      title: 'Monitor whale concentration for potential breakout fuel',
      detail:
        'Top holders control a large share of supply. Track if they add on dips; follow-through often requires at least flat whale flow.',
      metrics: {
        topFiveShare: `${topFiveShare || 0}%`,
        holdersAnalyzed: inputs.holders.length,
      },
    });

    const plan = riskManager.evaluate({
      bankroll: inputs.bankroll,
      entryPrice: priceUsd,
      strategyRisk:
        'Breakouts during congestion can reverse violently. Enter only after confirmation candle closes and keep stops within 5–8%.',
    });

    plan.notes.push('Trade 12–18 UTC to minimize Solana congestion slippage.');
    plan.notes.push('Scale out 50% at 2x, trail rest aggressively – momentum fades fast in memecoins.');

    const narrative = momentum?.volumeSpike
      ? 'Volume and RSI momentum are heating up. Prep alerts around key breakout levels and trade only on confirmation.'
      : 'Momentum signals are muted. Keep powder dry and scan Dexscreener alerts rather than forcing entries.';

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
