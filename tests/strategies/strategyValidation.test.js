'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const createSniperStrategy = require('../../src/strategies/sniperStrategy');
const createCopyTradingStrategy = require('../../src/strategies/copyTradingStrategy');
const createMomentumStrategy = require('../../src/strategies/momentumStrategy');
const createGridStrategy = require('../../src/strategies/gridStrategy');

function createMockContext() {
  return {
    config: {},
    services: {
      pumpfunProvider: {
        getRecentLaunches: async () => [],
      },
      gmgnProvider: {
        getTokenIntel: async () => null,
        getWhaleWallets: async () => [],
      },
      nansenProvider: {
        getTopWallets: async () => [],
      },
      walletRepository: {
        getWalletActivity: async () => [],
      },
      dexscreenerProvider: {
        getMarketData: async () => ({
          priceUsd: 0.001,
          change24h: 5,
          volume24h: 1000,
        }),
        getMomentumSignals: async () => ({
          volumeSpike: false,
          breakoutProbability: 0.3,
          rsi: 50,
        }),
      },
      riskManager: {
        evaluate: (opts) => ({
          positionSizeUsd: 100,
          stopLossUsd: 92,
          takeProfitUsd: 200,
          notes: [],
        }),
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

const mockInputs = {
  mint: 'mint1',
  token: { mint: 'mint1', symbol: 'TEST' },
  holders: [],
  bankroll: 5000,
  market: { priceUsd: 0.001 },
  leaderboard: [],
};

function validateStrategyOutput(output, strategyName) {
  assert.ok(output, `${strategyName} should return output`);
  assert.ok(output.name, `${strategyName} should have name`);
  assert.ok(output.narrative, `${strategyName} should have narrative`);
  assert.ok(output.risk, `${strategyName} should have risk object`);
  assert.ok(Array.isArray(output.risk.notes), `${strategyName} risk should have notes array`);
  assert.ok(Array.isArray(output.signals), `${strategyName} should have signals array`);
}

test('Sniper strategy returns valid output structure', async () => {
  const context = createMockContext();
  const strategy = createSniperStrategy(context);
  
  const output = await strategy.evaluate(mockInputs);
  
  validateStrategyOutput(output, 'Sniper');
  assert.equal(output.name, 'Sniper Trading');
});

test('Copy Trading strategy returns valid output structure', async () => {
  const context = createMockContext();
  const strategy = createCopyTradingStrategy(context);
  
  const output = await strategy.evaluate(mockInputs);
  
  validateStrategyOutput(output, 'CopyTrading');
  assert.equal(output.name, 'Copy Trading Whale Wallets');
});

test('Momentum strategy returns valid output structure', async () => {
  const context = createMockContext();
  const strategy = createMomentumStrategy(context);
  
  const output = await strategy.evaluate(mockInputs);
  
  validateStrategyOutput(output, 'Momentum');
  assert.equal(output.name, 'Momentum / Breakout Trading');
});

test('Grid strategy returns valid output structure', async () => {
  const context = createMockContext();
  const strategy = createGridStrategy(context);
  
  const output = await strategy.evaluate(mockInputs);
  
  validateStrategyOutput(output, 'Grid');
  assert.equal(output.name, 'Automated Bot / Grid Trading');
});
