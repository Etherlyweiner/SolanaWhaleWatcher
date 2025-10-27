// Test specific token data accuracy
require('dotenv').config();
const createContext = require('./src/core/context');

const TEST_TOKEN = process.argv[2] || '2RC2RUC1SYLuiNmz2MkCsQawUyH6TW4JPZdvYT3wpump'; // From recent scan

async function testToken(mint) {
  console.log('='.repeat(70));
  console.log('TOKEN DATA ACCURACY TEST');
  console.log('='.repeat(70));
  console.log('');
  console.log('Testing mint:', mint);
  console.log('');

  const context = await createContext();

  try {
    // Fetch market data
    console.log('1. Fetching Dexscreener data...');
    const marketData = await context.services.dexscreenerProvider.getMarketData(mint);
    
    if (marketData) {
      console.log('   ✅ Market data found');
      console.log('   Symbol:', marketData.symbol);
      console.log('   Price:', marketData.priceUsd);
      console.log('   24h Volume:', marketData.volume?.h24 || 0);
      console.log('   Liquidity:', marketData.liquidity?.usd || 0);
      console.log('   DEX:', marketData.dexId);
    } else {
      console.log('   ❌ No market data (token not on Dexscreener)');
    }
    console.log('');

    // Fetch holder data
    console.log('2. Fetching Helius holder data...');
    try {
      const holders = await context.services.heliusProvider.getTokenHolders(mint);
      
      if (holders && holders.length > 0) {
        console.log('   ✅ Holder data found');
        console.log('   Total holders:', holders.length);
        console.log('   Top holder balance:', holders[0].balance);
        
        // Calculate concentration
        const totalSupply = holders.reduce((sum, h) => sum + h.balance, 0);
        const topFiveBalance = holders.slice(0, 5).reduce((sum, h) => sum + h.balance, 0);
        const concentration = (topFiveBalance / totalSupply * 100).toFixed(1);
        
        console.log('   Top 5 concentration:', concentration + '%');
      } else {
        console.log('   ⚠️  No holder data (might be normal for this token)');
      }
    } catch (error) {
      console.log('   ⚠️  Holder fetch failed:', error.message);
    }
    console.log('');

    // Test what scanner would do
    console.log('3. Scanner evaluation logic...');
    
    const hasMarketData = marketData && marketData.symbol && marketData.priceUsd;
    console.log('   Has market data?', hasMarketData ? '✅ YES' : '❌ NO');
    
    if (hasMarketData) {
      console.log('   Would be eligible for scoring ✅');
      console.log('');
      console.log('4. Verify on Dexscreener:');
      console.log('   https://dexscreener.com/solana/' + mint);
    } else {
      console.log('   Would be REJECTED (no market data) ❌');
      console.log('   This is correct behavior - prevents broken alerts');
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('TEST COMPLETE');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

testToken(TEST_TOKEN);
