require('dotenv').config();

console.log('='.repeat(70));
console.log('WEBHOOK CONFIGURATION CHECK');
console.log('='.repeat(70));
console.log('');

const n8nUrl = process.env.N8N_WEBHOOK_URL;
const discordUrl = process.env.DISCORD_WEBHOOK_URL;

if (n8nUrl) {
  console.log('✅ N8N_WEBHOOK_URL: SET');
  console.log('   URL:', n8nUrl);
} else {
  console.log('❌ N8N_WEBHOOK_URL: NOT SET');
  console.log('   Scanner will NOT send webhooks!');
}

console.log('');

if (discordUrl) {
  console.log('✅ DISCORD_WEBHOOK_URL: SET');
  console.log('   URL:', discordUrl.substring(0, 50) + '...');
} else {
  console.log('⚠️  DISCORD_WEBHOOK_URL: NOT SET');
  console.log('   N8N can still work, but won\'t reach Discord');
}

console.log('');
console.log('='.repeat(70));
console.log('');

if (!n8nUrl) {
  console.log('🔧 TO FIX:');
  console.log('');
  console.log('1. Set N8N_WEBHOOK_URL in your .env file:');
  console.log('   N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher');
  console.log('');
  console.log('2. Restart the scanner');
  console.log('');
}
