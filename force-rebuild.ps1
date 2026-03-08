# Force Complete Rebuild Script
Write-Host "🧹 Starting complete cache clear and rebuild..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop any running processes
Write-Host "1. Stopping Metro bundler (if running)..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Step 2: Clear Metro cache
Write-Host "2. Clearing Metro cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "$env:TEMP\metro-*" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:TEMP\haste-*" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue

# Step 3: Clear app data
Write-Host "3. Clearing app data..." -ForegroundColor Yellow
adb shell pm clear com.smartnotebook

# Step 4: Clean Gradle
Write-Host "4. Cleaning Gradle build..." -ForegroundColor Yellow
cd android
.\gradlew.bat clean
cd ..

# Step 5: Clear React Native cache
Write-Host "5. Clearing React Native cache..." -ForegroundColor Yellow
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✅ Cache cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run:" -ForegroundColor Cyan
Write-Host "  npm start -- --reset-cache" -ForegroundColor White
Write-Host ""
Write-Host "In another terminal:" -ForegroundColor Cyan
Write-Host "  npm run android" -ForegroundColor White

