Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "N8N QUEUE CHECK" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

Write-Host "Old alert timestamp: 2025-10-26T23:41:22.172Z" -ForegroundColor Red
Write-Host "Scanner restarted:   2025-10-26T23:46:00.000Z" -ForegroundColor Green
Write-Host ""
Write-Host "This alert was sent BEFORE the fix!" -ForegroundColor Yellow
Write-Host ""

Write-Host "Checking if N8N has pending executions..." -ForegroundColor Cyan
Write-Host ""

Write-Host "ACTION NEEDED:" -ForegroundColor Yellow
Write-Host "1. Open N8N: http://localhost:5678" -ForegroundColor White
Write-Host "2. Click 'Executions' in left sidebar" -ForegroundColor White
Write-Host "3. Look for executions after 23:46 (11:46 PM)" -ForegroundColor White
Write-Host "4. Any new executions should have COMPLETE data" -ForegroundColor White
Write-Host ""

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "WHAT TO EXPECT" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "Old alerts (before 23:46):" -ForegroundColor Red
Write-Host "  - May have '???' symbol" -ForegroundColor Gray
Write-Host "  - May have N/A data" -ForegroundColor Gray
Write-Host "  - These were from broken code" -ForegroundColor Gray
Write-Host ""
Write-Host "New alerts (after 23:46):" -ForegroundColor Green
Write-Host "  - Will have real symbol" -ForegroundColor Gray
Write-Host "  - Will have price, volume, liquidity" -ForegroundColor Gray
Write-Host "  - DEX Screener links will work" -ForegroundColor Gray
Write-Host ""

Write-Host "Current time: $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')" -ForegroundColor Cyan
Write-Host "Scanner has been running for: $([math]::Round(((Get-Date) - [DateTime]'2025-10-26T23:46:00Z').TotalMinutes, 1)) minutes" -ForegroundColor Cyan
Write-Host ""

Write-Host "No alerts sent yet because:" -ForegroundColor Yellow
Write-Host "  - Scanner found 19 candidates" -ForegroundColor Gray
Write-Host "  - 0 had complete market data" -ForegroundColor Gray
Write-Host "  - Validation rejected them (correct!)" -ForegroundColor Gray
Write-Host ""

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "NEXT 30 MINUTES" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "Monitor Discord for new alerts:" -ForegroundColor White
Write-Host "  - Any alert after $(Get-Date -Format 'HH:mm') should be GOOD" -ForegroundColor Green
Write-Host "  - If you see '???' after $(Get-Date -Format 'HH:mm'), report it!" -ForegroundColor Red
Write-Host ""
