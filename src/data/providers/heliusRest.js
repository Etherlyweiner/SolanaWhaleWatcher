'use strict';

const { fetchJson } = require('../../util/http');

module.exports = (context) => {
  const logger = context.logger.child('provider:helius-rest');
  const config = context.config.providers.helius;

  async function request(path, { method = 'POST', body = {} } = {}) {
    ensureRestConfigured();

    const url = new URL(path, ensureTrailingSlash(config.restUrl));
    if (config.apiKey) {
      url.searchParams.set('api-key', config.apiKey);
    }

    return fetchJson(
      url.toString(),
      {
        method,
        body,
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
      },
      {
        retries: config.maxRetries,
        baseDelayMs: config.baseRetryMs,
      }
    );
  }

  function ensureRestConfigured() {
    if (!config?.restUrl) {
      throw new Error('Helius REST URL not configured');
    }
  }

  function ensureTrailingSlash(url) {
    return url.endsWith('/') ? url : `${url}/`;
  }

  return {
    request,
  };
};
