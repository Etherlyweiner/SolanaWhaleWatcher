# Project Cleanup Script
# Removes temporary files and archives old versions

Write-Host "🧹 Starting Project Cleanup..." -ForegroundColor Cyan
Write-Host ""

# Create archive directories
Write-Host "📁 Creating archive directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "docs\archive" | Out-Null
New-Item -ItemType Directory -Force -Path "n8n-workflows\archive" | Out-Null

# Phase 1: Remove Temporary Files
Write-Host ""
Write-Host "Phase 1: Removing temporary files..." -ForegroundColor Green

$tempFiles = @(
    ".env.UPDATE",
    ".env.n8n",
    "output.json",
    "output2.json",
    "output3.json",
    "output4.json",
    "output5.json",
    "holders.json",
    "holdersbalances.json",
    "Holders_Master.json",
    "Holders_Balances_Master.json",
    "MasterList.json",
    "recentchangelist.json",
    "test-webhook.json",
    "test-webhook.ps1",
    "add-webhook-url.ps1",
    "SWW.js",
    "ReadMe.txt"
)

$removed = 0
$spaceFreed = 0

foreach ($file in $tempFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Remove-Item $file -Force
        $removed++
        $spaceFreed += $size
        Write-Host "  ✅ Removed: $file" -ForegroundColor Gray
    }
}

# Phase 2: Archive Old Documentation
Write-Host ""
Write-Host "Phase 2: Archiving old documentation..." -ForegroundColor Green

$docFiles = @(
    "DO_THIS_NOW.md",
    "START_HERE.md",
    "IMPORT_TO_N8N.md",
    "N8N_MANUAL_SETUP.md",
    "WEBHOOK_VERIFICATION.md",
    "FINAL_STATUS.md"
)

$archived = 0

foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Move-Item $file "docs\archive\" -Force
        $archived++
        Write-Host "  📦 Archived: $file -> docs\archive\" -ForegroundColor Gray
    }
}

# Phase 3: Archive Old Workflows
Write-Host ""
Write-Host "Phase 3: Archiving old workflows..." -ForegroundColor Green

$workflowFiles = @(
    "n8n-workflows\whale-watcher-discord-alerts.json",
    "n8n-workflows\whale-watcher-discord-alerts-FIXED.json",
    "n8n-workflows\whale-watcher-simple.json"
)

foreach ($file in $workflowFiles) {
    if (Test-Path $file) {
        Move-Item $file "n8n-workflows\archive\" -Force
        $archived++
        Write-Host "  📦 Archived: $file -> n8n-workflows\archive\" -ForegroundColor Gray
    }
}

# Summary
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "  Files Removed: $removed" -ForegroundColor White
Write-Host "  Files Archived: $archived" -ForegroundColor White
Write-Host "  Space Freed: $([math]::Round($spaceFreed/1MB, 2)) MB" -ForegroundColor White
Write-Host ""
Write-Host "📁 Project Structure:" -ForegroundColor Yellow
Write-Host "  ✅ Root directory cleaned" -ForegroundColor White
Write-Host "  ✅ Old docs moved to docs\archive\" -ForegroundColor White
Write-Host "  ✅ Old workflows moved to n8n-workflows\archive\" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Project is now production-ready!" -ForegroundColor Green
Write-Host ""
