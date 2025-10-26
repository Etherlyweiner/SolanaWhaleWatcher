# FINAL CLEANUP AND START
# This script will clean up old processes, archive old files, and start fresh

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "SOLANA WHALE WATCHER - FINAL CLEANUP AND START" -ForegroundColor Green  
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all old Node processes
Write-Host "Step 1: Stopping old Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        try {
            Stop-Process -Id $_.Id -Force
            Write-Host "  Stopped process ID: $($_.Id)" -ForegroundColor Green
        } catch {
            Write-Host "  Could not stop process ID: $($_.Id)" -ForegroundColor Yellow
        }
    }
    Write-Host "  Cleaned up $($nodeProcesses.Count) Node processes" -ForegroundColor Green
} else {
    Write-Host "  No Node processes found" -ForegroundColor Gray
}

Write-Host ""
Start-Sleep -Seconds 2

# Step 2: Archive old documentation
Write-Host "Step 2: Archiving old documentation..." -ForegroundColor Yellow

$archiveDir = "docs/archive"
if (!(Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
}

$filesToArchive = @(
    "CLEANUP_REPORT.md",
    "FINAL_STATUS_803PM.md",
    "FIX_N8N_WORKFLOW_NOW.md",
    "FIX_SUMMARY.md",
    "MASTER_STATUS_TONIGHT.md",
    "MONITORING_CHECKLIST.md",
    "NO_ALERTS_ANALYSIS.md",
    "SCANNER_FIX.md",
    "SYSTEM_STATUS.md",
    "SYSTEM_VERIFICATION.md",
    "TONIGHT_ACTION_PLAN.md"
)

$archived = 0
foreach ($file in $filesToArchive) {
    if (Test-Path $file) {
        try {
            Move-Item -Path $file -Destination "$archiveDir/$file" -Force
            Write-Host "  Archived: $file" -ForegroundColor Gray
            $archived++
        } catch {
            Write-Host "  Could not archive: $file" -ForegroundColor Yellow
        }
    }
}

Write-Host "  Archived $archived old documentation files" -ForegroundColor Green
Write-Host ""

# Step 3: Archive redundant test scripts
Write-Host "Step 3: Archiving redundant test scripts..." -ForegroundColor Yellow

$scriptsDir = "tests/archive"
if (!(Test-Path $scriptsDir)) {
    New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null
}

$scriptsToArchive = @(
    "check-scanner-output.ps1",
    "check-scanner-status.ps1",
    "check-scanner.ps1",
    "debug-scanner.ps1",
    "cleanup-simple.ps1",
    "cleanup.ps1",
    "test-dex-endpoints.ps1",
    "test-dex-profiles.ps1",
    "test-provider-direct.js",
    "test-pumpfun-api.ps1"
)

$archivedScripts = 0
foreach ($script in $scriptsToArchive) {
    if (Test-Path $script) {
        try {
            Move-Item -Path $script -Destination "$scriptsDir/$script" -Force
            Write-Host "  Archived: $script" -ForegroundColor Gray
            $archivedScripts++
        } catch {
            Write-Host "  Could not archive: $script" -ForegroundColor Yellow
        }
    }
}

Write-Host "  Archived $archivedScripts old test scripts" -ForegroundColor Green
Write-Host ""

# Step 4: Verify N8N is running
Write-Host "Step 4: Checking Docker/N8N status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  N8N is running on port 5678" -ForegroundColor Green
} catch {
    Write-Host "  WARNING: N8N may not be running!" -ForegroundColor Red
    Write-Host "  Start N8N with: docker-compose up -d" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Show next steps
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

Write-Host "CRITICAL NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. IMPORT N8N WORKFLOW (REQUIRED!)" -ForegroundColor Red
Write-Host "   - Open: http://localhost:5678" -ForegroundColor White
Write-Host "   - Click '+ Add workflow'" -ForegroundColor White
Write-Host "   - Click menu -> 'Import from File'" -ForegroundColor White  
Write-Host "   - Select: n8n-workflows/whale-watcher-discord-FIXED.json" -ForegroundColor White
Write-Host "   - Click 'Activate' toggle (make it green)" -ForegroundColor White
Write-Host "   - Click 'Save'" -ForegroundColor White
Write-Host ""

Write-Host "2. START SCANNER:" -ForegroundColor Yellow
Write-Host "   npm run scan -- --interval=60" -ForegroundColor White
Write-Host ""

Write-Host "3. TEST PIPELINE:" -ForegroundColor Yellow
Write-Host "   node test-with-real-token.js" -ForegroundColor White
Write-Host ""

Write-Host "4. WATCH FOR ALERTS:" -ForegroundColor Yellow
Write-Host "   - Scanner logs: Look for 'flagged: 1'" -ForegroundColor White
Write-Host "   - N8N: http://localhost:5678 -> Executions" -ForegroundColor White
Write-Host "   - Discord: Wait for whale watcher bot message" -ForegroundColor White
Write-Host ""

Write-Host "Expected first alert: 1-10 minutes after starting scanner" -ForegroundColor Green
Write-Host ""

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "Ready to import workflow and start scanner!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
