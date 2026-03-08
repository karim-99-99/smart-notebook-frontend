# Fix NDK source.properties missing file
# This creates the missing source.properties file for NDK 25.1.8937393

$ndkPath = "$env:LOCALAPPDATA\Android\Sdk\ndk\25.1.8937393"
$sourcePropertiesPath = "$ndkPath\source.properties"

Write-Host "🔧 Fixing NDK source.properties..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ndkPath)) {
    Write-Host "❌ NDK directory not found at: $ndkPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install NDK 25.1.8937393 first:" -ForegroundColor Yellow
    Write-Host "1. Open Android Studio" -ForegroundColor White
    Write-Host "2. Go to Tools > SDK Manager > SDK Tools" -ForegroundColor White
    Write-Host "3. Check 'NDK (Side by side)' and select version 25.1.8937393" -ForegroundColor White
    Write-Host "4. Click Apply" -ForegroundColor White
    exit 1
}

if (Test-Path $sourcePropertiesPath) {
    Write-Host "✓ source.properties already exists" -ForegroundColor Green
    exit 0
}

Write-Host "Creating missing source.properties file..." -ForegroundColor Yellow

# Create the source.properties file content
$sourcePropertiesContent = @"
Pkg.Desc=Android NDK
Pkg.Revision=25.1.8937393
"@

try {
    # Create directory if it doesn't exist
    if (-not (Test-Path $ndkPath)) {
        New-Item -ItemType Directory -Path $ndkPath -Force | Out-Null
    }
    
    # Write the source.properties file
    $sourcePropertiesContent | Out-File -FilePath $sourcePropertiesPath -Encoding ASCII -NoNewline
    
    Write-Host "✓ Created source.properties file" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now try building again:" -ForegroundColor Cyan
    Write-Host "  cd android" -ForegroundColor White
    Write-Host "  .\gradlew clean" -ForegroundColor White
    Write-Host "  cd .." -ForegroundColor White
    Write-Host "  npm run android" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to create source.properties: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please manually create the file at:" -ForegroundColor Yellow
    Write-Host "  $sourcePropertiesPath" -ForegroundColor White
    Write-Host ""
    Write-Host "With content:" -ForegroundColor Yellow
    Write-Host "  Pkg.Desc=Android NDK" -ForegroundColor White
    Write-Host "  Pkg.Revision=25.1.8937393" -ForegroundColor White
    exit 1
}




