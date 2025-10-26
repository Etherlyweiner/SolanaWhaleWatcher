# Test Dexscreener token-profiles endpoint
try {
    $response = Invoke-WebRequest -Uri "https://api.dexscreener.com/token-profiles/latest/v1" -UseBasicParsing -TimeoutSec 5
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Total items: $($data.Count)" -ForegroundColor White
    Write-Host ""
    
    $solanaTokens = $data | Where-Object { $_.chainId -eq 'solana' }
    Write-Host "Solana tokens: $($solanaTokens.Count)" -ForegroundColor Yellow
    
    if ($solanaTokens.Count -gt 0) {
        Write-Host ""
        Write-Host "First 3 Solana tokens:" -ForegroundColor Cyan
        $solanaTokens | Select-Object -First 3 | ForEach-Object {
            Write-Host "  Address: $($_.tokenAddress)"
            Write-Host "  Description: $($_.description)"
            Write-Host ""
        }
    } else {
        Write-Host "NO SOLANA TOKENS FOUND!" -ForegroundColor Red
        Write-Host "This endpoint may not be suitable for our use case" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
