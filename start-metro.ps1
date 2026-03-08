# Free port 8081 and start Metro
# Run: .\start-metro.ps1

Write-Host "Stopping any Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
taskkill /IM node.exe /F 2>$null | Out-Null
Start-Sleep -Seconds 3

Write-Host "Starting Metro on port 8081..." -ForegroundColor Green
npx react-native start --reset-cache
