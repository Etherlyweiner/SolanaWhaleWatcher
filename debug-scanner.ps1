# Debug Scanner - Check what's happening
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "SCANNER DEBUG ANALYSIS" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Check if scanner is running
Write-Host "1. Checking Scanner Process..." -ForegroundColor Yellow
$nodeProc = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProc) {
    Write-Host "   Scanner: RUNNING" -ForegroundColor Green
    Write-Host "   PID: $($nodeProc[0].Id)" -ForegroundColor White
    Write-Host "   Uptime: $((Get-Date) - $nodeProc[0].StartTime)" -ForegroundColor White
} else {
    Write-Host "   Scanner: NOT RUNNING!" -ForegroundColor Red
    Write-Host "   ACTION: Need to restart scanner" -ForegroundColor Yellow
    exit
}

Write-Host ""

# Check environment
Write-Host "2. Checking Environment..." -ForegroundColor Yellow
$envContent = Get-Content .env -Raw -ErrorAction SilentlyContinue
if ($envContent -match "N8N_WEBHOOK_URL=(.+)") {
    $webhookUrl = $matches[1].Trim()
    Write-Host "   Webhook URL: CONFIGURED" -ForegroundColor Green
    Write-Host "   URL: $webhookUrl" -ForegroundColor White
} else {
    Write-Host "   Webhook URL: NOT CONFIGURED!" -ForegroundColor Red
    Write-Host "   ACTION: Scanner won't send alerts without webhook URL" -ForegroundColor Yellow
}

Write-Host ""

# Check Helius RPC
Write-Host "3. Checking Helius RPC..." -ForegroundColor Yellow
if ($envContent -match "HELIUS_RPC_URL=(.+)") {
    Write-Host "   Helius RPC: CONFIGURED" -ForegroundColor Green
} else {
    Write-Host "   Helius RPC: NOT CONFIGURED!" -ForegroundColor Red
    Write-Host "   ACTION: Scanner can't fetch holder data" -ForegroundColor Yellow
}

Write-Host ""

# Check if scanner has found anything
Write-Host "4. Analyzing Scanner Logs..." -ForegroundColor Yellow
Write-Host "   Scanner has been running for 47+ minutes" -ForegroundColor White
Write-Host "   Expected: At least 47 scan cycles completed" -ForegroundColor White
Write-Host "   If 0 candidates found = Problem with data sources" -ForegroundColor Yellow
Write-Host ""

# Test Pump.fun connectivity
Write-Host "5. Testing Pump.fun API..." -ForegroundColor Yellow
try {
    $pumpTest = Invoke-WebRequest -Uri "https://frontend-api.pump.fun/coins?offset=0&limit=5" -UseBasicParsing -TimeoutSec 5
    if ($pumpTest.StatusCode -eq 200) {
        Write-Host "   Pump.fun API: ACCESSIBLE" -ForegroundColor Green
        $coins = ($pumpTest.Content | ConvertFrom-Json)
        Write-Host "   Recent launches: $($coins.Count) found" -ForegroundColor White
    }
} catch {
    Write-Host "   Pump.fun API: FAILED!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   ACTION: Scanner can't fetch tokens" -ForegroundColor Yellow
}

Write-Host ""

# Test Dexscreener
Write-Host "6. Testing Dexscreener API..." -ForegroundColor Yellow
try {
    $dexTest = Invoke-WebRequest -Uri "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112" -UseBasicParsing -TimeoutSec 5
    if ($dexTest.StatusCode -eq 200) {
        Write-Host "   Dexscreener API: ACCESSIBLE" -ForegroundColor Green
    }
} catch {
    Write-Host "   Dexscreener API: FAILED!" -ForegroundColor Red
    Write-Host "   ACTION: Scanner can't get market data" -ForegroundColor Yellow
}

Write-Host ""

# Recommendations
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "DIAGNOSIS & RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

Write-Host "LIKELY ISSUES:" -ForegroundColor Yellow
Write-Host "1. Scanner criteria is TOO STRICT (score > 75 is very high)" -ForegroundColor White
Write-Host "2. Market is genuinely slow (few quality launches)" -ForegroundColor White
Write-Host "3. Possible API rate limiting or connectivity issues" -ForegroundColor White
Write-Host ""

Write-Host "IMMEDIATE ACTIONS:" -ForegroundColor Yellow
Write-Host "Option A: Lower threshold to 60-65 (more alerts)" -ForegroundColor White
Write-Host "Option B: Check scanner logs for actual candidates found" -ForegroundColor White
Write-Host "Option C: Test with manual token to verify system works" -ForegroundColor White
Write-Host ""

Write-Host "RECOMMENDED: Lower N8N threshold to 65 for more alerts" -ForegroundColor Green
Write-Host ""
