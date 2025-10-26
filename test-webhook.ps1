# Test N8N Webhook Connection
$webhookUrl = "http://localhost:5678/webhook/whale-watcher"
$testData = Get-Content "test-webhook.json" -Raw

Write-Host "Sending test data to N8N webhook..."
Write-Host "URL: $webhookUrl"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $webhookUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $testData `
        -UseBasicParsing
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
    Write-Host ""
    Write-Host "Check N8N Executions panel to see the workflow run!"
    Write-Host "Check Discord for the alert message!"
} catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Make sure:"
    Write-Host "1. N8N is running: docker ps"
    Write-Host "2. Workflow is imported and Active"
    Write-Host "3. Webhook path is correct: /webhook/whale-watcher"
}
