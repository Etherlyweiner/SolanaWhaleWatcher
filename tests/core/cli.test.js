'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const createCli = require('../../src/core/cli');

function createContext() {
  return {
    config: {
      app: { mode: 'analyze', defaultMint: 'mint1' },
    },
    services: {},
  };
}

test('CLI renders leaderboard safely when data missing', async () => {
  const context = createContext();
  const cli = createCli({
    ...context,
    logger: {
      child() {
        return this;
      },
      info() {},
      warn() {},
      error() {},
    },
  });

  const originalAnalyze = cli.app?.analyze;

  cli.app = {
    analyze: async () => ({
      meta: { token: { symbol: 'TEST', mint: 'mint1' }, market: {} },
      holders: [],
      leaderboard: [],
      strategies: [
        {
          name: 'Strategy',
          narrative: 'Sample narrative',
          risk: {},
          signals: [],
        },
      ],
    }),
  };

  let output = '';
  const originalLog = console.log;
  console.log = (value) => {
    output += `${value}\n`;
  };

  try {
    await cli.run(['analyze', '--json']);
    assert.match(output, /Solana Whale Watcher/);
  } finally {
    console.log = originalLog;
    if (originalAnalyze) {
      cli.app.analyze = originalAnalyze;
    }
  }
});
