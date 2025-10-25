'use strict';

const undici = require('undici');
const { setTimeout: delay } = require('node:timers/promises');

function normalizeOptions(options = {}) {
  const normalized = { ...options };
  if (normalized.body && typeof normalized.body === 'object' && !(normalized.body instanceof Buffer)) {
    normalized.body = JSON.stringify(normalized.body);
    normalized.headers = {
      'Content-Type': 'application/json',
      ...(normalized.headers || {}),
    };
  } else if (!normalized.headers) {
    normalized.headers = {};
  }
  return normalized;
}

async function fetchWithRetry(url, options = {}, retryConfig = {}) {
  const { retries = 3, baseDelayMs = 250 } = retryConfig;
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      const response = await undici.fetch(url, normalizeOptions(options));
      if (!response.ok) {
        const body = await safeJson(response);
        const error = new Error(
          `HTTP ${response.status} ${response.statusText} for ${url}`
        );
        error.status = response.status;
        error.body = body;
        throw error;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        throw lastError;
      }
      const jitter = Math.random() * baseDelayMs;
      const backoff = baseDelayMs * 2 ** attempt + jitter;
      await delay(backoff);
      attempt += 1;
    }
  }

  throw lastError || new Error(`Failed to fetch ${url}`);
}

async function fetchJson(url, options = {}, retryConfig = {}) {
  const response = await fetchWithRetry(url, options, retryConfig);
  return safeJson(response);
}

async function safeJson(response) {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

module.exports = {
  fetchWithRetry,
  fetchJson,
};
