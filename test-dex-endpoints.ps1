# Test various Dexscreener endpoints
Write-Host "Testing Dexscreener API Endpoints..." -ForegroundColor Cyan
Write-Host ""

$endpoints = @(
    "https://api.dexscreener.com/latest/dex/pairs/solana",
    "https://api.dexscreener.com/latest/dex/search?q=SOL",
    "https://api.dexscreener.com/token-profiles/latest/v1"
)

foreach ($url in $endpoints) {
    Write-Host "Testing: $url" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        
        if ($response.StatusCode -eq 200) {
            Write-Host "  SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
            $data = $response.Content | ConvertFrom-Json
            
            if ($data.pairs) {
                Write-Host "  Found: $($data.pairs.Count) pairs" -ForegroundColor White
                
                # Show first pair
                $first = $data.pairs[0]
                Write-Host "  Example: $($first.baseToken.symbol) - Liq: `$$([math]::Round($first.liquidity.usd))" -ForegroundColor White
            }
            Write-Host "  WORKING ENDPOINT!" -ForegroundColor Green
            break
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  FAILED: HTTP $statusCode - $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}
