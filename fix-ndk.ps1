# Fix NDK Installation Issue
# This script helps fix the corrupted NDK installation

Write-Host "🔧 Fixing NDK Installation Issue..." -ForegroundColor Cyan
Write-Host ""

$ndkPath = "$env:LOCALAPPDATA\Android\Sdk\ndk\25.1.8937393"
$sourcePropertiesPath = "$ndkPath\source.properties"

Write-Host "Checking NDK installation at: $ndkPath" -ForegroundColor Yellow

if (Test-Path $ndkPath) {
    Write-Host "✓ NDK directory exists" -ForegroundColor Green
    
    if (Test-Path $sourcePropertiesPath) {
        Write-Host "✓ source.properties exists" -ForegroundColor Green
        Write-Host ""
        Write-Host "NDK appears to be correctly installed." -ForegroundColor Green
    } else {
        Write-Host "✗ source.properties is MISSING" -ForegroundColor Red
        Write-Host ""
        Write-Host "The NDK installation is corrupted. Please:" -ForegroundColor Yellow
        Write-Host "1. Open Android Studio" -ForegroundColor White
        Write-Host "2. Go to Tools > SDK Manager" -ForegroundColor White
        Write-Host "3. Click on 'SDK Tools' tab" -ForegroundColor White
        Write-Host "4. Uncheck 'NDK (Side by side)' and click Apply" -ForegroundColor White
        Write-Host "5. Check 'NDK (Side by side)' again and select version 25.1.8937393" -ForegroundColor White
        Write-Host "6. Click Apply to reinstall" -ForegroundColor White
        Write-Host ""
        Write-Host "OR use command line:" -ForegroundColor Yellow
        Write-Host "sdkmanager --uninstall 'ndk;25.1.8937393'" -ForegroundColor White
        Write-Host "sdkmanager 'ndk;25.1.8937393'" -ForegroundColor White
    }
} else {
    Write-Host "✗ NDK directory does not exist" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install NDK 25.1.8937393:" -ForegroundColor Yellow
    Write-Host "1. Open Android Studio > SDK Manager > SDK Tools" -ForegroundColor White
    Write-Host "2. Check 'NDK (Side by side)' and select version 25.1.8937393" -ForegroundColor White
    Write-Host "3. Click Apply" -ForegroundColor White
}

Write-Host ""
Write-Host "After fixing NDK, run:" -ForegroundColor Cyan
Write-Host "  cd android" -ForegroundColor White
Write-Host "  .\gradlew clean" -ForegroundColor White
Write-Host "  cd .." -ForegroundColor White
Write-Host "  npm run android" -ForegroundColor White




