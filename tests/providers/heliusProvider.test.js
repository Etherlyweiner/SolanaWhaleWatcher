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

test('Helius provider caches token intel requests', async (t) => {
  // Skip this test - requires mocking internal RPC module
  t.skip('Provider test requires real API or complex mocking');
});

test('Helius provider handles wallet activity', async (t) => {
  // Skip this test - requires mocking internal RPC module
  t.skip('Provider test requires real API or complex mocking');
});
