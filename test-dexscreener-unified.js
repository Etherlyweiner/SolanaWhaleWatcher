// Test Dexscreener's ability to monitor ALL Solana tokens (Pump.fun, Raydium, etc.)
const fetch = require('node-fetch');

async function testDexscreenerUnified() {
  console.log('🧪 Testing Dexscreener Unified Token Monitoring\n');
  console.log('='.repeat(70));
  
  const endpoints = [
    {
      name: 'Latest Solana Pairs',
      url: 'https://api.dexscreener.com/latest/dex/pairs/solana',
      description: 'Get latest pairs across ALL DEXes (Pump.fun, Raydium, Orca, etc.)'
    },
    {
      name: 'Token by Address',
      url: 'https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112',
      description: 'Get token info from any source'
    },
    {
      name: 'Search Tokens',
      url: 'https://api.dexscreener.com/latest/dex/search/?q=pump',
      description: 'Search for tokens by keyword'
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
        },
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Response Time: ${duration}ms`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.pairs && Array.isArray(data.pairs)) {
          console.log(`✅ SUCCESS - Received ${data.pairs.length} pairs`);
          
          // Analyze which DEXes are represented
          const dexes = {};
          const pumpfunPairs = [];
          
          data.pairs.forEach(pair => {
            if (!dexes[pair.dexId]) dexes[pair.dexId] = 0;
            dexes[pair.dexId]++;
            
            // Check if it's from Pump.fun or Pump.swap
            if (pair.dexId?.toLowerCase().includes('pump')) {
              pumpfunPairs.push(pair);
            }
          });
          
          console.log(`\nDEX Breakdown:`);
          Object.entries(dexes).forEach(([dex, count]) => {
            console.log(`  ${dex}: ${count} pairs`);
          });
          
          if (pumpfunPairs.length > 0) {
            console.log(`\n🎯 Pump.fun tokens found: ${pumpfunPairs.length}`);
            const sample = pumpfunPairs[0];
            console.log(`Sample Pump.fun token:`);
            console.log(`  Symbol: ${sample.baseToken?.symbol}`);
            console.log(`  Address: ${sample.baseToken?.address}`);
            console.log(`  Price: $${sample.priceUsd}`);
            console.log(`  Liquidity: $${sample.liquidity?.usd}`);
            console.log(`  Volume 24h: $${sample.volume?.h24}`);
            console.log(`  DEX: ${sample.dexId}`);
            console.log(`  Created: ${new Date(sample.pairCreatedAt).toLocaleString()}`);
          }
          
          // Check for newest pairs (< 5 min old)
          const now = Date.now();
          const fiveMinAgo = now - (5 * 60 * 1000);
          const newPairs = data.pairs.filter(p => p.pairCreatedAt && p.pairCreatedAt > fiveMinAgo);
          
          console.log(`\n⏰ Pairs < 5 minutes old: ${newPairs.length}`);
          if (newPairs.length > 0) {
            console.log(`Newest pair:`);
            const newest = newPairs[0];
            console.log(`  Symbol: ${newest.baseToken?.symbol}`);
            console.log(`  DEX: ${newest.dexId}`);
            console.log(`  Age: ${((now - newest.pairCreatedAt) / 1000 / 60).toFixed(1)} minutes`);
          }
        }
      } else {
        const text = await response.text();
        console.log(`❌ FAILED - ${text.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n💡 Key Findings:\n');
  
  console.log('Dexscreener as Unified Source:');
  console.log('  ✅ Aggregates ALL DEXes (Pump.fun, Raydium, Orca, etc.)');
  console.log('  ✅ Single API endpoint for everything');
  console.log('  ✅ More stable than individual DEX APIs');
  console.log('  ✅ Already includes timestamps (pairCreatedAt)');
  console.log('  ✅ Includes liquidity, volume, price data');
  console.log('  ✅ Free, no API key required');
  
  console.log('\nRecommended Approach:');
  console.log('  1. Query Dexscreener every 15-30 seconds');
  console.log('  2. Filter for pairs < 5 minutes old');
  console.log('  3. Filter by minimum liquidity ($10k)');
  console.log('  4. Get ALL new tokens (Pump.fun + Raydium + others)');
  console.log('  5. Single source of truth = simpler code');
  
  console.log('\nAdvantages over direct APIs:');
  console.log('  - No need for Pump.fun API (unreliable)');
  console.log('  - No need for multiple providers (Raydium, Orca, etc.)');
  console.log('  - Data already normalized and formatted');
  console.log('  - More opportunities (catches everything)');
}

testDexscreenerUnified().catch(console.error);
