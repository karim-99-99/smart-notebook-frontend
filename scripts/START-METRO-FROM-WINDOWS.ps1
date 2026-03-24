# ALWAYS start Metro from the WINDOWS project folder to fix "Metro run from wrong folder"
# Run this script from anywhere - it will use the correct folder and kill wrong Metro.

$metroDir = "C:\Users\DELL\SmartNotebook\mobile"
$port = 8082

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Start Metro from CORRECT folder" -ForegroundColor Cyan
Write-Host "  $metroDir" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any process already using Metro port (wrong instance)
try {
    $found = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
} catch {
    $found = $null
}
if (-not $found -and (Get-Command netstat -ErrorAction SilentlyContinue)) {
    $line = netstat -ano | Select-String ":$port\s"
    if ($line) { $found = ($line -split '\s+')[-1] }
}
if ($found) {
    Write-Host "Stopping existing process on port $port (wrong Metro)..." -ForegroundColor Yellow
    $found | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
    Write-Host "Done. Starting Metro from correct folder." -ForegroundColor Green
    Write-Host ""
}

Set-Location $metroDir
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found in $metroDir" -ForegroundColor Red
    exit 1
}

Write-Host "Starting Metro from: $metroDir" -ForegroundColor Green
Write-Host "Keep this window open. Run the app in another terminal." -ForegroundColor Gray
Write-Host ""
npm run start
