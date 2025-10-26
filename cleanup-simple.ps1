# Project Cleanup Script
Write-Host "Starting Project Cleanup..." -ForegroundColor Cyan
Write-Host ""

# Create archive directories
Write-Host "Creating archive directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "docs\archive" | Out-Null
New-Item -ItemType Directory -Force -Path "n8n-workflows\archive" | Out-Null

# Phase 1: Remove Temporary Files
Write-Host ""
Write-Host "Phase 1: Removing temporary files..." -ForegroundColor Green

$tempFiles = ".env.UPDATE",".env.n8n","output.json","output2.json","output3.json","output4.json","output5.json","holders.json","holdersbalances.json","Holders_Master.json","Holders_Balances_Master.json","MasterList.json","recentchangelist.json","test-webhook.json","test-webhook.ps1","add-webhook-url.ps1","SWW.js","ReadMe.txt"

$removed = 0
$spaceFreed = 0

foreach ($file in $tempFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Remove-Item $file -Force
        $removed++
        $spaceFreed += $size
        Write-Host "  Removed: $file" -ForegroundColor Gray
    }
}

# Phase 2: Archive Old Documentation
Write-Host ""
Write-Host "Phase 2: Archiving old documentation..." -ForegroundColor Green

$docFiles = "DO_THIS_NOW.md","START_HERE.md","IMPORT_TO_N8N.md","N8N_MANUAL_SETUP.md","WEBHOOK_VERIFICATION.md","FINAL_STATUS.md"

$archived = 0

foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Move-Item $file "docs\archive\" -Force
        $archived++
        Write-Host "  Archived: $file" -ForegroundColor Gray
    }
}

# Phase 3: Archive Old Workflows
Write-Host ""
Write-Host "Phase 3: Archiving old workflows..." -ForegroundColor Green

if (Test-Path "n8n-workflows\whale-watcher-discord-alerts.json") {
    Move-Item "n8n-workflows\whale-watcher-discord-alerts.json" "n8n-workflows\archive\" -Force
    $archived++
    Write-Host "  Archived: whale-watcher-discord-alerts.json" -ForegroundColor Gray
}

if (Test-Path "n8n-workflows\whale-watcher-discord-alerts-FIXED.json") {
    Move-Item "n8n-workflows\whale-watcher-discord-alerts-FIXED.json" "n8n-workflows\archive\" -Force
    $archived++
    Write-Host "  Archived: whale-watcher-discord-alerts-FIXED.json" -ForegroundColor Gray
}

if (Test-Path "n8n-workflows\whale-watcher-simple.json") {
    Move-Item "n8n-workflows\whale-watcher-simple.json" "n8n-workflows\archive\" -Force
    $archived++
    Write-Host "  Archived: whale-watcher-simple.json" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Files Removed: $removed" -ForegroundColor White
Write-Host "  Files Archived: $archived" -ForegroundColor White
$sizeMB = [math]::Round($spaceFreed/1MB, 2)
Write-Host "  Space Freed: $sizeMB MB" -ForegroundColor White
Write-Host ""
Write-Host "Project is now production-ready!" -ForegroundColor Green
