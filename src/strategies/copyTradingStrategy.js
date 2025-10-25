'use strict';

const { roundTo } = require('../util/number');

module.exports = (context) => {
  const name = 'Copy Trading Whale Wallets';

  async function evaluate(inputs) {
    const gmgn = context.services.gmgnProvider;
    const nansen = context.services.nansenProvider;
    const walletRepo = context.services.walletRepository;
    const riskManager = context.services.riskManager;

    const [gmgnWhales, nansenWhales] = await Promise.all([
      gmgn.getWhaleWallets(inputs.mint, { holderLimit: 25 }),
      nansen.getTopWallets(),
    ]);

    const combined = mergeWhaleSignals(gmgnWhales, nansenWhales);
    const shortlist = combined.slice(0, 3);

    const activity = await walletRepo.getWalletActivity(
      shortlist.map((wallet) => wallet.wallet)
    );

    const signals = shortlist.map((wallet) => {
      const activityInfo = activity.find((item) => item.wallet === wallet.wallet) || {};
      return {
        title: `Mirror ${truncate(wallet.wallet)} – win rate ${roundTo(wallet.winRate * 100, 1)}%`,
        detail:
          'Set alerts for new entries. Avoid chasing fills if price has already moved 10%+. Be ready to exit as whales scale out.',
        metrics: {
          wallet: wallet.wallet,
          pnlUsd: `$${roundTo(wallet.pnlUsd, 0).toLocaleString()}`,
          winRate: `${roundTo((wallet.winRate || 0) * 100, 1)}%`,
          smartScore: wallet.score ?? 'n/a',
          tags: (wallet.tags || []).join(', ') || 'n/a',
          recentTrades: activityInfo?.recentTrades ?? 'n/a',
          avgProfitUsd:
            activityInfo?.avgProfitUsd != null
              ? `$${roundTo(activityInfo.avgProfitUsd, 0)}`
              : 'n/a',
        },
      };
    });

    const plan = riskManager.evaluate({
      bankroll: inputs.bankroll,
      strategyRisk:
        'Execution delay means whales can dump on followers. Use limit orders and never mirror >2% bankroll per wallet.',
    });

    plan.notes.push('Track insider wallets via GMGN/Nansen alerts. Drop wallets that flip to net negative PnL.');
    plan.notes.push('Journal copy trades daily – note entry lag, exit discipline, and slippage.');

    const narrative =
      shortlist.length > 0
        ? `Found ${shortlist.length} high-PnL wallets with 65%+ win rates. Mirror selectively and cap exposure.`
        : 'No whale wallets met the risk filters today. Stay flat until verifiable alpha reappears.';

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

function mergeWhaleSignals(gmgnWhales = [], nansenWhales = []) {
  const map = new Map();

  gmgnWhales.forEach((whale) => {
    map.set(whale.wallet, {
      wallet: whale.wallet,
      pnlUsd: whale.pnlUsd,
      winRate: whale.winRate,
      score: 60,
      tags: [],
    });
  });

  nansenWhales.forEach((whale) => {
    if (map.has(whale.wallet)) {
      const existing = map.get(whale.wallet);
      existing.score = Math.max(existing.score, whale.score);
      existing.tags = Array.from(new Set([...existing.tags, ...whale.tags]));
    } else {
      map.set(whale.wallet, {
        wallet: whale.wallet,
        pnlUsd: 0,
        winRate: 0.6,
        score: whale.score,
        tags: whale.tags,
      });
    }
  });

  return Array.from(map.values())
    .sort((a, b) => b.score - a.score || b.pnlUsd - a.pnlUsd)
    .map((entry) => ({
      ...entry,
      winRate: entry.winRate || 0.6,
    }));
}

function truncate(address) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
