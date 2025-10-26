# Add N8N Webhook URL to .env file
$envFile = ".env"
$webhookLine = "N8N_WEBHOOK_URL=http://localhost:5678/webhook/whale-watcher"

# Check if line already exists
$content = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
if ($content -match "N8N_WEBHOOK_URL=") {
    Write-Host "✅ N8N_WEBHOOK_URL already exists in .env - updating it..."
    $newContent = $content -replace "N8N_WEBHOOK_URL=.*", $webhookLine
    Set-Content -Path $envFile -Value $newContent -NoNewline
} else {
    Write-Host "✅ Adding N8N_WEBHOOK_URL to .env..."
    Add-Content -Path $envFile -Value "`n$webhookLine"
}

Write-Host "✅ Done! Webhook URL added to .env"
Write-Host ""
Write-Host "Verify with: Get-Content .env | Select-String 'N8N_WEBHOOK_URL'"
