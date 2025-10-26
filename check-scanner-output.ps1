# Check if scanner is finding candidates now
Write-Host "Scanner Status Check" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Get Node process
$proc = Get-Process -Name node -ErrorAction SilentlyContinue | Select -First 1
if ($proc) {
    $uptime = (Get-Date) - $proc.StartTime
    Write-Host "Scanner Process:" -ForegroundColor Yellow
    Write-Host "  Status: RUNNING" -ForegroundColor Green
    Write-Host "  PID: $($proc.Id)" -ForegroundColor White
    Write-Host "  Uptime: $($uptime.ToString('hh\:mm\:ss'))" -ForegroundColor White
    Write-Host "  Memory: $([math]::Round($proc.WorkingSet64/1MB, 2)) MB" -ForegroundColor White
} else {
    Write-Host "Scanner: NOT RUNNING" -ForegroundColor Red
    exit
}

Write-Host ""

# Test Dexscreener API directly
Write-Host "Testing Dexscreener API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://api.dexscreener.com/latest/dex/pairs/solana" -UseBasicParsing -TimeoutSec 5
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.pairs) {
        Write-Host "  Dexscreener: WORKING" -ForegroundColor Green
        Write-Host "  Latest pairs found: $($data.pairs.Count)" -ForegroundColor White
        
        # Show first few pairs
        Write-Host ""
        Write-Host "  Recent tokens:" -ForegroundColor Yellow
        $data.pairs | Select -First 5 | ForEach-Object {
            $symbol = $_.baseToken.symbol
            $mint = $_.baseToken.address
            $liq = [math]::Round($_.liquidity.usd, 0)
            $age = if ($_.pairCreatedAt) {
                $created = [DateTime]::Parse($_.pairCreatedAt)
                $ageMin = ((Get-Date) - $created).TotalMinutes
                "$([math]::Round($ageMin, 1)) min"
            } else { "Unknown" }
            
            Write-Host "    $symbol | Liq: `$$liq | Age: $age" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "  Scanner SHOULD be finding these tokens now!" -ForegroundColor Green
    }
} catch {
    Write-Host "  Dexscreener: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Scanner is using Dexscreener (Pump.fun bypassed)" -ForegroundColor White
Write-Host "2. Should see candidates in next scan cycle" -ForegroundColor White
Write-Host "3. If score > 75, alert will go to Discord" -ForegroundColor White
Write-Host "4. Check N8N executions: http://localhost:5678" -ForegroundColor White
Write-Host ""
