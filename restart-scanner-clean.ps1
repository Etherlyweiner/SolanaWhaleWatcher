# Restart Scanner with Clean Logs
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "RESTARTING SCANNER (Error Logs Fixed)" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Stop old scanner
Write-Host "Stopping old scanner..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "  Old processes stopped" -ForegroundColor Green

Write-Host ""
Write-Host "Starting scanner with clean logs..." -ForegroundColor Yellow
Write-Host ""

# Start new scanner
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd 'c:\Users\Jonat\SolanaWhaleWatcher'
Write-Host '=' * 70 -ForegroundColor Cyan
Write-Host 'SOLANA WHALE WATCHER - CLEAN LOGS' -ForegroundColor Green
Write-Host '=' * 70 -ForegroundColor Cyan
Write-Host ''
Write-Host 'FIXES APPLIED:' -ForegroundColor Green
Write-Host '  - Pump.fun errors: Changed to DEBUG (no more red errors)' -ForegroundColor White
Write-Host '  - Helius warnings: Changed to DEBUG (no more warnings)' -ForegroundColor White
Write-Host '  - Clean logs: Only important INFO messages shown' -ForegroundColor White
Write-Host ''
Write-Host 'Starting scanner...' -ForegroundColor Cyan
Write-Host ''
npm run scan -- --interval=60
"@

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "SCANNER RESTARTED!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "What you should see now:" -ForegroundColor Yellow
Write-Host "  - Clean 'Starting scan cycle' messages" -ForegroundColor Green
Write-Host "  - 'Discovered candidates' counts" -ForegroundColor Green
Write-Host "  - 'Scan cycle complete' summaries" -ForegroundColor Green
Write-Host "  - NO MORE red error messages!" -ForegroundColor Green
Write-Host ""
Write-Host "Watch for 'flagged: 1' = DISCORD ALERT!" -ForegroundColor Cyan
