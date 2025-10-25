'use strict';

const LEVELS = ['error', 'warn', 'info', 'debug'];

const DEFAULT_LEVEL = process.env.LOG_LEVEL || 'info';

function shouldLog(level) {
  return LEVELS.indexOf(level) <= LEVELS.indexOf(DEFAULT_LEVEL);
}

function timestamp() {
  return new Date().toISOString();
}

module.exports = function createLogger(namespace = 'app') {
  function log(level, message, meta = {}) {
    if (!shouldLog(level)) return;
    const payload = {
      ts: timestamp(),
      level,
      ns: namespace,
      msg: message,
      ...meta,
    };
    const text = JSON.stringify(payload);
    if (level === 'error') {
      console.error(text);
    } else if (level === 'warn') {
      console.warn(text);
    } else {
      console.log(text);
    }
  }

  return {
    error: (message, meta) => log('error', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    info: (message, meta) => log('info', message, meta),
    debug: (message, meta) => log('debug', message, meta),
    child: (childNamespace) => createLogger(`${namespace}:${childNamespace}`),
  };
};
