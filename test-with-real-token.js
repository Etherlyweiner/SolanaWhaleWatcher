// Test full pipeline with real Solana token
const https = require('https');
const http = require('http');

const testToken = {
  mint: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  symbol: 'SOL',
  score: 85, // High score to trigger Discord
  reasons: [
    '✅ TEST: Proving pipeline works',
    '✅ Webhook integration verified',
    '✅ N8N workflow active',
    '✅ Discord configured'
  ],
  data: {
    market: {
      priceUsd: 150.25,
      liquidityUsd: 5000000,
      volume24hUsd: 10000000
    },
    holder: {
      topFiveShare: 0.185,
      totalHolders: 50000
    },
    launch: {
      ageMinutes: 0,
      rugScore: 5,
      liquidityUsd: 5000000
    }
  },
  timestamp: new Date().toISOString()
};

console.log('🚀 Testing full pipeline with real token...');
console.log('Token:', testToken.symbol);
console.log('Score:', testToken.score);
console.log('');

const webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/whale-watcher';
const url = new URL(webhookUrl);
const data = JSON.stringify(testToken);

const options = {
  hostname: url.hostname,
  port: url.port || 5678,
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const protocol = url.protocol === 'https:' ? https : http;

const req = protocol.request(options, (res) => {
  console.log('✅ Webhook Response:', res.statusCode);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    console.log('');
    console.log('🎉 SUCCESS! Check:');
    console.log('1. N8N Executions: http://localhost:5678');
    console.log('2. Discord for alert message');
    console.log('');
    console.log('If you see this response and the alert in Discord,');
    console.log('your ENTIRE system is working perfectly!');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();
