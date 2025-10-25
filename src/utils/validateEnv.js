'use strict';

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Validate .env configuration and test API connectivity
 */

const VALIDATION_RESULTS = {
  VALID: 'valid',
  INVALID: 'invalid',
  MISSING: 'missing',
};

/**
 * Test HTTP/HTTPS endpoint connectivity
 * @param {string} url - URL to test
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Test result
 */
function testEndpoint(url, options = {}) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        method: options.method || 'GET',
        timeout: options.timeout || 5000,
        headers: options.headers || {},
      };

      const req = protocol.request(url, requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: VALIDATION_RESULTS.VALID,
            statusCode: res.statusCode,
            message: `Connected successfully (${res.statusCode})`,
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          status: VALIDATION_RESULTS.INVALID,
          message: `Connection failed: ${error.message}`,
          error: error.message,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: VALIDATION_RESULTS.INVALID,
          message: 'Connection timeout',
        });
      });

      req.end();
    } catch (error) {
      resolve({
        status: VALIDATION_RESULTS.INVALID,
        message: `Invalid URL: ${error.message}`,
        error: error.message,
      });
    }
  });
}

/**
 * Validate Helius RPC URL
 * @param {string} rpcUrl - Helius RPC URL
 * @returns {Promise<Object>} Validation result
 */
async function validateHeliusRpc(rpcUrl) {
  if (!rpcUrl) {
    return {
      key: 'HELIUS_RPC_URL',
      status: VALIDATION_RESULTS.MISSING,
      message: '❌ HELIUS_RPC_URL not set in .env',
    };
  }

  // Test RPC connectivity with getVersion call
  try {
    const result = await testEndpoint(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    if (result.status === VALIDATION_RESULTS.VALID) {
      return {
        key: 'HELIUS_RPC_URL',
        status: VALIDATION_RESULTS.VALID,
        message: '✅ Helius RPC connected',
        url: rpcUrl.replace(/api-key=[^&]+/, 'api-key=***'),
      };
    } else {
      return {
        key: 'HELIUS_RPC_URL',
        status: VALIDATION_RESULTS.INVALID,
        message: `❌ Helius RPC unreachable: ${result.message}`,
      };
    }
  } catch (error) {
    return {
      key: 'HELIUS_RPC_URL',
      status: VALIDATION_RESULTS.INVALID,
      message: `❌ Helius RPC test failed: ${error.message}`,
    };
  }
}

/**
 * Validate Helius REST API Key
 * @param {string} apiKey - Helius REST API key
 * @param {string} restUrl - Helius REST base URL
 * @returns {Promise<Object>} Validation result
 */
async function validateHeliusApiKey(apiKey, restUrl = 'https://api.helius.xyz') {
  if (!apiKey) {
    return {
      key: 'HELIUS_API_KEY',
      status: VALIDATION_RESULTS.MISSING,
      message: '⚠️  HELIUS_API_KEY not set (some features disabled)',
      severity: 'warning',
    };
  }

  // Test API key with a simple endpoint
  const testUrl = `${restUrl}/v0/addresses/HeliusCDJ8fMD7bNAFVx9ekpvZqr2D3QVWR3VmXF4DXdR/balances?api-key=${apiKey}`;
  
  try {
    const result = await testEndpoint(testUrl, { timeout: 10000 });
    
    if (result.status === VALIDATION_RESULTS.VALID && result.statusCode < 500) {
      if (result.statusCode === 401 || result.statusCode === 403) {
        return {
          key: 'HELIUS_API_KEY',
          status: VALIDATION_RESULTS.INVALID,
          message: '❌ Helius API key invalid (401/403)',
        };
      }
      return {
        key: 'HELIUS_API_KEY',
        status: VALIDATION_RESULTS.VALID,
        message: '✅ Helius API key valid',
        maskedKey: `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
      };
    } else {
      return {
        key: 'HELIUS_API_KEY',
        status: VALIDATION_RESULTS.INVALID,
        message: `❌ Helius API unreachable: ${result.message}`,
      };
    }
  } catch (error) {
    return {
      key: 'HELIUS_API_KEY',
      status: VALIDATION_RESULTS.INVALID,
      message: `❌ Helius API test failed: ${error.message}`,
    };
  }
}

/**
 * Validate Dexscreener connectivity
 * @returns {Promise<Object>} Validation result
 */
async function validateDexscreener() {
  const testUrl = 'https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112';
  
  try {
    const result = await testEndpoint(testUrl, { timeout: 10000 });
    
    if (result.status === VALIDATION_RESULTS.VALID && result.statusCode === 200) {
      return {
        key: 'DEXSCREENER_API',
        status: VALIDATION_RESULTS.VALID,
        message: '✅ Dexscreener API connected',
      };
    } else {
      return {
        key: 'DEXSCREENER_API',
        status: VALIDATION_RESULTS.INVALID,
        message: `⚠️  Dexscreener API issues: ${result.message}`,
        severity: 'warning',
      };
    }
  } catch (error) {
    return {
      key: 'DEXSCREENER_API',
      status: VALIDATION_RESULTS.INVALID,
      message: `⚠️  Dexscreener test failed: ${error.message}`,
      severity: 'warning',
    };
  }
}

/**
 * Validate all environment configuration
 * @param {Object} config - Configuration object from defaults.js
 * @returns {Promise<Object>} Complete validation report
 */
async function validateEnvironment(config) {
  console.log('🔍 Validating environment configuration...\n');

  const results = [];

  // Validate Helius RPC
  const heliusRpcResult = await validateHeliusRpc(config.providers?.helius?.rpcUrl);
  results.push(heliusRpcResult);
  console.log(heliusRpcResult.message);

  // Validate Helius API Key
  const heliusApiResult = await validateHeliusApiKey(
    config.providers?.helius?.apiKey,
    config.providers?.helius?.restUrl
  );
  results.push(heliusApiResult);
  console.log(heliusApiResult.message);

  // Validate Dexscreener
  const dexscreenerResult = await validateDexscreener();
  results.push(dexscreenerResult);
  console.log(dexscreenerResult.message);

  // Check required environment variables
  console.log('\n📋 Configuration Check:');
  const envChecks = [
    { key: 'DEFAULT_BANKROLL', value: config.app?.defaultBankroll || process.env.DEFAULT_BANKROLL, required: false },
    { key: 'MAX_POSITION_PERCENT', value: config.app?.maxPositionPercent || process.env.MAX_POSITION_PERCENT, required: false },
    { key: 'STOP_LOSS_PERCENT', value: config.app?.stopLossPercent || process.env.STOP_LOSS_PERCENT, required: false },
  ];

  for (const check of envChecks) {
    if (check.value) {
      console.log(`  ✅ ${check.key}: ${check.value}`);
      results.push({
        key: check.key,
        status: VALIDATION_RESULTS.VALID,
        value: check.value,
      });
    } else if (check.required) {
      console.log(`  ❌ ${check.key}: MISSING (required)`);
      results.push({
        key: check.key,
        status: VALIDATION_RESULTS.MISSING,
      });
    } else {
      console.log(`  ⚠️  ${check.key}: using default`);
      results.push({
        key: check.key,
        status: VALIDATION_RESULTS.MISSING,
        severity: 'info',
      });
    }
  }

  // Summary
  const critical = results.filter(r => r.status === VALIDATION_RESULTS.INVALID && !r.severity);
  const warnings = results.filter(r => r.severity === 'warning' || (r.status === VALIDATION_RESULTS.MISSING && !r.severity));
  const valid = results.filter(r => r.status === VALIDATION_RESULTS.VALID);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Validation Summary:');
  console.log(`  ✅ Valid: ${valid.length}`);
  console.log(`  ⚠️  Warnings: ${warnings.length}`);
  console.log(`  ❌ Critical Issues: ${critical.length}`);
  console.log('='.repeat(60));

  const allValid = critical.length === 0;

  if (!allValid) {
    console.log('\n⚠️  Critical issues detected. Please fix before running the program.');
    console.log('See .env.example for reference configuration.\n');
  } else if (warnings.length > 0) {
    console.log('\n✅ Core configuration valid. Some optional features may be limited.\n');
  } else {
    console.log('\n✅ All systems operational! You\'re ready to analyze tokens.\n');
  }

  return {
    valid: allValid,
    results,
    summary: {
      valid: valid.length,
      warnings: warnings.length,
      critical: critical.length,
    },
  };
}

module.exports = {
  validateEnvironment,
  validateHeliusRpc,
  validateHeliusApiKey,
  validateDexscreener,
  VALIDATION_RESULTS,
};
