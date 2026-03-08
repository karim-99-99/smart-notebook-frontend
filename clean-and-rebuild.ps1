# Full clean and rebuild - run from mobile folder
# Usage: cd C:\Users\DELL\SmartNotebook\mobile; .\clean-and-rebuild.ps1

Write-Host "=== Stopping any running Metro ===" -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "=== Clearing Metro cache ===" -ForegroundColor Yellow
Remove-Item -Path "$PWD\node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$PWD\tmp" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP\haste-map-*" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "=== Cleaning Android build ===" -ForegroundColor Yellow
Set-Location android
.\gradlew clean 2>$null
Set-Location ..

Write-Host "=== Done. Now run these in 2 separate terminals: ===" -ForegroundColor Green
Write-Host ""
Write-Host "Terminal 1:" -ForegroundColor Cyan
Write-Host "  cd C:\Users\DELL\SmartNotebook\mobile"
Write-Host "  npx react-native start --reset-cache"
Write-Host ""
Write-Host "Terminal 2 (after Metro is ready):" -ForegroundColor Cyan
Write-Host "  cd C:\Users\DELL\SmartNotebook\mobile"
Write-Host "  npx react-native run-android"
Write-Host ""
