# Check N8N execution to see what data was received
Write-Host "Opening N8N to check execution data..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Manual Steps:" -ForegroundColor Yellow
Write-Host "1. Open: http://localhost:5678" -ForegroundColor White
Write-Host "2. Click 'Executions' in left sidebar" -ForegroundColor White
Write-Host "3. Click the most recent execution" -ForegroundColor White
Write-Host "4. Click on 'Webhook' node" -ForegroundColor White
Write-Host "5. Check the OUTPUT tab - this shows what data N8N received" -ForegroundColor White
Write-Host ""
Write-Host "Look for the JSON structure - does it have:" -ForegroundColor Yellow
Write-Host "  - body.mint or just mint?" -ForegroundColor White
Write-Host "  - body.score or just score?" -ForegroundColor White
Write-Host "  - body.data or just data?" -ForegroundColor White
Write-Host ""
Write-Host "If data is nested under 'body', we need to update the workflow" -ForegroundColor Yellow

# Also try to curl the webhook with verbose output
Write-Host ""
Write-Host "Testing webhook with verbose output..." -ForegroundColor Cyan

$testData = @{
    mint = "So11111111111111111111111111111111111111112"
    symbol = "SOL-TEST"
    score = 88
    reasons = @("Test 1", "Test 2")
    data = @{
        market = @{
            priceUsd = 150.50
            liquidityUsd = 5000000
            volume24hUsd = 10000000
        }
        holder = @{
            topFiveShare = 0.25
            totalHolders = 50000
        }
        launch = @{
            ageMinutes = 5
            rugScore = 10
            liquidityUsd = 5000000
        }
    }
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json -Depth 10

Write-Host "Sending test payload..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/whale-watcher" -Method POST -Body $testData -ContentType "application/json" -UseBasicParsing
    Write-Host "Response: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now check N8N executions to see if this data shows correctly!" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
