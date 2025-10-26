'use strict';

const https = require('https');
const { URL } = require('url');
const logger = require('../util/logger');

/**
 * Discord Webhook Integration
 * Sends notifications to Discord channels when profitable tokens are found
 */

class DiscordNotifier {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
    this.log = logger('integrations:discord');
    this.enabled = !!webhookUrl;
  }

  /**
   * Send a notification to Discord
   * @param {Object} options - Notification options
   * @returns {Promise<boolean>} Success status
   */
  async send(options) {
    if (!this.enabled) {
      this.log.warn('Discord webhook not configured');
      return false;
    }

    const {
      title,
      description,
      fields = [],
      color = 0x00ff00, // Green
      timestamp = new Date().toISOString(),
      footer = 'Solana Whale Watcher 2.0',
    } = options;

    const embed = {
      title,
      description,
      color,
      fields,
      timestamp,
      footer: { text: footer },
    };

    const payload = {
      embeds: [embed],
    };

    try {
      await this.sendWebhook(payload);
      this.log.info('Discord notification sent', { title });
      return true;
    } catch (error) {
      this.log.error('Failed to send Discord notification', { error: error.message });
      return false;
    }
  }

  /**
   * Send webhook request to Discord
   * @param {Object} payload - Discord webhook payload
   * @returns {Promise<void>}
   */
  sendWebhook(payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.webhookUrl);
      const data = JSON.stringify(payload);

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode === 204 || res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Discord webhook returned ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * Notify about a flagged token (profitable opportunity)
   * @param {Object} evaluation - Token evaluation from scanner
   * @returns {Promise<boolean>}
   */
  async notifyFlaggedToken(evaluation) {
    const fields = [
      {
        name: '💰 Score',
        value: `${evaluation.score}/100`,
        inline: true,
      },
      {
        name: '🏷️ Symbol',
        value: evaluation.symbol || '???',
        inline: true,
      },
      {
        name: '📍 Mint Address',
        value: `\`${evaluation.mint}\``,
        inline: false,
      },
    ];

    // Add reasons as a field
    if (evaluation.reasons && evaluation.reasons.length > 0) {
      fields.push({
        name: '✅ Why This Token?',
        value: evaluation.reasons.slice(0, 5).join('\n'),
        inline: false,
      });
    }

    // Add market data if available
    if (evaluation.data?.market) {
      const market = evaluation.data.market;
      fields.push({
        name: '📊 Market Data',
        value: [
          `Price: $${market.priceUsd || 'N/A'}`,
          `24h Volume: $${(market.volume24hUsd || 0).toLocaleString()}`,
          `Liquidity: $${(market.liquidityUsd || 0).toLocaleString()}`,
        ].join('\n'),
        inline: false,
      });
    }

    // Add action items
    fields.push({
      name: '🚀 Next Steps',
      value: [
        '1. Copy mint address',
        '2. Run full analysis: `npm run analyze -- --mint=<MINT>`',
        '3. Verify on [Solscan](https://solscan.io) and [Dexscreener](https://dexscreener.com)',
        '4. Execute snipe if criteria confirmed',
      ].join('\n'),
      inline: false,
    });

    return this.send({
      title: '🎯 PROFITABLE TOKEN DETECTED',
      description: `A token meeting your whale activity criteria has been flagged!`,
      fields,
      color: 0x00ff00, // Green
    });
  }

  /**
   * Notify about whale accumulation activity
   * @param {Object} data - Whale activity data
   * @returns {Promise<boolean>}
   */
  async notifyWhaleActivity(data) {
    const { mint, symbol, whales, totalAccumulation } = data;

    const fields = [
      {
        name: '🏷️ Token',
        value: `${symbol} (\`${mint}\`)`,
        inline: false,
      },
      {
        name: '🐋 Whale Count',
        value: `${whales.length} wallets accumulating`,
        inline: true,
      },
      {
        name: '💎 Total Accumulation',
        value: `${totalAccumulation.toLocaleString()} tokens`,
        inline: true,
      },
    ];

    // Add top 3 whales
    whales.slice(0, 3).forEach((whale, idx) => {
      fields.push({
        name: `Whale ${idx + 1}`,
        value: `\`${whale.address.substring(0, 8)}...${whale.address.substring(whale.address.length - 4)}\`\nAdded: +${whale.delta.toLocaleString()} tokens`,
        inline: true,
      });
    });

    return this.send({
      title: '🐋 WHALE ACCUMULATION ALERT',
      description: 'Large wallets are accumulating this token!',
      fields,
      color: 0xffa500, // Orange
    });
  }

  /**
   * Notify about analysis completion
   * @param {Object} result - Analysis result
   * @returns {Promise<boolean>}
   */
  async notifyAnalysisComplete(result) {
    const { mint, symbol, strategies } = result;

    const fields = [
      {
        name: '🏷️ Token',
        value: `${symbol || 'Unknown'} (\`${mint}\`)`,
        inline: false,
      },
    ];

    // Add strategy summaries
    strategies.forEach((strategy) => {
      const signalCount = strategy.output?.signals?.length || 0;
      fields.push({
        name: strategy.name,
        value: `${signalCount} signals detected`,
        inline: true,
      });
    });

    return this.send({
      title: '📊 Analysis Complete',
      description: 'Token analysis finished. Check your terminal for full results.',
      fields,
      color: 0x0099ff, // Blue
    });
  }

  /**
   * Send a test notification
   * @returns {Promise<boolean>}
   */
  async sendTestNotification() {
    return this.send({
      title: '✅ Discord Integration Active',
      description: 'Your Discord webhook is configured correctly!',
      fields: [
        {
          name: '📡 Status',
          value: 'All systems operational',
          inline: true,
        },
        {
          name: '🚀 Ready',
          value: 'You will receive alerts here',
          inline: true,
        },
      ],
      color: 0x00ff00,
    });
  }
}

/**
 * Create Discord notifier from environment variable
 * @returns {DiscordNotifier}
 */
function createDiscordNotifier() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  return new DiscordNotifier(webhookUrl);
}

module.exports = {
  DiscordNotifier,
  createDiscordNotifier,
};
