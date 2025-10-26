# Open Scanner Terminal with Visible Logs
Write-Host "Opening scanner in new terminal window..." -ForegroundColor Cyan

# Start scanner in a new visible PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd 'c:\Users\Jonat\SolanaWhaleWatcher'
Write-Host '=' * 70 -ForegroundColor Cyan
Write-Host 'SOLANA WHALE WATCHER - SCANNER' -ForegroundColor Cyan
Write-Host '=' * 70 -ForegroundColor Cyan
Write-Host ''
Write-Host 'Scanner Status: STARTING...' -ForegroundColor Yellow
Write-Host 'Scan Interval: 60 seconds' -ForegroundColor White
Write-Host ''
Write-Host 'What to watch for:' -ForegroundColor Yellow
Write-Host '  candidates: 20-30  = Finding tokens' -ForegroundColor Green
Write-Host '  flagged: 0         = No alerts yet' -ForegroundColor White
Write-Host '  flagged: 1+        = Alert sent to Discord!' -ForegroundColor Green
Write-Host ''
Write-Host 'Starting scanner...' -ForegroundColor Cyan
Write-Host ''
npm run scan -- --interval=60
"@

Write-Host ""
Write-Host "✅ Scanner terminal opened!" -ForegroundColor Green
Write-Host "You should see a new PowerShell window with live scanner logs." -ForegroundColor White
Write-Host ""
Write-Host "In that window, watch for:" -ForegroundColor Yellow
Write-Host "  'candidates': 22" -ForegroundColor White
Write-Host "  'flagged': 1  ← This means Discord alert sent!" -ForegroundColor Green
