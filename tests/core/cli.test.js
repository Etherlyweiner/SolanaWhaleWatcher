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
  const mockContext = {
    config: {
      app: { mode: 'analyze', defaultMint: 'mint1' },
      cache: { dir: 'data/cache' },
      reporting: { enabled: false },
    },
    services: {
      tokenRepository: {
        getTokenProfile: async () => ({
          mint: 'mint1',
          symbol: 'TEST',
          market: { priceUsd: 0.001 },
        }),
      },
      walletRepository: {
        getTopHolders: async () => [],
      },
      strategyRepository: {
        evaluateAll: async () => [
          {
            name: 'Strategy',
            narrative: 'Sample narrative',
            risk: { notes: [] },
            signals: [],
          },
        ],
      },
    },
    logger: {
      child() {
        return this;
      },
      info() {},
      warn() {},
      error() {},
    },
  };

  const cli = createCli(mockContext);

  let output = '';
  const originalLog = console.log;
  console.log = (value) => {
    output += `${value}\n`;
  };

  try {
    await cli.run(['analyze', '--mint=mint1']);
    assert.ok(output.includes('Solana Whale Watcher') || output.includes('TEST'));
  } finally {
    console.log = originalLog;
  }
});
