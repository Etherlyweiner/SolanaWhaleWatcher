'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const createApp = require('../../src/core/app');

async function createTestContext() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sww-integration-'));
  
  return {
    config: {
      app: { defaultMint: 'mint1' },
      cache: { dir: path.join(tmpDir, 'cache'), ttlMs: 1000 },
      reporting: {
        enabled: false, // Disable to avoid file system writes in test
        journalFile: path.join(tmpDir, 'reports', 'journal.json'),
        exportDir: path.join(tmpDir, 'reports'),
      },
    },
    services: {
      tokenRepository: {
        async getTokenProfile({ mint }) {
          return {
            mint,
            symbol: 'TEST',
            name: 'Test Token',
            market: { priceUsd: 0.001, volume24h: 10000 },
          };
        },
      },
      walletRepository: {
        async getTopHolders({ mint, limit }) {
          return [
            { wallet: 'wallet1', tokenAccount: 'token1', balance: 1000 },
            { wallet: 'wallet2', tokenAccount: 'token2', balance: 500 },
            { wallet: 'wallet3', tokenAccount: 'token3', balance: 250 },
          ];
        },
      },
      strategyRepository: {
        async evaluateAll(inputs) {
          assert.ok(inputs.mint, 'Strategy inputs should have mint');
          assert.ok(inputs.token, 'Strategy inputs should have token');
          assert.ok(Array.isArray(inputs.holders), 'Strategy inputs should have holders');
          assert.ok(Array.isArray(inputs.leaderboard), 'Strategy inputs should have leaderboard');
          
          return [
            {
              name: 'Test Strategy',
              narrative: 'Integration test strategy',
              risk: {
                positionSizeUsd: 100,
                stopLossUsd: 92,
                takeProfitUsd: 200,
                notes: ['Test note'],
              },
              signals: [
                {
                  title: 'Test signal',
                  detail: 'Test detail',
                  metrics: { test: 'value' },
                },
              ],
            },
          ];
        },
      },
    },
    logger: {
      child() {
        return this;
      },
      info() {},
      warn() {},
      error() {},
      debug() {},
    },
  };
}

test('Full analyze pipeline executes successfully', async () => {
  const context = await createTestContext();
  const app = createApp(context);

  const result = await app.analyze({ mint: 'mint1', bankroll: 5000 });

  // Validate result structure
  assert.ok(result, 'Result should be returned');
  assert.ok(result.meta, 'Result should have meta');
  assert.ok(result.meta.token, 'Meta should have token');
  assert.equal(result.meta.token.mint, 'mint1');
  
  assert.ok(Array.isArray(result.holders), 'Result should have holders array');
  assert.equal(result.holders.length, 3);
  
  assert.ok(Array.isArray(result.leaderboard), 'Result should have leaderboard array');
  assert.equal(result.leaderboard.length, 3);
  
  // Validate leaderboard structure
  const firstEntry = result.leaderboard[0];
  assert.ok(firstEntry.wallet, 'Leaderboard entry should have wallet');
  assert.equal(firstEntry.rank, 1, 'First entry should have rank 1');
  assert.ok(typeof firstEntry.balance === 'number', 'Balance should be a number');
  
  assert.ok(Array.isArray(result.strategies), 'Result should have strategies array');
  assert.equal(result.strategies.length, 1);
  
  // Validate strategy output
  const strategy = result.strategies[0];
  assert.equal(strategy.name, 'Test Strategy');
  assert.ok(strategy.narrative, 'Strategy should have narrative');
  assert.ok(strategy.risk, 'Strategy should have risk');
  assert.ok(Array.isArray(strategy.signals), 'Strategy should have signals');
});

test('Analyze computes leaderboard deltas correctly', async () => {
  const context = await createTestContext();
  
  // Create a previous snapshot
  const holdersDir = path.join(context.config.cache.dir, 'holders');
  await fs.mkdir(holdersDir, { recursive: true });
  
  const previousSnapshot = {
    mint: 'mint1',
    ts: new Date(Date.now() - 60000).toISOString(),
    holders: [
      { wallet: 'wallet1', tokenAccount: 'token1', balance: 900 }, // Was lower
      { wallet: 'wallet2', tokenAccount: 'token2', balance: 500 }, // Same
      // wallet3 is new
    ],
  };
  
  await fs.writeFile(
    path.join(holdersDir, 'mint1.json'),
    JSON.stringify(previousSnapshot, null, 2)
  );
  
  const app = createApp(context);
  const result = await app.analyze({ mint: 'mint1' });
  
  // Validate deltas
  const wallet1 = result.leaderboard.find((entry) => entry.wallet === 'wallet1');
  assert.ok(wallet1, 'wallet1 should be in leaderboard');
  assert.equal(wallet1.previousRank, 1, 'wallet1 should have previous rank 1');
  assert.equal(wallet1.balanceDelta, 100, 'wallet1 should have delta of +100');
  
  const wallet3 = result.leaderboard.find((entry) => entry.wallet === 'wallet3');
  assert.ok(wallet3, 'wallet3 should be in leaderboard');
  assert.equal(wallet3.previousRank, null, 'wallet3 should be new (no previous rank)');
  assert.equal(wallet3.balanceDelta, null, 'wallet3 should have no delta (new holder)');
});
