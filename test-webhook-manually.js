// Manually test webhook with sample good token data
require('dotenv').config();
const fetch = require('node-fetch');

const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

const sampleGoodToken = {
  mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK (example)
  score: 45,
  data: {
    holder: {
      topFiveConcentration: 25.5,
      totalHolders: 150,
      whaleCount: 8,
    },
    market: {
      symbol: 'BONK',
      priceUsd: '0.00001234',
      volume24hUsd: 250000,
      volume6hUsd: 100000,
      liquidityUsd: 85000,
    },
    launch: {
      ageMinutes: 12,
      creator: '9xQe...abc',
      teamSharePercent: 5,
      rugScore: 15,
    },
  },
  reasons: [
    'Whale concentration in sweet spot (25.5%)',
    'Strong volume ($250k 24h)',
    'Low rug score (15/100)',
  ],
  timestamp: new Date().toISOString(),
};

async function testWebhook() {
  console.log('🧪 Testing Webhook with Sample Token Data');
  console.log('='.repeat(70));
  console.log('');
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('');
  console.log('Sending payload:');
  console.log(JSON.stringify(sampleGoodToken, null, 2));
  console.log('');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sampleGoodToken),
    });

    console.log('Response Status:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('✅ Webhook delivered successfully!');
      console.log('');
      console.log('📱 Check your Discord for the alert!');
      console.log('');
      console.log('Expected format:');
      console.log('--------------------------------------------------');
      console.log('🎯 Profitable Token Detected!');
      console.log('Symbol: BONK');
      console.log('Score: 45/100');
      console.log('Mint: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');
      console.log('');
      console.log('💰 Market Data:');
      console.log('Price: $0.00001234');
      console.log('Liquidity: $85,000');
      console.log('24h Volume: $250,000');
      console.log('--------------------------------------------------');
    } else {
      const text = await response.text();
      console.log('❌ Webhook failed:', text);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('');
  console.log('='.repeat(70));
}

testWebhook();
