# GO TIME - Full Implementation Script
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "🚀 SOLANA WHALE WATCHER - FULL IMPLEMENTATION" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Step 1: Check N8N
Write-Host "STEP 1: Checking N8N Status..." -ForegroundColor Yellow
try {
    $n8n = Invoke-WebRequest -Uri "http://localhost:5678" -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ N8N is RUNNING (Status: $($n8n.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ N8N not responding - Start Docker Desktop first!" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "STEP 2: Import Fixed N8N Workflow" -ForegroundColor Yellow
Write-Host "   ACTION REQUIRED:" -ForegroundColor Cyan
Write-Host "   1. Open in browser: http://localhost:5678" -ForegroundColor White
Write-Host "   2. Click '+ Add workflow' (top right)" -ForegroundColor White
Write-Host "   3. Click ⋮ menu → 'Import from File'" -ForegroundColor White
Write-Host "   4. Select file: n8n-workflows\whale-watcher-discord-FIXED.json" -ForegroundColor White
Write-Host "   5. Click 'Save' then click 'Activate' toggle" -ForegroundColor White
Write-Host "   6. Go back to Workflows, deactivate the OLD workflow" -ForegroundColor White
Write-Host ""
Write-Host "   Press ENTER when workflow is imported and activated..." -ForegroundColor Yellow
$null = Read-Host

Write-Host ""
Write-Host "STEP 3: Testing Fixed Workflow..." -ForegroundColor Yellow
Write-Host "   Sending test token to N8N..." -ForegroundColor White

try {
    node test-with-real-token.js
    Write-Host ""
    Write-Host "✅ Test sent! Check Discord for alert with REAL data!" -ForegroundColor Green
    Write-Host "   Expected: Symbol=SOL, Score=85, Price=$150.25" -ForegroundColor White
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "   Did you see the alert in Discord with correct data? (y/n)" -ForegroundColor Yellow
$confirm = Read-Host
if ($confirm -ne 'y') {
    Write-Host "   Check N8N executions at http://localhost:5678 to debug" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "STEP 4: Starting Scanner with Debug Logging..." -ForegroundColor Yellow
Write-Host "   Scanner will run every 60 seconds" -ForegroundColor White
Write-Host "   Watch for: candidates count, Dexscreener activity" -ForegroundColor White
Write-Host ""
Write-Host "   Starting in 3 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🚀 LAUNCHING SCANNER..." -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Start scanner in new window so you can monitor it
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run scan -- --interval=60"

Write-Host "✅ Scanner started in new window!" -ForegroundColor Green
Write-Host ""
Write-Host "WHAT TO WATCH:" -ForegroundColor Yellow
Write-Host "  • Scanner logs: Check new PowerShell window" -ForegroundColor White
Write-Host "  • N8N executions: http://localhost:5678" -ForegroundColor White
Write-Host "  • Discord alerts: Watch for 'Whale watcher bot'" -ForegroundColor White
Write-Host ""
Write-Host "WITHIN 60 SECONDS you should see:" -ForegroundColor Cyan
Write-Host "  1. Scanner logs showing 'candidates' count" -ForegroundColor White
Write-Host "  2. N8N execution if score > 75" -ForegroundColor White
Write-Host "  3. Discord alert if token qualifies" -ForegroundColor White
Write-Host ""
Write-Host "🎉 SYSTEM OPERATIONAL! Monitoring for whale activity..." -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
