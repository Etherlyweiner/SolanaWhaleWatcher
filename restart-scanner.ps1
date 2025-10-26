# Restart Scanner with Fixed Code
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "RESTARTING SCANNER WITH FIXES" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Stopping old scanner processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        $_.Kill()
        Write-Host "  Stopped process ID: $($_.Id)" -ForegroundColor Green
    } catch {
        Write-Host "  Could not stop process ID: $($_.Id)" -ForegroundColor Yellow
    }
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Step 2: Starting fresh scanner with FIXED code..." -ForegroundColor Yellow
Write-Host ""

# Start scanner in a new visible PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd 'c:\Users\Jonat\SolanaWhaleWatcher'
Write-Host '=' * 70 -ForegroundColor Cyan
Write-Host 'SOLANA WHALE WATCHER - SCANNER (FIXED CODE)' -ForegroundColor Green
Write-Host '=' * 70 -ForegroundColor Cyan
Write-Host ''
Write-Host 'Scanner Status: STARTING WITH FIXES...' -ForegroundColor Yellow
Write-Host 'Scan Interval: 60 seconds' -ForegroundColor White
Write-Host ''
Write-Host 'WATCH FOR:' -ForegroundColor Yellow
Write-Host '  âœ… No more undefined errors' -ForegroundColor Green
Write-Host '  âœ… candidates: 20-30' -ForegroundColor Green  
Write-Host '  âœ… flagged: 1+  = DISCORD ALERT!' -ForegroundColor Green
Write-Host ''
Write-Host 'Starting scanner...' -ForegroundColor Cyan
Write-Host ''
npm run scan -- --interval=60
"@

Write-Host ""
Write-Host "âœ… Scanner restarted with FIXED code!" -ForegroundColor Green
Write-Host ""
Write-Host "A new PowerShell window opened." -ForegroundColor White
Write-Host "Watch for clean logs without 'Cannot read properties' errors!" -ForegroundColor Yellow
Write-Host ""
Write-Host "If you see 'flagged: 1' or higher, CHECK DISCORD! đŸŽ‰" -ForegroundColor Green
