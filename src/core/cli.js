'use strict';

const createApp = require('./app');
const createLogger = require('../util/logger');

module.exports = function createCli(context) {
  const logger = createLogger('cli');
  const app = createApp(context);

  async function run(argv) {
    const command = argv[0] || context.config.app.mode;

    switch (command) {
      case 'analyze':
        await handleAnalyze(argv.slice(1));
        break;
      case 'stream':
        await handleStream(argv.slice(1));
        break;
      case 'backtest':
        await handleBacktest(argv.slice(1));
        break;
      case 'scan':
        await handleScan(argv.slice(1));
        break;
      case 'scan_unified':
        await handleScanUnified(argv.slice(1));
        break;
      case 'validate':
        await handleValidate(argv.slice(1));
        break;
      case 'quickstart':
        await handleQuickstart(argv.slice(1));
        break;
      case 'help':
      default:
        printHelp();
    }
  }

  async function handleAnalyze(args) {
    const options = parseOptions(args);
    const result = await app.analyze(options);
    renderResult(result, options);
  }

  async function handleStream(args) {
    const options = parseOptions(args);
    logger.info('Stream mode requested. Using analyze loop with interval.', options);
    const interval = options.interval || 60;
    await app.stream({ ...options, interval });
  }

  async function handleBacktest(args) {
    const options = parseOptions(args);
    logger.info('Backtest mode currently reuses analyze implementation.', options);
    const result = await app.analyze({ ...options, backtest: true });
    renderResult(result, options);
  }

  async function handleScan(args) {
    const options = parseOptions(args);
    const TokenScanner = require('./scanner');
    const { createDiscordNotifier } = require('../integrations/discord');
    
    const scanner = new TokenScanner(context);
    const discord = createDiscordNotifier();
    
    const intervalSeconds = options.interval || 60;
    logger.info('Starting autonomous token scanner', { intervalSeconds });
    
    scanner.start({
      intervalSeconds,
      onTokenFlagged: async (evaluation) => {
        console.log('\n' + '═'.repeat(70));
        console.log(`🎯 PROFITABLE TOKEN DETECTED: ${evaluation.symbol}`);
        console.log('═'.repeat(70));
        console.log(`Mint: ${evaluation.mint}`);
        console.log(`Score: ${evaluation.score}/100`);
        console.log('\nReasons:');
        evaluation.reasons.forEach(r => console.log(`  ${r}`));
        console.log('\n💡 ACTION: Copy mint address and analyze or snipe immediately!');
        console.log('═'.repeat(70) + '\n');
        
        // Send Discord notification if configured
        if (discord.enabled) {
          await discord.notifyFlaggedToken(evaluation);
        }
      },
    });
    
    console.log('🚀 Scanner running... Press Ctrl+C to stop.\n');
    
    // Keep process alive
    await new Promise(() => {});
  }

  async function handleScanUnified(args) {
    const options = parseOptions(args);
    const UnifiedTokenScanner = require('./unifiedTokenScanner');
    
    const scanner = new UnifiedTokenScanner(context);
    
    logger.info('Starting unified Dexscreener token scanner');
    
    await scanner.start();
    
    console.log('🌐 Unified Scanner running... Press Ctrl+C to stop.\\n');
    console.log('Monitoring ALL Solana DEXes via Dexscreener:\\n');
    console.log('  • Pump.fun (pumpswap)');
    console.log('  • Raydium');
    console.log('  • Orca');
    console.log('  • Meteora');
    console.log('  • All other Solana DEXes\\n');
    console.log('Single source of truth = maximum coverage!\\n');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\\n\\n🛑 Stopping unified scanner...');
      scanner.stop();
      process.exit(0);
    });
    
    // Keep process alive
    await new Promise(() => {});
  }

  async function handleValidate(args) {
    const { validateEnvironment } = require('../utils/validateEnv');
    const result = await validateEnvironment(context.config);
    
    if (!result.valid) {
      process.exit(1);
    }
  }

  async function handleQuickstart(args) {
    const Quickstart = require('./quickstart');
    const quickstart = new Quickstart(context);
    await quickstart.showMenu();
  }

  function renderResult(result, options) {
    if (!result) {
      logger.warn('No result returned from app.');
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log('\n=== Solana Whale Watcher 2.0 ===');
    console.log(`Token: ${result.meta.token.symbol || result.meta.token.mint}`);
    console.log(`Price (approx): ${result.meta.market?.priceUsd ?? 'n/a'} USD`);
    console.log(`Top Holders Analyzed: ${result.holders.length}`);
    console.log('');

    if (Array.isArray(result.leaderboard) && result.leaderboard.length > 0) {
      console.log('Leaderboard (Top 10 with Δ balance):');
      result.leaderboard.slice(0, 10).forEach((entry) => {
        const delta = entry.balanceDelta == null ? 'n/a' : formatNumber(entry.balanceDelta);
        const previousRank = entry.previousRank == null ? 'new' : `#${entry.previousRank}`;
        console.log(
          `  #${entry.rank} ${entry.wallet} – balance: ${formatNumber(entry.balance)} (Δ ${delta}, prev ${previousRank})`
        );
      });
      console.log('');
    }

    result.strategies.forEach((strategy) => {
      console.log(`--- ${strategy.name} ---`);
      console.log(`Narrative: ${strategy.narrative}`);
      const riskNotes = Array.isArray(strategy.risk?.notes) ? strategy.risk.notes.join('; ') : null;
      console.log(`Risk Notes: ${riskNotes || 'None'}`);
      console.log('Signals:');
      strategy.signals.forEach((signal, index) => {
        console.log(`  ${index + 1}. ${signal.title}`);
        if (signal.detail) {
          console.log(`     ${signal.detail}`);
        }
        if (signal.metrics) {
          Object.entries(signal.metrics).forEach(([key, value]) => {
            console.log(`     ${key}: ${value}`);
          });
        }
      });
      console.log('');
    });
  }

  function parseOptions(args) {
    const options = {};
    let currentKey = null;

    args.forEach((arg) => {
      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        if (value !== undefined) {
          options[key] = coerce(value);
          currentKey = null;
        } else {
          currentKey = key;
          options[key] = true;
        }
      } else if (currentKey) {
        options[currentKey] = coerce(arg);
        currentKey = null;
      }
    });

    return options;
  }

  function coerce(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) return numeric;
    return value;
  }

  function printHelp() {
    console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║            SOLANA WHALE WATCHER 2.0 - Command Reference          ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');
    console.log('Usage: node src/index.js <command> [options]\n');
    console.log('COMMANDS:\n');
    console.log('  quickstart        Interactive menu for easy access to all features');
    console.log('  analyze           Analyze a single token (one-time snapshot)');
    console.log('  scan              Start autonomous token scanner (whale activity focus)');
    console.log('  scan_unified      Start unified Dexscreener scanner (ALL DEXes - RECOMMENDED!)');
    console.log('  stream            Continuous token monitoring with periodic updates');
    console.log('  validate          Verify API keys and RPC connectivity');
    console.log('  backtest          Backtest strategies (currently uses analyze)');
    console.log('  help              Display this help message\n');
    console.log('OPTIONS:\n');
    console.log('  --mint=<address>          Token mint address to analyze');
    console.log('  --interval=<seconds>      Scan/refresh interval (default: 60)');
    console.log('  --bankroll=<number>       Override bankroll for risk calculations');
    console.log('  --json                    Output raw JSON instead of formatted text\n');
    console.log('EXAMPLES:\n');
    console.log('  # Interactive quickstart menu');
    console.log('  npm run quickstart\n');
    console.log('  # Analyze a specific token');
    console.log('  npm run analyze -- --mint=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263\n');
    console.log('  # Start autonomous scanner (checks every 60 seconds)');
    console.log('  npm run scan -- --interval=60\n');
    console.log('  # Start unified scanner (ALL DEXes via Dexscreener - RECOMMENDED)');
    console.log('  npm run scan:unified\n');
    console.log('  # Validate API configuration');
    console.log('  npm run validate\n');
    console.log('For full documentation, see USER_GUIDE.md and N8N_INTEGRATION.md\n');
  }

  function formatNumber(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return 'n/a';
    }
    if (Math.abs(num) >= 1) {
      return num.toFixed(2);
    }
    return num.toPrecision(3);
  }

  return {
    run,
  };
};
