# Verify N8N Workflow Setup
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "N8N WORKFLOW VERIFICATION" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Step 1: Check N8N is running
Write-Host "Step 1: Checking N8N Container..." -ForegroundColor Yellow
try {
    $n8nStatus = docker ps --filter "name=n8n" --format "{{.Status}}"
    if ($n8nStatus) {
        Write-Host "  N8N Container: RUNNING" -ForegroundColor Green
        Write-Host "  Status: $n8nStatus" -ForegroundColor White
    } else {
        Write-Host "  N8N Container: NOT RUNNING" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ERROR: Docker not accessible" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check webhook endpoint
Write-Host "Step 2: Testing Webhook Endpoint..." -ForegroundColor Yellow
try {
    $webhookTest = Invoke-WebRequest -Uri "http://localhost:5678/webhook/whale-watcher" -Method POST -ContentType "application/json" -Body '{"test":"ping"}' -UseBasicParsing -TimeoutSec 5
    
    if ($webhookTest.StatusCode -eq 200) {
        Write-Host "  Webhook Status: WORKING" -ForegroundColor Green
        Write-Host "  Response: $($webhookTest.Content)" -ForegroundColor White
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "  Webhook Status Code: $statusCode" -ForegroundColor Yellow
    
    if ($statusCode -eq 404) {
        Write-Host "  ERROR: Webhook path not found!" -ForegroundColor Red
        Write-Host "  This means the workflow is NOT active or NOT imported" -ForegroundColor Red
    } elseif ($statusCode -eq 500) {
        Write-Host "  WARNING: Webhook exists but returned error" -ForegroundColor Yellow
        Write-Host "  This may mean workflow has issues" -ForegroundColor Yellow
    } else {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Step 3: Test with full payload
Write-Host "Step 3: Testing with Sample Token Data..." -ForegroundColor Yellow

$testPayload = @{
    mint = "TestMintAddress123"
    symbol = "TEST"
    score = 85
    reasons = @("Test reason 1", "Test reason 2")
    data = @{
        market = @{
            priceUsd = 0.05
            liquidityUsd = 50000
            volume24hUsd = 125000
        }
        holder = @{
            topFiveShare = 0.185
            totalHolders = 1234
        }
        launch = @{
            ageMinutes = 10
            rugScore = 15
        }
    }
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/whale-watcher" -Method POST -ContentType "application/json" -Body $testPayload -UseBasicParsing -TimeoutSec 5
    
    Write-Host "  Test Payload: SENT" -ForegroundColor Green
    Write-Host "  Response Code: $($response.StatusCode)" -ForegroundColor White
    Write-Host "  Response: $($response.Content)" -ForegroundColor White
    
    if ($response.StatusCode -eq 200) {
        Write-Host ""
        Write-Host "  SUCCESS! Workflow received the data!" -ForegroundColor Green
        Write-Host "  - Check N8N Executions to see workflow run" -ForegroundColor White
        Write-Host "  - Check Discord for alert (if score > 75)" -ForegroundColor White
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open N8N: http://localhost:5678" -ForegroundColor White
Write-Host "2. Click 'Executions' (left sidebar)" -ForegroundColor White
Write-Host "3. You should see test workflow runs" -ForegroundColor White
Write-Host "4. Click an execution to see data flow" -ForegroundColor White
Write-Host "5. Check Discord for test alert" -ForegroundColor White
Write-Host ""
