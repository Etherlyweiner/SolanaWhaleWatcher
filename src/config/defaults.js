const path = require('path');

const cacheDir = path.resolve(__dirname, '..', '..', 'data', 'cache');

const heliusRpcUrl =
  process.env.HELIUS_RPC_URL ||
  process.env.SOLANA_RPC_URL ||
  'https://mainnet.helius-rpc.com/?api-key=ad42d0ce-6fe3-4005-8c2c-2d8debc7d0f8';

const heliusRestUrl = process.env.HELIUS_REST_URL || 'https://api.helius.xyz';
const heliusApiKey = process.env.HELIUS_API_KEY || 'f26c6485-96ad-4f9b-9a8f-9d2da59a2394';
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
      maxRetries: parseInt(process.env.HELIUS_MAX_RETRIES || '3', 10),
      baseRetryMs: parseInt(process.env.HELIUS_BASE_RETRY_MS || '250', 10),
    },
    gmgn: {
      enabled: true,
      maxRetries: parseInt(process.env.GMGN_MAX_RETRIES || '2', 10),
      baseRetryMs: parseInt(process.env.GMGN_BASE_RETRY_MS || '200', 10),
    },
    dexscreener: {
      enabled: true,
      baseUrl: process.env.DEXSCREENER_BASE_URL || 'https://api.dexscreener.com/latest/dex',
      maxRetries: parseInt(process.env.DEXSCREENER_MAX_RETRIES || '2', 10),
      baseRetryMs: parseInt(process.env.DEXSCREENER_BASE_RETRY_MS || '250', 10),
    },
    nansen: {
      enabled: true,
      maxRetries: parseInt(process.env.NANSEN_MAX_RETRIES || '2', 10),
      baseRetryMs: parseInt(process.env.NANSEN_BASE_RETRY_MS || '250', 10),
      watchlist: nansenWatchlist,
    },
    pumpfun: {
      enabled: true,
      baseUrl: process.env.PUMPFUN_BASE_URL || 'https://pump.fun/api',
      maxRetries: parseInt(process.env.PUMPFUN_MAX_RETRIES || '2', 10),
      baseRetryMs: parseInt(process.env.PUMPFUN_BASE_RETRY_MS || '250', 10),
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
