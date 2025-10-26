# Test different Pump.fun API endpoints
Write-Host "Testing Pump.fun API Endpoints..." -ForegroundColor Cyan
Write-Host ""

$endpoints = @(
    "https://pump.fun/api/browse/new?limit=5&offset=0",
    "https://frontend-api.pump.fun/coins?offset=0&limit=5",
    "https://frontend-api.pump.fun/coins?sort=created_timestamp&order=DESC&offset=0&limit=5",
    "https://client-api-2-74b1891ee9f9.herokuapp.com/coins?offset=0&limit=5"
)

foreach ($url in $endpoints) {
    Write-Host "Testing: $url" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -Headers @{
            "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            "Accept" = "application/json"
        }
        
        if ($response.StatusCode -eq 200) {
            Write-Host "  SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
            $data = $response.Content | ConvertFrom-Json
            
            if ($data.coins) {
                Write-Host "  Found: $($data.coins.Count) coins" -ForegroundColor White
            } elseif ($data) {
                Write-Host "  Response has data" -ForegroundColor White
            }
            
            Write-Host "  WORKING ENDPOINT FOUND!" -ForegroundColor Green
            Write-Host "  Use this URL in config" -ForegroundColor White
            Write-Host ""
            break
        }
    } catch {
        Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host ""
Write-Host "If a working endpoint was found, update .env with:" -ForegroundColor Yellow
Write-Host "PUMPFUN_BASE_URL=<working-url>" -ForegroundColor White
