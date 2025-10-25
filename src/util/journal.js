'use strict';

const fs = require('fs/promises');
const path = require('path');

async function append(context, entry) {
  const {
    config: {
      reporting: { journalFile },
    },
    logger,
  } = context;

  const dir = path.dirname(journalFile);
  await ensureDir(dir);

  const record = {
    ts: new Date().toISOString(),
    ...entry,
  };

  try {
    const existing = await readExisting(journalFile);
    existing.push(record);
    await fs.writeFile(journalFile, JSON.stringify(existing, null, 2));
  } catch (error) {
    logger.error('Failed to write journal entry', { error: error.message, file: journalFile });
  }
}

async function readExisting(file) {
  try {
    const contents = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(contents);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

module.exports = {
  append,
};
