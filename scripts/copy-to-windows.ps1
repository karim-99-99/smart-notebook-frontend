# Copy updated files from WSL to Windows path
# Run this script from: C:\Users\DELL\SmartNotebook\mobile (Windows PowerShell)

Write-Host "📋 Copying updated files to Windows path..." -ForegroundColor Cyan
Write-Host ""

# Define paths
$wslPath = "\\wsl.localhost\Ubuntu\home\karim\smart-notebook\mobile"
$windowsPath = "C:\Users\DELL\SmartNotebook\mobile"

# Check if WSL path is accessible
if (-not (Test-Path $wslPath)) {
    Write-Host "❌ Error: Cannot access WSL path: $wslPath" -ForegroundColor Red
    Write-Host "Please make sure WSL is running and the path is correct." -ForegroundColor Yellow
    exit 1
}

# Files to copy
$filesToCopy = @(
    @{
        Source = "$wslPath\src\lib\supabase.ts"
        Destination = "$windowsPath\src\lib\supabase.ts"
        Description = "Supabase client configuration"
    },
    @{
        Source = "$wslPath\index.js"
        Destination = "$windowsPath\index.js"
        Description = "App entry point with URL polyfill"
    },
    @{
        Source = "$wslPath\package.json"
        Destination = "$windowsPath\package.json"
        Description = "Package.json with react-native-url-polyfill"
    }
)

# Copy each file
foreach ($file in $filesToCopy) {
    $source = $file.Source
    $destination = $file.Destination
    $description = $file.Description
    
    Write-Host "📄 Copying: $description" -ForegroundColor Yellow
    
    # Create destination directory if it doesn't exist
    $destDir = Split-Path -Parent $destination
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        Write-Host "   ✓ Created directory: $destDir" -ForegroundColor Green
    }
    
    # Copy file
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $destination -Force
        Write-Host "   ✓ Copied successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Source file not found: $source" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "✅ File copy completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Install the new package: npm install react-native-url-polyfill" -ForegroundColor White
Write-Host "   2. Rebuild the app: npx react-native run-android" -ForegroundColor White
Write-Host ""
