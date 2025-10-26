# Check Scanner Status - Look for Errors and Success
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "SCANNER STATUS CHECK" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking for recent errors..." -ForegroundColor Yellow

# Run a quick scan cycle and capture output
$output = npm run scan -- --interval=0 2>&1 | Out-String

# Check for specific errors
$hasPropertyError = $output -match "Cannot read properties of undefined"
$hasDexscreenerError = $output -match "Failed to fetch market data"
$hasPumpfunError = $output -match "Failed to fetch launch data"
$hasHolderError = $output -match "Failed to fetch holder data"

Write-Host ""
if ($hasPropertyError) {
    Write-Host "âŒ Still seeing 'Cannot read properties of undefined' errors" -ForegroundColor Red
} else {
    Write-Host "âœ… No 'Cannot read properties of undefined' errors!" -ForegroundColor Green
}

if ($hasDexscreenerError) {
    Write-Host "âš  Dexscreener fetch warnings present (may be normal)" -ForegroundColor Yellow
} else {
    Write-Host "âœ… No Dexscreener errors" -ForegroundColor Green
}

if ($hasPumpfunError) {
    Write-Host "âš  Pump.fun fetch warnings present (expected - API down)" -ForegroundColor Yellow
} else {
    Write-Host "âœ… No Pump.fun errors" -ForegroundColor Green
}

if ($hasHolderError) {
    Write-Host "âš  Holder data fetch warnings present" -ForegroundColor Yellow
} else {
    Write-Host "âœ… No holder data errors" -ForegroundColor Green
}

Write-Host ""
Write-Host "Checking scan results..." -ForegroundColor Yellow

if ($output -match '"candidates":(\d+)') {
    $candidates = $Matches[1]
    Write-Host "âœ… Found $candidates candidates" -ForegroundColor Green
} else {
    Write-Host "âŒ No candidates found" -ForegroundColor Red
}

if ($output -match '"flagged":(\d+)') {
    $flagged = $Matches[1]
    if ($flagged -gt 0) {
        Write-Host "đŸŽ‰ FLAGGED: $flagged tokens sent to Discord!" -ForegroundColor Green
    } else {
        Write-Host "âš  No tokens flagged yet (score < 60)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Full output saved to scanner-status.log" -ForegroundColor White
$output | Out-File -FilePath "scanner-status.log" -Encoding UTF8
