'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const createRiskManager = require('../../src/risk/riskManager');

function createMockContext(overrides = {}) {
  return {
    config: {
      risk: {
        maxPositionPercent: 0.02,
        stopLossPercent: 0.08,
        takePartialPercent: 1.0,
        profitTargets: [2, 5, 10],
        defaultBankroll: 5000,
        ...overrides,
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

test('Risk manager calculates position size correctly', () => {
  const context = createMockContext();
  const riskManager = createRiskManager(context);

  const plan = riskManager.evaluate({
    bankroll: 10000,
    entryPrice: 1.0,
  });

  const expectedPosition = 10000 * 0.02; // 2% of bankroll
  assert.equal(plan.positionSizeUsd, expectedPosition);
});

test('Risk manager applies custom position size when provided', () => {
  const context = createMockContext();
  const riskManager = createRiskManager(context);

  const plan = riskManager.evaluate({
    bankroll: 10000,
    entryPrice: 1.0,
    positionSize: 500,
  });

  assert.equal(plan.positionSizeUsd, 500);
});

test('Risk manager calculates stop loss correctly', () => {
  const context = createMockContext();
  const riskManager = createRiskManager(context);

  const plan = riskManager.evaluate({
    bankroll: 10000,
    entryPrice: 1.0,
  });

  const positionSize = 10000 * 0.02;
  const expectedStopLoss = positionSize * (1 - 0.08);
  
  assert.equal(Math.round(plan.stopLossUsd), Math.round(expectedStopLoss));
});

test('Risk manager calculates profit targets correctly', () => {
  const context = createMockContext();
  const riskManager = createRiskManager(context);

  const plan = riskManager.evaluate({
    bankroll: 10000,
    entryPrice: 1.0,
  });

  assert.ok(Array.isArray(plan.takeProfitTargets));
  assert.equal(plan.takeProfitTargets.length, 3);
  
  const positionSize = 10000 * 0.02;
  assert.equal(plan.takeProfitTargets[0], positionSize * 2); // 2x
  assert.equal(plan.takeProfitTargets[1], positionSize * 5); // 5x
  assert.equal(plan.takeProfitTargets[2], positionSize * 10); // 10x
});

test('Risk manager handles missing bankroll with default', () => {
  const context = createMockContext();
  const riskManager = createRiskManager(context);

  const plan = riskManager.evaluate({
    entryPrice: 1.0,
  });

  const expectedPosition = 5000 * 0.02; // default bankroll
  assert.equal(plan.positionSizeUsd, expectedPosition);
});

test('Risk manager includes strategy risk in notes when provided', () => {
  const context = createMockContext();
  const riskManager = createRiskManager(context);

  const strategyRisk = 'High volatility expected';
  const plan = riskManager.evaluate({
    bankroll: 10000,
    entryPrice: 1.0,
    strategyRisk,
  });

  assert.ok(plan.notes.includes(strategyRisk));
});

test('Risk manager validates reasonable position sizes', () => {
  const context = createMockContext({ maxPositionPercent: 0.5 }); // 50% - unreasonably high
  const riskManager = createRiskManager(context);

  const plan = riskManager.evaluate({
    bankroll: 10000,
    entryPrice: 1.0,
  });

  assert.ok(plan.notes.some((note) => note.includes('Position size exceeds recommended limit')));
});
