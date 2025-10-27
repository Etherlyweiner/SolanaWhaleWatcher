'use strict';

const fs = require('fs');
const path = require('path');

const defaults = require('../config/defaults');
const createLogger = require('../util/logger');

module.exports = async function createContext() {
  ensureDirectories();

  const logger = createLogger('core');

  const context = {
    config: defaults,
    logger,
    services: {},
  };

  // Lazy-load services to avoid circular dependencies.
  registerLazyService(context, 'riskManager', '../risk/riskManager');
  registerLazyService(context, 'tokenRepository', '../data/repositories/tokenRepository');
  registerLazyService(context, 'walletRepository', '../data/repositories/walletRepository');
  registerLazyService(context, 'strategyRepository', '../data/repositories/strategyRepository');
  registerLazyService(context, 'solanaLoader', '../data/loaders/solanaLoader');
  registerLazyService(context, 'heliusProvider', '../data/providers/heliusProvider');

  registerLazyService(context, 'gmgnProvider', '../data/providers/gmgnProvider');
  registerLazyService(context, 'dexscreenerProvider', '../data/providers/dexscreenerProvider');
  registerLazyService(context, 'dexscreenerProviderEnhanced', '../data/providers/dexscreenerProviderEnhanced');
  registerLazyService(context, 'nansenProvider', '../data/providers/nansenProvider');
  registerLazyService(context, 'pumpfunProvider', '../data/providers/pumpfunProvider');

  return context;
};

function registerLazyService(context, name, modulePath) {
  Object.defineProperty(context.services, name, {
    configurable: true,
    enumerable: true,
    get() {
      delete context.services[name];
      const factory = require(modulePath);
      const instance = typeof factory === 'function' ? factory(context) : factory;
      context.services[name] = instance;
      return instance;
    },
  });
}

function ensureDirectories() {
  const dirs = [
    path.resolve(__dirname, '..', '..', 'data', 'cache'),
    path.resolve(__dirname, '..', '..', 'reports'),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}
