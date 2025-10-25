'use strict';

const { roundTo } = require('../util/number');

module.exports = (context) => {
  const name = 'Sniper Trading';

  async function evaluate(inputs) {
    const pumpfun = context.services.pumpfunProvider;
    const gmgn = context.services.gmgnProvider;
    const riskManager = context.services.riskManager;

    const launches = (await pumpfun.getRecentLaunches({ limit: 40 })) || [];
    const intel = await gmgn.getTokenIntel(inputs.mint);
    const gmgnTrend = intel?.trendingScore ?? null;
    const gmgnRug = intel?.rugCheckScore ?? null;

    const enrichedLaunches = launches.map((launch) => {
      const ageMinutes = (Date.now() - new Date(launch.launchedAt).getTime()) / 60000;
      const liquidityScore = Math.min(1, (launch.initialLiquidity || 0) / 50000);
      const teamShare = launch.teamSharePercent != null ? launch.teamSharePercent : 50;
      const rugScore = launch.rugScore != null ? 1 - launch.rugScore : 0.5;
      const ownershipScore = 1 - Math.min(1, teamShare / 100);
      const netScore = roundTo(liquidityScore * 0.4 + ownershipScore * 0.3 + rugScore * 0.3, 3);
      return {
        ...launch,
        ageMinutes: roundTo(ageMinutes, 1),
        netScore,
      };
    });

    const candidates = enrichedLaunches
      .filter((launch) => launch.ageMinutes <= 15)
      .filter((launch) => launch.rugScore == null || launch.rugScore <= 0.4)
      .sort((a, b) => b.netScore - a.netScore)
      .slice(0, 3);

    const signals = candidates.map((launch) => ({
      title: `${launch.name} – launched ${launch.ageMinutes}m ago`,
      detail:
        'Liquidity and ownership checks look acceptable. Confirm contract renounce and liquidity lock before executing via Trojan Bot or BonkBot.',
      metrics: {
        mint: launch.mint,
        liquidityUsd: launch.initialLiquidity != null ? `$${roundTo(launch.initialLiquidity, 2).toLocaleString()}` : 'n/a',
        teamSharePercent:
          launch.teamSharePercent != null ? `${roundTo(launch.teamSharePercent, 1)}%` : 'n/a',
        rugScore:
          launch.rugScore != null ? `${roundTo(launch.rugScore * 100, 1)}%` : 'n/a',
        ageMinutes: launch.ageMinutes,
        pumpfunCreator: launch.creator || 'unknown',
      },
    }));

    const plan = riskManager.evaluate({
      bankroll: inputs.bankroll,
      entryPrice: inputs.market?.priceUsd ?? null,
      strategyRisk:
        candidates.length === 0
          ? 'No clean Pump.fun launches inside the last 15 minutes. Stay patient; forcing entries drives losses.'
          : 'Evaluate migration plans and schedule exits at 5–10x or when liquidity migrates to Raydium.',
    });

    plan.notes.push('Execute through MEV-protected wallets such as Phantom + Jito tips to avoid sandwich attacks.');
    plan.notes.push('Size entries at 1–2% bankroll and set 5–10% hard stops; bots can exit fast but discipline is on you.');

    if (intel?.rugCheckScore && intel.rugCheckScore > 0.7) {
      plan.notes.push('GMGN flags elevated rug risk on the current token – use sniper entries only if migration is verified.');
    }
    if (gmgnTrend != null) {
      plan.notes.push(`GMGN trend score at ${gmgnTrend} – recalibrate targets if momentum fades.`);
    }
    if (!launches.length) {
      plan.notes.push('Pump.fun API returned no fresh launches; monitor manually or retry shortly.');
    }

    if (!candidates.length) {
      plan.notes.push('No launch met liquidity/team-share guardrails – capital preservation mode.');
    }

    const narrative =
      candidates.length > 0
        ? `Detected ${candidates.length} promising Pump.fun listings with low rug scores. Monitor Raydium pool creation and migrate quickly.`
        : 'Waiting for credible launch conditions. Keep analytics tabs (GMGN, RugCheckers) open and alert bots armed.';

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
