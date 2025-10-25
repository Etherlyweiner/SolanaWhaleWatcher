'use strict';

const readline = require('readline');
const path = require('path');

/**
 * Interactive CLI Quickstart Menu
 * Provides user-friendly interface to run common tasks
 */

class Quickstart {
  constructor(context) {
    this.context = context;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Display main menu and handle user selection
   */
  async showMenu() {
    console.clear();
    console.log('╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║                  SOLANA WHALE WATCHER 2.0                         ║');
    console.log('║                   Interactive Quickstart                          ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

    console.log('📋 MAIN MENU\n');
    console.log('  1️⃣  Analyze a Token (one-time)');
    console.log('  2️⃣  Start Autonomous Sniper Scanner');
    console.log('  3️⃣  Stream Token Updates (continuous)');
    console.log('  4️⃣  Validate API Configuration');
    console.log('  5️⃣  View Recent Journal Entries');
    console.log('  6️⃣  Configure Settings');
    console.log('  7️⃣  Exit\n');

    const choice = await this.prompt('Select an option (1-7): ');

    switch (choice.trim()) {
      case '1':
        await this.analyzeToken();
        break;
      case '2':
        await this.startScanner();
        break;
      case '3':
        await this.streamToken();
        break;
      case '4':
        await this.validateConfig();
        break;
      case '5':
        await this.viewJournal();
        break;
      case '6':
        await this.configureSettings();
        break;
      case '7':
        console.log('\n👋 Goodbye! Happy trading!\n');
        this.close();
        return;
      default:
        console.log('\n❌ Invalid choice. Please select 1-7.\n');
        await this.pause();
        return this.showMenu();
    }

    await this.pause();
    return this.showMenu();
  }

  /**
   * Option 1: Analyze a token
   */
  async analyzeToken() {
    console.log('\n' + '─'.repeat(70));
    console.log('📊 ANALYZE TOKEN\n');

    const mint = await this.prompt('Enter token mint address (or "back"): ');
    if (mint.toLowerCase() === 'back') return;

    const bankroll = await this.prompt('Enter bankroll amount (or press Enter for default $5000): ');
    const bankrollValue = bankroll.trim() ? parseFloat(bankroll) : 5000;

    console.log('\n🔄 Analyzing token...\n');

    try {
      const createApp = require('./app');
      const app = createApp(this.context);
      await app.analyze({ mint, bankroll: bankrollValue });
      console.log('\n✅ Analysis complete! Check reports/ folder for details.\n');
    } catch (error) {
      console.log(`\n❌ Analysis failed: ${error.message}\n`);
    }
  }

  /**
   * Option 2: Start autonomous scanner
   */
  async startScanner() {
    console.log('\n' + '─'.repeat(70));
    console.log('🎯 AUTONOMOUS SNIPER SCANNER\n');
    console.log('This will continuously scan for tokens meeting whale activity criteria.');
    console.log('Press Ctrl+C to stop.\n');

    const interval = await this.prompt('Scan interval in seconds (default 60): ');
    const intervalValue = interval.trim() ? parseInt(interval) : 60;

    console.log(`\n🚀 Starting scanner (checking every ${intervalValue}s)...\n`);

    try {
      const TokenScanner = require('./scanner');
      const scanner = new TokenScanner(this.context);

      // Start scanner with callback to display flagged tokens
      scanner.start({
        intervalSeconds: intervalValue,
        onTokenFlagged: (evaluation) => {
          console.log('\n' + '═'.repeat(70));
          console.log(`🎯 PROFITABLE TOKEN DETECTED: ${evaluation.symbol}`);
          console.log('═'.repeat(70));
          console.log(`Mint: ${evaluation.mint}`);
          console.log(`Score: ${evaluation.score}/100`);
          console.log('\nReasons:');
          evaluation.reasons.forEach(r => console.log(`  ${r}`));
          console.log('\n💡 ACTION: Copy mint address and analyze or snipe immediately!');
          console.log('═'.repeat(70) + '\n');
        },
      });

      // Keep process alive
      await new Promise(() => {}); // Never resolves, exits via Ctrl+C
    } catch (error) {
      console.log(`\n❌ Scanner failed: ${error.message}\n`);
    }
  }

  /**
   * Option 3: Stream token updates
   */
  async streamToken() {
    console.log('\n' + '─'.repeat(70));
    console.log('📡 STREAM TOKEN UPDATES\n');

    const mint = await this.prompt('Enter token mint address (or "back"): ');
    if (mint.toLowerCase() === 'back') return;

    const interval = await this.prompt('Update interval in seconds (default 60): ');
    const intervalValue = interval.trim() ? parseInt(interval) : 60;

    console.log(`\n🔄 Streaming updates every ${intervalValue}s... (Press Ctrl+C to stop)\n`);

    try {
      const createApp = require('./app');
      const app = createApp(this.context);
      await app.stream({ mint, interval: intervalValue });
    } catch (error) {
      console.log(`\n❌ Stream failed: ${error.message}\n`);
    }
  }

  /**
   * Option 4: Validate API configuration
   */
  async validateConfig() {
    console.log('\n' + '─'.repeat(70));
    console.log('🔍 VALIDATE API CONFIGURATION\n');

    try {
      const { validateEnvironment } = require('../utils/validateEnv');
      const config = require('../config/defaults');
      await validateEnvironment(config);
    } catch (error) {
      console.log(`\n❌ Validation failed: ${error.message}\n`);
    }
  }

  /**
   * Option 5: View recent journal entries
   */
  async viewJournal() {
    console.log('\n' + '─'.repeat(70));
    console.log('📖 RECENT JOURNAL ENTRIES\n');

    try {
      const fs = require('fs');
      const journalPath = path.resolve(__dirname, '..', '..', 'reports', 'journal.json');

      if (!fs.existsSync(journalPath)) {
        console.log('No journal entries found. Run an analysis first.\n');
        return;
      }

      const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
      const recent = journal.slice(-5).reverse(); // Last 5, newest first

      recent.forEach((entry, idx) => {
        console.log(`${idx + 1}. ${entry.timestamp}`);
        console.log(`   Token: ${entry.mint}`);
        console.log(`   Mode: ${entry.mode}`);
        console.log(`   Strategies: ${entry.strategies.map(s => s.name).join(', ')}`);
        console.log('');
      });

      console.log(`Total entries: ${journal.length}\n`);
    } catch (error) {
      console.log(`\n❌ Failed to read journal: ${error.message}\n`);
    }
  }

  /**
   * Option 6: Configure settings
   */
  async configureSettings() {
    console.log('\n' + '─'.repeat(70));
    console.log('⚙️  CONFIGURE SETTINGS\n');
    console.log('Current configuration:\n');

    const config = require('../config/defaults');
    console.log(`  Default Bankroll: $${config.app.defaultBankroll || 'not set'}`);
    console.log(`  Max Position: ${(config.app.maxPositionPercent * 100) || 'not set'}%`);
    console.log(`  Stop Loss: ${(config.app.stopLossPercent * 100) || 'not set'}%`);
    console.log(`  Reporting: ${config.app.reporting.enabled ? 'Enabled' : 'Disabled'}`);
    console.log('\n💡 To change settings, edit the .env file in the project root.\n');
    console.log('Example .env configuration:');
    console.log('  DEFAULT_BANKROLL=10000');
    console.log('  MAX_POSITION_PERCENT=0.02');
    console.log('  STOP_LOSS_PERCENT=0.08\n');
  }

  /**
   * Prompt user for input
   * @param {string} question - Question to ask
   * @returns {Promise<string>} User's answer
   */
  prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Pause and wait for user to press Enter
   */
  pause() {
    return this.prompt('\nPress Enter to continue...');
  }

  /**
   * Close the readline interface
   */
  close() {
    this.rl.close();
  }
}

module.exports = Quickstart;
