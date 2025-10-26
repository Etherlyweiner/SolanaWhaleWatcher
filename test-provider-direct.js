// Test Dexscreener Provider Directly
const path = require('path');

console.log('🧪 Testing Dexscreener Provider Directly...\n');

// Set up minimal context
const context = {
  config: require('./src/config/defaults.js'),
  logger: {
    child: () => ({
      info: (msg, data) => console.log('INFO:', msg, data || ''),
      error: (msg, data) => console.log('ERROR:', msg, data || ''),
      warn: (msg, data) => console.log('WARN:', msg, data || ''),
      debug: (msg, data) => console.log('DEBUG:', msg, data || ''),
    })
  }
};

console.log('Config providers:', Object.keys(context.config.providers));
console.log('Dexscreener config:', context.config.providers.dexscreener);
console.log('');

// Create provider
const createProvider = require('./src/data/providers/dexscreenerProvider.js');
const provider = createProvider(context);

console.log('Provider created:', !!provider);
console.log('Has getLatestPairs:', typeof provider.getLatestPairs);
console.log('');

// Test it
console.log('Calling getLatestPairs()...\n');
provider.getLatestPairs('solana', 10)
  .then(tokens => {
    console.log('\n✅ SUCCESS!');
    console.log(`Found ${tokens.length} tokens`);
    if (tokens.length > 0) {
      console.log('\nFirst token:');
      console.log(JSON.stringify(tokens[0], null, 2));
    }
  })
  .catch(err => {
    console.error('\n❌ ERROR:', err.message);
    console.error(err.stack);
  });
