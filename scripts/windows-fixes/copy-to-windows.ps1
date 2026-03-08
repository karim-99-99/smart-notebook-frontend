# Copy fixed files to Windows path
# Run this from the WINDOWS_FIXES directory

$sourceDir = $PSScriptRoot
$targetDir = "C:\Users\DELL\SmartNotebook\mobile"

Write-Host "📋 Copying fixed files to Windows path..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $targetDir)) {
    Write-Host "❌ Error: Target directory not found: $targetDir" -ForegroundColor Red
    exit 1
}

$files = @(
    "index.js",
    "metro.config.js",
    "package.json"
)

foreach ($file in $files) {
    $source = Join-Path $sourceDir $file
    $destination = Join-Path $targetDir $file
    
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $destination -Force
        Write-Host "✓ Copied $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Source file not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Files copied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Next steps:" -ForegroundColor Cyan
Write-Host "   1. cd C:\Users\DELL\SmartNotebook\mobile" -ForegroundColor White
Write-Host "   2. npm install" -ForegroundColor White
Write-Host "   3. npx react-native start --reset-cache" -ForegroundColor White
Write-Host "   4. (In another terminal) npx react-native run-android" -ForegroundColor White

