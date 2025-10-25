'use strict';

const fs = require('fs/promises');
const path = require('path');

const journal = require('../util/journal');

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

    const priorSnapshot = await loadPreviousSnapshot(context, mint);
    const leaderboard = computeLeaderboard(holders, priorSnapshot?.holders || []);

    const strategyInputs = {
      mint,
      token,
      holders,
      bankroll: options.bankroll,
      market: token.market,
      leaderboard,
    };

    const strategies = await strategyRepository.evaluateAll(strategyInputs);

    const result = {
      meta: {
        token,
        market: token.market,
      },
      holders,
      leaderboard,
      strategies,
    };

    await writeJournalEntry(context, { mint, result });

    appLogger.info('Analyze completed', { mint, strategyCount: strategies.length });

    return result;
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

async function loadPreviousSnapshot(context, mint) {
  const snapshotPath = path.join(context.config.cache.dir, 'holders', `${mint}.json`);

  try {
    const contents = await fs.readFile(snapshotPath, 'utf8');
    return JSON.parse(contents);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      context.logger.debug('Failed to read previous snapshot', { mint, error: error.message });
    }
    return null;
  }
}

function computeLeaderboard(current = [], previous = []) {
  const previousIndex = new Map(previous.map((holder, index) => [holder.wallet || holder.tokenAccount, { holder, index }]));

  return current.map((holder, index) => {
    const key = holder.wallet || holder.tokenAccount;
    const prior = key ? previousIndex.get(key) : null;
    const previousRank = prior ? prior.index + 1 : null;
    const balanceDelta = prior ? Number(holder.balance || 0) - Number(prior.holder.balance || 0) : null;

    return {
      wallet: holder.wallet || holder.tokenAccount,
      tokenAccount: holder.tokenAccount,
      rank: index + 1,
      previousRank,
      balance: holder.balance,
      balanceDelta,
    };
  });
}

async function writeJournalEntry(context, { mint, result }) {
  if (!context.config.reporting?.enabled || !context.config.reporting?.journalFile) {
    return;
  }

  try {
    await journal.append(context, {
      mint,
      meta: result.meta,
      strategies: result.strategies,
      leaderboard: result.leaderboard.slice(0, 10),
    });
  } catch (error) {
    context.logger.warn('Failed to append journal entry', { mint, error: error.message });
  }
}
