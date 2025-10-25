const path = require('path');

const cacheDir = path.resolve(__dirname, '..', '..', 'data', 'cache');

const heliusRpcUrl = process.env.HELIUS_RPC_URL || process.env.SOLANA_RPC_URL || null;

const heliusRestUrl = process.env.HELIUS_REST_URL || 'https://api.helius.xyz';
const heliusApiKey = process.env.HELIUS_API_KEY || null;
const nansenWatchlist = parseCsv(process.env.NANSEN_WATCHLIST);

module.exports = {
  app: {
    name: 'Solana Whale Watcher 2.0',
    mode: process.env.APP_MODE || 'analyze',
    defaultMint: process.env.DEFAULT_TOKEN_MINT || 'So11111111111111111111111111111111111111112',
  },
  solana: {
    network: process.env.SOLANA_NETWORK || 'mainnet-beta',
    rpcUrl: heliusRpcUrl,
    commitment: process.env.SOLANA_COMMITMENT || 'confirmed',
  },
  providers: {
    helius: {
      enabled: !!heliusRpcUrl,
      rpcUrl: heliusRpcUrl,
      restUrl: heliusRestUrl,
      apiKey: heliusApiKey,
      ...buildRetryConfig('HELIUS', { retries: 3, baseDelayMs: 250 }),
    },
    gmgn: {
      enabled: true,
      ...buildRetryConfig('GMGN', { retries: 2, baseDelayMs: 200 }),
    },
    dexscreener: {
      enabled: true,
      baseUrl: process.env.DEXSCREENER_BASE_URL || 'https://api.dexscreener.com',
      defaultChainId: process.env.DEXSCREENER_CHAIN_ID || 'solana',
      cacheTtlMs: parseInt(process.env.DEXSCREENER_CACHE_TTL_MS || '15000', 10),
      retry: {
        attempts: parseInt(process.env.DEXSCREENER_RETRY_ATTEMPTS || '3', 10),
        baseDelayMs: parseInt(process.env.DEXSCREENER_RETRY_BASE_DELAY_MS || '250', 10),
        jitterMs: parseInt(process.env.DEXSCREENER_RETRY_JITTER_MS || '300', 10),
      },
    },
    nansen: {
      enabled: true,
      ...buildRetryConfig('NANSEN', { retries: 2, baseDelayMs: 250 }),
      watchlist: nansenWatchlist,
    },
    pumpfun: {
      enabled: true,
      baseUrl: process.env.PUMPFUN_BASE_URL || 'https://pump.fun/api',
      ...buildRetryConfig('PUMPFUN', { retries: 2, baseDelayMs: 250 }),
    },
  },
  risk: {
    maxPositionPercent: parseFloat(process.env.MAX_POSITION_PERCENT || '0.02'),
    stopLossPercent: parseFloat(process.env.STOP_LOSS_PERCENT || '0.08'),
    takePartialPercent: parseFloat(process.env.TAKE_PARTIAL_PERCENT || '1.0'),
    profitTargets: [2, 5, 10],
    defaultBankroll: parseFloat(process.env.DEFAULT_BANKROLL || '5000'),
  },
  cache: {
    dir: cacheDir,
    ttlMs: 5 * 60 * 1000,
  },
  reporting: {
    enabled: process.env.REPORTING_ENABLED !== 'false',
    journalFile: path.resolve(__dirname, '..', '..', 'reports', 'journal.json'),
    exportDir: path.resolve(__dirname, '..', '..', 'reports'),
  },
};

function parseCsv(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildRetryConfig(prefix, defaults = {}) {
  const retriesEnv = process.env[`${prefix}_MAX_RETRIES`];
  const baseDelayEnv = process.env[`${prefix}_BASE_RETRY_MS`];

  const retries = retriesEnv != null ? Number.parseInt(retriesEnv, 10) : defaults.retries;
  const baseDelayMs = baseDelayEnv != null ? Number.parseInt(baseDelayEnv, 10) : defaults.baseDelayMs;

  return {
    maxRetries: Number.isFinite(retries) ? retries : defaults.retries ?? 0,
    baseRetryMs: Number.isFinite(baseDelayMs) ? baseDelayMs : defaults.baseDelayMs ?? 0,
  };
}
