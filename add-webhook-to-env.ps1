# Add N8N Webhook URL to .env file
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "ADDING N8N WEBHOOK TO .ENV" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

$envFile = ".env"
$webhookLine = "N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher"

# Check if .env exists
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" $envFile
        Write-Host "  Copied .env.example to .env" -ForegroundColor Green
    } else {
        Write-Host "  Creating new .env file" -ForegroundColor Green
        New-Item -ItemType File -Path $envFile | Out-Null
    }
}

# Check if webhook URL already exists
$content = Get-Content $envFile -Raw
if ($content -match "N8N_WEBHOOK_URL=") {
    Write-Host "N8N_WEBHOOK_URL already exists in .env" -ForegroundColor Yellow
    Write-Host "Current value:" -ForegroundColor White
    Get-Content $envFile | Select-String "N8N_WEBHOOK_URL"
} else {
    Write-Host "Adding N8N_WEBHOOK_URL to .env..." -ForegroundColor Yellow
    Add-Content -Path $envFile -Value ""
    Add-Content -Path $envFile -Value "# N8N Webhook for scanner alerts"
    Add-Content -Path $envFile -Value $webhookLine
    Write-Host "  Added: $webhookLine" -ForegroundColor Green
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "VERIFYING CONFIGURATION" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

node check-webhook-config.js

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "NEXT STEPS" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Restart the scanner:" -ForegroundColor White
Write-Host "   Stop-Process -Name node -Force" -ForegroundColor Cyan
Write-Host "   npm run scan -- --interval=60" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Test the webhook:" -ForegroundColor White
Write-Host "   node test-with-real-token.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Check Discord for alerts!" -ForegroundColor White
Write-Host ""
