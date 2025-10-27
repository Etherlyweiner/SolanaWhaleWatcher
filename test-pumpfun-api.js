// Test Pump.fun API accessibility
const fetch = require('node-fetch');

async function testPumpfunAPI() {
  console.log('🧪 Testing Pump.fun API Accessibility\n');
  console.log('='.repeat(70));
  
  const endpoints = [
    {
      name: 'Main Coins Endpoint',
      url: 'https://frontend-api.pump.fun/coins',
      description: 'Get all active tokens'
    },
    {
      name: 'Specific Token Endpoint',
      url: 'https://frontend-api.pump.fun/coins/2RC2RUC1SYLuiNmz2MkCsQawUyH6TW4JPZdvYT3wpump',
      description: 'Get specific token details'
    },
    {
      name: 'Alternative Endpoint 1',
      url: 'https://api.pump.fun/coins',
      description: 'Alternative API base'
    },
    {
      name: 'Pump.fun Website',
      url: 'https://pump.fun',
      description: 'Main website (for scraping fallback)'
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}`);
    console.log(`Purpose: ${endpoint.description}`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Response Time: ${duration}ms`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(`Content-Type: ${contentType}`);
        
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          
          if (Array.isArray(data)) {
            console.log(`✅ SUCCESS - Received ${data.length} items`);
            if (data[0]) {
              console.log(`Sample data keys: ${Object.keys(data[0]).slice(0, 5).join(', ')}...`);
            }
          } else if (typeof data === 'object') {
            console.log(`✅ SUCCESS - Received object with keys: ${Object.keys(data).slice(0, 5).join(', ')}`);
          } else {
            console.log(`✅ SUCCESS - Received data type: ${typeof data}`);
          }
        } else {
          const text = await response.text();
          console.log(`✅ SUCCESS - Received ${text.length} bytes of ${contentType}`);
        }
      } else {
        const text = await response.text();
        console.log(`❌ FAILED - ${text.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      if (error.code) {
        console.log(`Error Code: ${error.code}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Summary & Recommendations:\n');
  
  console.log('If Pump.fun API is DOWN:');
  console.log('  Option 1: Use Birdeye API (has new token listings)');
  console.log('  Option 2: Use GMGN.ai API (Solana token data)');
  console.log('  Option 3: Scrape Pump.fun website directly');
  console.log('  Option 4: Use Dexscreener "newest" filter');
  console.log('  Option 5: Monitor Raydium directly (skip Pump.fun)');
  
  console.log('\nIf Pump.fun API is UP but SLOW:');
  console.log('  - Increase timeout from 10s to 30s');
  console.log('  - Add retry logic (3 attempts)');
  console.log('  - Cache responses for 5-10 seconds');
  console.log('  - Use backup endpoints in rotation');
}

testPumpfunAPI().catch(console.error);
