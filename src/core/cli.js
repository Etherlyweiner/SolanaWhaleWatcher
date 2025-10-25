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

    result.strategies.forEach((strategy) => {
      console.log(`--- ${strategy.name} ---`);
      console.log(`Narrative: ${strategy.narrative}`);
      console.log(`Risk Notes: ${strategy.risk.notes.join('; ') || 'None'}`);
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
    console.log('Usage: node src/index.js <command> [options]');
    console.log('Commands: analyze, stream, backtest, help');
    console.log('Options:');
    console.log('  --mint=<address>          Token mint address to analyze');
    console.log('  --interval=<seconds>      Refresh cadence for stream mode');
    console.log('  --json                    Print raw JSON output');
    console.log('  --bankroll=<number>       Override bankroll for risk manager');
  }

  return {
    run,
  };
};
