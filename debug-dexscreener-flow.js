// Debug Dexscreener Integration
const https = require('https');

console.log('🔍 Debugging Dexscreener Integration...\n');

// Test 1: Check if API is accessible
console.log('TEST 1: Checking Dexscreener API...');
https.get('https://api.dexscreener.com/token-profiles/latest/v1', (res) => {
  let data = '';
  
  res.on('data', chunk => data += chunk);
  
  res.on('end', () => {
    try {
      const profiles = JSON.parse(data);
      console.log(`✅ API Response: ${res.statusCode}`);
      console.log(`✅ Total profiles: ${profiles.length}`);
      
      // Filter Solana tokens
      const solanaTokens = profiles.filter(p => p.chainId === 'solana');
      console.log(`✅ Solana tokens: ${solanaTokens.length}`);
      
      if (solanaTokens.length > 0) {
        console.log('\n📊 First Solana token:');
        const first = solanaTokens[0];
        console.log(`   Address: ${first.tokenAddress}`);
        console.log(`   ChainId: ${first.chainId}`);
        console.log(`   Description: ${first.description?.substring(0, 50)}...`);
        console.log(`   URL: ${first.url}`);
      }
      
      // Test 2: Check what our provider would return
      console.log('\n---\nTEST 2: Simulating Provider Logic...');
      
      const result = solanaTokens
        .slice(0, 20)
        .map(profile => ({
          mint: profile.tokenAddress,
          symbol: profile.icon ? null : profile.tokenAddress?.slice(0, 6),
          name: profile.description || 'Unknown',
          pairAddress: null,
          dexId: null,
          priceUsd: null,
          liquidityUsd: 1,
          volume24h: null,
          pairCreatedAt: null,
          timestamp: Date.now(),
        }))
        .filter(token => token.mint);
      
      console.log(`✅ Provider would return: ${result.length} tokens`);
      
      if (result.length > 0) {
        console.log('\n📊 First formatted token:');
        console.log(JSON.stringify(result[0], null, 2));
      }
      
      // Test 3: Check if scanner would accept these
      console.log('\n---\nTEST 3: Scanner Compatibility...');
      const hasValidMints = result.every(t => t.mint && t.mint.length > 30);
      console.log(`   All tokens have valid mints: ${hasValidMints ? '✅' : '❌'}`);
      
      if (result.length === 0) {
        console.log('\n❌ ISSUE: Provider returns 0 tokens!');
        console.log('   Possible causes:');
        console.log('   1. Filtering logic too strict');
        console.log('   2. Token structure unexpected');
        console.log('   3. No Solana tokens in latest profiles');
      } else if (solanaTokens.length > 0 && result.length === 0) {
        console.log('\n❌ ISSUE: Solana tokens exist but formatting fails!');
        console.log('   Check mapping logic in provider');
      } else {
        console.log('\n✅ Everything looks good! Scanner should find these tokens.');
        console.log('\n🔍 NEXT STEP: Check if scanner is actually calling getLatestPairs()');
      }
      
    } catch (err) {
      console.error('❌ Parse error:', err.message);
    }
  });
  
}).on('error', (err) => {
  console.error('❌ Request failed:', err.message);
});
