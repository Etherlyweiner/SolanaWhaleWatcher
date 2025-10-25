'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const createApp = require('../../src/core/app');
const journal = require('../../src/util/journal');

function createLogger() {
  return {
    child() {
      return this;
    },
    info() {},
    warn() {},
    error() {},
    debug() {},
  };
}

test('analyze returns leaderboard deltas and writes journal entry', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sww-test-'));
  const cacheDir = path.join(tmpDir, 'cache');
  const holdersDir = path.join(cacheDir, 'holders');
  await fs.mkdir(holdersDir, { recursive: true });

  const previousSnapshot = {
    mint: 'mint1',
    holders: [
      { wallet: 'wallet1', tokenAccount: 'tokenAccount1', balance: 100 },
    ],
  };
  await fs.writeFile(path.join(holdersDir, 'mint1.json'), JSON.stringify(previousSnapshot, null, 2));

  const context = {
    config: {
      app: { defaultMint: 'mint1' },
      cache: { dir: cacheDir, ttlMs: 1000 },
      reporting: {
        enabled: true,
        journalFile: path.join(tmpDir, 'reports', 'journal.json'),
      },
    },
    services: {
      tokenRepository: {
        async getTokenProfile() {
          return { mint: 'mint1', symbol: 'MINT', market: { priceUsd: 0.25 } };
        },
      },
      walletRepository: {
        async getTopHolders() {
          return [
            { wallet: 'wallet1', tokenAccount: 'tokenAccount1', balance: 150 },
            { wallet: 'wallet2', tokenAccount: 'tokenAccount2', balance: 50 },
          ];
        },
      },
      strategyRepository: {
        async evaluateAll() {
          return [
            {
              name: 'Strategy A',
              narrative: 'Test narrative',
              risk: { notes: ['note'] },
              signals: [],
            },
          ];
        },
      },
    },
    logger: createLogger(),
  };

  const app = createApp(context);

  const appendCalls = [];
  const originalAppend = journal.append;
  journal.append = async (_ctx, entry) => {
    appendCalls.push(entry);
  };

  try {
    const result = await app.analyze({ mint: 'mint1' });

    assert.ok(Array.isArray(result.leaderboard));
    assert.equal(result.leaderboard.length, 2);

    const first = result.leaderboard[0];
    assert.equal(first.wallet, 'wallet1');
    assert.equal(first.previousRank, 1);
    assert.equal(first.balanceDelta, 50);

    const second = result.leaderboard[1];
    assert.equal(second.wallet, 'wallet2');
    assert.equal(second.previousRank, null);

    assert.equal(appendCalls.length, 1, 'journal append should be called once');
    assert.equal(appendCalls[0].mint, 'mint1');
    assert.equal(appendCalls[0].leaderboard.length, 2);
  } finally {
    journal.append = originalAppend;
  }
});
