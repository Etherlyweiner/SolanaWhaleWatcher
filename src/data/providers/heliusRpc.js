'use strict';

const { fetchJson } = require('../../util/http');

module.exports = (context) => {
  const logger = context.logger.child('provider:helius-rpc');
  const config = context.config.providers.helius;

  async function request(method, params = []) {
    ensureRpcConfigured();

    const body = {
      jsonrpc: '2.0',
      id: `helius-${method}`,
      method,
      params,
    };

    const response = await fetchJson(
      config.rpcUrl,
      {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      {
        retries: config.maxRetries,
        baseDelayMs: config.baseRetryMs,
      }
    );

    if (response?.error) {
      const error = new Error(response.error.message || 'Helius RPC error');
      error.code = response.error.code;
      logger.error('Helius RPC request failed', { method, params, error: error.message, code: error.code });
      throw error;
    }

    return response?.result;
  }

  function ensureRpcConfigured() {
    if (!config?.rpcUrl) {
      throw new Error('Helius RPC URL not configured');
    }
  }

  return {
    request,
  };
};
