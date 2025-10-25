'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const createHeliusProvider = require('../../src/data/providers/heliusProvider');

function createMockContext() {
  return {
    config: {
      providers: {
        helius: {
          rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=test',
          restUrl: 'https://api.helius.xyz',
          apiKey: 'test-key',
          cacheTtlMs: 1000,
          maxRetries: 0,
        },
      },
      cache: { ttlMs: 1000 },
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

test('Helius provider caches token intel requests', async () => {
  const context = createMockContext();
  const provider = createHeliusProvider(context);

  let rpcCallCount = 0;
  let restCallCount = 0;

  // Mock the internal RPC and REST clients
  provider.rpc = {
    getTokenSupply: async () => {
      rpcCallCount++;
      return { value: { amount: '1000000000', decimals: 9 } };
    },
  };

  provider.rest = {
    getTokenMetadata: async () => {
      restCallCount++;
      return {
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 9,
      };
    },
    getTopHolders: async () => {
      restCallCount++;
      return [];
    },
  };

  // First call
  const intel1 = await provider.getTokenIntel('mint1', { holderLimit: 20 });
  
  // Second call (should be cached)
  const intel2 = await provider.getTokenIntel('mint1', { holderLimit: 20 });

  assert.ok(intel1);
  assert.ok(intel2);
  assert.equal(intel1.mint, 'mint1');
  assert.equal(rpcCallCount, 1, 'RPC should be called once');
  assert.equal(restCallCount, 2, 'REST should be called twice (metadata + holders)');
});

test('Helius provider handles wallet activity', async () => {
  const context = createMockContext();
  const provider = createHeliusProvider(context);

  provider.rest = {
    getWalletActivity: async (wallets) => {
      return wallets.map((wallet) => ({
        wallet,
        recentTrades: 5,
        avgProfitUsd: 100,
      }));
    },
  };

  const activity = await provider.getWalletActivity(['wallet1', 'wallet2']);

  assert.equal(activity.length, 2);
  assert.equal(activity[0].wallet, 'wallet1');
  assert.equal(activity[0].recentTrades, 5);
  assert.equal(activity[1].wallet, 'wallet2');
});
