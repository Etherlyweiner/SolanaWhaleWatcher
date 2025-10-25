'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const http = require('../../src/util/http');
const createDexscreenerProvider = require('../../src/data/providers/dexscreenerProvider');

function createContext(overrides = {}) {
  const cacheTtlMs = overrides.cacheTtlMs ?? 50;
  return {
    config: {
      cache: { ttlMs: cacheTtlMs },
      providers: {
        dexscreener: {
          baseUrl: 'https://example.com',
          cacheTtlMs,
          retry: { attempts: 0 },
          defaultChainId: 'solana',
          ...overrides.dexscreener,
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

test('Dexscreener provider caches identical requests', async () => {
  const response = {
    pairs: [
      {
        chainId: 'solana',
        dexId: 'raydium',
        url: 'https://dex/pair',
        pairAddress: 'pair1',
        baseToken: { address: 'mint1', symbol: 'AAA' },
        quoteToken: { address: 'usdc', symbol: 'USDC' },
        priceUsd: '0.1',
        liquidity: { usd: 1000 },
        volume: { h24: 500 },
        priceChange: { h1: 10, h24: 40 },
        txns: { h24: 120 },
      },
    ],
  };

  const originalFetch = http.fetchJson;
  const provider = createDexscreenerProvider(createContext());

  let callCount = 0;
  http.fetchJson = async () => {
    callCount += 1;
    return response;
  };

  try {
    const first = await provider.tokensByAddresses('solana', ['mint1']);
    const second = await provider.tokensByAddresses('solana', ['mint1']);
    const third = await provider.tokensByAddresses('solana', ['mint1']);

    assert.equal(first.length, 1);
    assert.equal(second.length, 1);
    assert.equal(third.length, 1);
    assert.equal(callCount, 1, 'fetchJson should be called once due to caching');
  } finally {
    http.fetchJson = originalFetch;
  }
});
