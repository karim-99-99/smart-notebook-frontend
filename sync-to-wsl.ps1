# Sync Windows path changes to WSL path
# This ensures both paths have the same code

Write-Host "🔄 Syncing Windows path -> WSL path..." -ForegroundColor Cyan

$winPath = "C:\Users\DELL\SmartNotebook"
$wslPath = "\\wsl.localhost\Ubuntu\home\karim\smart-notebook"

# Files to sync (source files that were edited)
$filesToSync = @(
    # Navigation fixes
    "mobile\src\screens\PreviewScreen.tsx",
    "mobile\src\screens\EditNoteScreen.tsx",
    "mobile\src\navigation\AppNavigator.tsx",
    
    # Android Gradle configs
    "android\build.gradle",
    "android\settings.gradle",
    "android\app\build.gradle",
    "android\gradle\wrapper\gradle-wrapper.properties",
    "android\gradle\libs.versions.toml",
    "android\gradle.properties",
    "android\app\build.gradle.kts"
)

$syncedCount = 0
$failedCount = 0

foreach ($file in $filesToSync) {
    $sourceFile = Join-Path $winPath $file
    $destFile = Join-Path $wslPath $file
    
    if (Test-Path $sourceFile) {
        try {
            $destDir = Split-Path $destFile -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            Copy-Item -Path $sourceFile -Destination $destFile -Force
            Write-Host "  ✅ $file" -ForegroundColor Green
            $syncedCount++
        } catch {
            Write-Host "  ❌ Failed: $file - $_" -ForegroundColor Red
            $failedCount++
        }
    } else {
        Write-Host "  ⚠️  Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Synced: $syncedCount files" -ForegroundColor Green
if ($failedCount -gt 0) {
    Write-Host "   ❌ Failed: $failedCount files" -ForegroundColor Red
}

Write-Host "`n✅ Sync complete!" -ForegroundColor Green
