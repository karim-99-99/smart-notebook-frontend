# Copy all updated files from WSL to Windows path
# Run this from Windows PowerShell in: C:\Users\DELL\SmartNotebook\mobile

Write-Host "📋 Copying all updated files to Windows path..." -ForegroundColor Cyan
Write-Host ""

# Define paths
$wslBasePath = "\\wsl.localhost\Ubuntu\home\karim\smart-notebook\mobile"
$windowsBasePath = "C:\Users\DELL\SmartNotebook\mobile"

# Check if WSL path is accessible
if (-not (Test-Path $wslBasePath)) {
    Write-Host "❌ Error: Cannot access WSL path: $wslBasePath" -ForegroundColor Red
    Write-Host "Please make sure WSL is running." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Copy files manually from:" -ForegroundColor Yellow
    Write-Host "  WSL: \\wsl.localhost\Ubuntu\home\karim\smart-notebook\mobile" -ForegroundColor White
    Write-Host "  To: C:\Users\DELL\SmartNotebook\mobile" -ForegroundColor White
    exit 1
}

# Files to copy with their paths
$filesToCopy = @(
    @{
        Source = "$wslBasePath\src\lib\supabase.ts"
        Destination = "$windowsBasePath\src\lib\supabase.ts"
        Description = "Supabase client configuration"
    },
    @{
        Source = "$wslBasePath\src\screens\LoginScreen.tsx"
        Destination = "$windowsBasePath\src\screens\LoginScreen.tsx"
        Description = "Login screen with connection test"
    },
    @{
        Source = "$wslBasePath\index.js"
        Destination = "$windowsBasePath\index.js"
        Description = "App entry point with URL polyfill"
    },
    @{
        Source = "$wslBasePath\package.json"
        Destination = "$windowsBasePath\package.json"
        Description = "Package.json with react-native-url-polyfill"
    }
)

$successCount = 0
$failCount = 0

# Copy each file
foreach ($file in $filesToCopy) {
    $source = $file.Source
    $destination = $file.Destination
    $description = $file.Description
    
    Write-Host "📄 Copying: $description" -ForegroundColor Yellow
    Write-Host "   From: $source" -ForegroundColor Gray
    Write-Host "   To:   $destination" -ForegroundColor Gray
    
    # Create destination directory if it doesn't exist
    $destDir = Split-Path -Parent $destination
    if (-not (Test-Path $destDir)) {
        try {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            Write-Host "   ✓ Created directory: $destDir" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Failed to create directory: $destDir" -ForegroundColor Red
            $failCount++
            Write-Host ""
            continue
        }
    }
    
    # Copy file
    if (Test-Path $source) {
        try {
            Copy-Item -Path $source -Destination $destination -Force
            Write-Host "   ✓ Copied successfully" -ForegroundColor Green
            $successCount++
        } catch {
            Write-Host "   ❌ Copy failed: $_" -ForegroundColor Red
            $failCount++
        }
    } else {
        Write-Host "   ❌ Source file not found: $source" -ForegroundColor Red
        $failCount++
    }
    Write-Host ""
}

# Summary
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  ✓ Successfully copied: $successCount files" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "  ❌ Failed: $failCount files" -ForegroundColor Red
}
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($successCount -eq $filesToCopy.Count) {
    Write-Host "✅ All files copied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Install the new package:" -ForegroundColor White
    Write-Host "      npm install react-native-url-polyfill" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   2. Rebuild the app:" -ForegroundColor White
    Write-Host "      npx react-native run-android" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "⚠️  Some files failed to copy. Please copy them manually." -ForegroundColor Yellow
    Write-Host ""
}

