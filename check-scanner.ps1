# Check Scanner Status
Write-Host "Checking Scanner Status..." -ForegroundColor Cyan
Write-Host ""

# Check if Node process is running
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Scanner Process: RUNNING" -ForegroundColor Green
    Write-Host "  Process ID: $($nodeProcesses[0].Id)" -ForegroundColor White
    Write-Host "  Memory Usage: $([math]::Round($nodeProcesses[0].WorkingSet64/1MB, 2)) MB" -ForegroundColor White
    Write-Host "  CPU Time: $($nodeProcesses[0].TotalProcessorTime)" -ForegroundColor White
} else {
    Write-Host "Scanner Process: NOT RUNNING" -ForegroundColor Red
}

Write-Host ""

# Check N8N container
Write-Host "Checking N8N Container..." -ForegroundColor Cyan
docker ps --filter "name=n8n" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""

# Test webhook connectivity
Write-Host "Testing Webhook Connection..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678" -Method GET -UseBasicParsing -TimeoutSec 3
    Write-Host "N8N Web Interface: ACCESSIBLE" -ForegroundColor Green
} catch {
    Write-Host "N8N Web Interface: NOT ACCESSIBLE" -ForegroundColor Red
}

Write-Host ""
Write-Host "Recommendations:" -ForegroundColor Yellow
Write-Host "1. Scanner is running - it may take time to find qualifying tokens" -ForegroundColor White
Write-Host "2. Current threshold: score > 75 (very selective)" -ForegroundColor White
Write-Host "3. Check N8N executions: http://localhost:5678" -ForegroundColor White
Write-Host "4. Consider lowering threshold to 65-70 for more alerts" -ForegroundColor White
