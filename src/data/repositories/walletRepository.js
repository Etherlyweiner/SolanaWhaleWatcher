'use strict';

const fs = require('fs/promises');
const path = require('path');

const { TtlCache } = require('../../util/cache');

const HISTORY_LIMIT = 10;

module.exports = (context) => {
  const logger = context.logger.child('repo:wallet');
  const holderCache = new TtlCache({ ttlMs: context.config.cache.ttlMs });
  const snapshotDir = path.join(context.config.cache.dir, 'holders');
  const historyDir = path.join(snapshotDir, 'history');
  let snapshotDirReady = null;

  async function getTopHolders({ mint, limit = 25 }) {
    const cacheKey = `${mint}:${limit}`;
    const cached = holderCache.get(cacheKey);
    if (cached) {
      return cloneHolders(cached);
    }

    try {
      const holders = await context.services.solanaLoader.getTokenHolders(mint, limit);
      holderCache.set(cacheKey, holders);
      persistSnapshot(mint, holders).catch((error) => {
        logger.warn('Failed to persist holder snapshot', { error: error.message, mint });
      });
      return cloneHolders(holders);
    } catch (error) {
      logger.error('Failed to fetch top holders', { error: error.message, mint });
      throw error;
    }
  }

  async function getWalletActivity(wallets, options = {}) {
    return context.services.solanaLoader.getWalletActivity(wallets, options);
  }

  async function persistSnapshot(mint, holders) {
    await ensureSnapshotDir();

    const payload = {
      mint,
      limit: holders.length,
      ts: new Date().toISOString(),
      holders,
    };

    const filePath = path.join(snapshotDir, `${mint}.json`);
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');

    await Promise.allSettled([
      persistHistorySnapshot(mint, payload),
      writeLatestExport(mint, payload),
    ]);
  }

  async function ensureSnapshotDir() {
    if (snapshotDirReady) {
      return snapshotDirReady;
    }

    snapshotDirReady = fs
      .mkdir(snapshotDir, { recursive: true })
      .then(() => true)
      .catch((error) => {
        snapshotDirReady = null;
        throw error;
      });

    return snapshotDirReady;
  }

  function cloneHolders(list = []) {
    return list.map((holder) => ({ ...holder }));
  }

  async function persistHistorySnapshot(mint, payload) {
    try {
      await fs.mkdir(historyDir, { recursive: true });
      const timestamp = payload.ts.replace(/[:.]/g, '-');
      const historyFile = path.join(historyDir, `${mint}-${timestamp}.json`);
      await fs.writeFile(historyFile, JSON.stringify(payload, null, 2), 'utf8');

      const entries = await fs.readdir(historyDir);
      const mintEntries = entries.filter((entry) => entry.startsWith(`${mint}-`));
      if (mintEntries.length > HISTORY_LIMIT) {
        const stats = await Promise.all(
          mintEntries.map(async (name) => {
            const fullPath = path.join(historyDir, name);
            const stat = await fs.stat(fullPath);
            return { name, time: stat.mtimeMs, fullPath };
          })
        );
        stats
          .sort((a, b) => a.time - b.time)
          .slice(0, Math.max(0, stats.length - HISTORY_LIMIT))
          .forEach(async (entry) => {
            try {
              await fs.unlink(entry.fullPath);
            } catch (error) {
              logger.debug('Failed to prune holder history file', {
                mint,
                file: entry.fullPath,
                error: error.message,
              });
            }
          });
      }
    } catch (error) {
      logger.debug('Failed to persist holder history snapshot', { mint, error: error.message });
    }
  }

  async function writeLatestExport(mint, payload) {
    if (!context.config.reporting?.enabled || !context.config.reporting?.exportDir) {
      return;
    }

    try {
      await fs.mkdir(context.config.reporting.exportDir, { recursive: true });
      const exportFile = path.join(context.config.reporting.exportDir, `${mint}-latest.json`);
      await fs.writeFile(exportFile, JSON.stringify(payload, null, 2), 'utf8');
    } catch (error) {
      logger.debug('Failed to export latest holder snapshot', { mint, error: error.message });
    }
  }

  return {
    getTopHolders,
    getWalletActivity,
  };
};
