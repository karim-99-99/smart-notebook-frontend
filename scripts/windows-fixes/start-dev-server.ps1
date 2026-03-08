# Start Metro Bundler for React Native
# Run this from: C:\Users\DELL\SmartNotebook\mobile

Write-Host "🚀 Starting Metro Bundler..." -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from: C:\Users\DELL\SmartNotebook\mobile" -ForegroundColor Yellow
    exit 1
}

# Clear Metro cache
Write-Host "🧹 Clearing Metro cache..." -ForegroundColor Cyan
npx react-native start --reset-cache

