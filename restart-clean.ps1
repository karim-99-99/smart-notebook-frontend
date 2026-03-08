# Clean Restart Script for Smart Notebook
# This will clean Gradle and restart the app

Write-Host "🧹 Cleaning Gradle build..." -ForegroundColor Cyan
cd android
.\gradlew.bat clean
cd ..

Write-Host ""
Write-Host "✅ Gradle cleaned!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Now run these commands in separate terminals:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Terminal 1 (Metro):" -ForegroundColor Cyan
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 (Android):" -ForegroundColor Cyan
Write-Host "  npm run android" -ForegroundColor White
Write-Host ""
Write-Host "Or run this script to do it all:" -ForegroundColor Yellow
Write-Host "  npm run android" -ForegroundColor White
Write-Host "  (This will start Metro automatically)" -ForegroundColor Gray

