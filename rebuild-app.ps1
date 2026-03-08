# Rebuild Smart Notebook App - Fixes Gradle cache and rebuilds
Write-Host "🔧 Fixing Gradle cache and rebuilding app..." -ForegroundColor Cyan

# Step 1: Stop Gradle daemon
Write-Host "`n1. Stopping Gradle daemon..." -ForegroundColor Yellow
cd C:\Users\DELL\SmartNotebook\android
.\gradlew --stop 2>$null

# Step 2: Delete corrupted cache
Write-Host "2. Cleaning corrupted Gradle cache..." -ForegroundColor Yellow
$cachePath = "$env:USERPROFILE\.gradle\caches\8.13\transforms\ab9f8198d58bc47ced068fac434192c3"
if (Test-Path $cachePath) {
    Remove-Item -Recurse -Force $cachePath -ErrorAction SilentlyContinue
    Write-Host "   ✅ Deleted corrupted cache" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Cache already cleaned" -ForegroundColor Gray
}

# Step 3: Clean build
Write-Host "3. Cleaning build..." -ForegroundColor Yellow
.\gradlew clean

# Step 4: Rebuild
Write-Host "`n4. Rebuilding app..." -ForegroundColor Yellow
.\gradlew assembleDebug

Write-Host "`n✅ Done! Now:" -ForegroundColor Green
Write-Host "   - In Android Studio: Run the app (Shift+F10)" -ForegroundColor White
Write-Host "   - On device: Shake → Reload to refresh JavaScript bundle" -ForegroundColor White
