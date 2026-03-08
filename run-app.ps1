# Run Smart Notebook - ensures adb reverse and launches app
# Usage: .\run-app.ps1

Write-Host "Setting up USB tunnel for Metro..." -ForegroundColor Cyan
adb reverse tcp:8081 tcp:8081

Write-Host "Launching app..." -ForegroundColor Cyan
adb shell am force-stop com.smartnotebook
adb shell am start -n com.smartnotebook/.MainActivity

Write-Host ""
Write-Host "Make sure Metro is running: npx react-native start --reset-cache" -ForegroundColor Yellow
