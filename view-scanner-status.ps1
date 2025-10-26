# Quick Scanner Status Viewer
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "SCANNER STATUS - LIVE" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Check if scanner is running
$scanner = Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object -First 1
if ($scanner) {
    Write-Host "Scanner Status: RUNNING (PID: $($scanner.Id))" -ForegroundColor Green
} else {
    Write-Host "Scanner Status: NOT RUNNING" -ForegroundColor Red
}

Write-Host ""
Write-Host "Recent scan activity:" -ForegroundColor Yellow
Write-Host ""

# Run a quick test to see current status
$testOutput = npm run scan -- --interval=0 2>&1 | Select-String -Pattern "candidates|flagged|Scan cycle complete" | Select-Object -Last 3

if ($testOutput) {
    $testOutput | ForEach-Object {
        if ($_ -match "flagged") {
            Write-Host $_ -ForegroundColor Green
        } else {
            Write-Host $_ -ForegroundColor White
        }
    }
} else {
    Write-Host "No recent scan data available" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "N8N Status: Check http://localhost:5678 -> Executions" -ForegroundColor Yellow
Write-Host "Discord: Watch for whale watcher bot alerts" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan
