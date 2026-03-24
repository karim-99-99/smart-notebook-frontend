# Syncs Gradle from WSL -> C:\Users\DELL\SmartNotebook\mobile, then gradlew clean + npm run android.
#
# If this file is NOT on disk under Windows yet, run it from the WSL share:
#   powershell -NoProfile -ExecutionPolicy Bypass -File "\\wsl.localhost\Ubuntu\home\karim\smart-notebook\mobile\scripts\WINDOWS-SYNC-AND-BUILD-ANDROID.ps1"
#
# Or copy it first:
#   Copy-Item "\\wsl.localhost\Ubuntu\home\karim\smart-notebook\mobile\scripts\WINDOWS-SYNC-AND-BUILD-ANDROID.ps1" "C:\Users\DELL\SmartNotebook\mobile\scripts\" -Force
$ErrorActionPreference = "Stop"

$WslMobile = "\\wsl.localhost\Ubuntu\home\karim\smart-notebook\mobile"
$WinMobile = "C:\Users\DELL\SmartNotebook\mobile"

if (-not (Test-Path $WinMobile)) {
    Write-Host "ERROR: Windows project not found: $WinMobile" -ForegroundColor Red
    exit 1
}

function Copy-IfExists($rel) {
    $from = Join-Path $WslMobile $rel
    $to = Join-Path $WinMobile $rel
    if (Test-Path $from) {
        Copy-Item -LiteralPath $from -Destination $to -Force
        Write-Host "OK $rel"
    } else {
        Write-Host "SKIP (missing): $from" -ForegroundColor Yellow
    }
}

Write-Host "=== Sync Android Gradle from WSL ===" -ForegroundColor Cyan
Copy-IfExists "android\build.gradle"
Copy-IfExists "android\settings.gradle"
Copy-IfExists "android\gradle.properties"
Copy-IfExists "android\app\build.gradle"

Write-Host "`n=== Gradle stop + clean ===" -ForegroundColor Cyan
Push-Location (Join-Path $WinMobile "android")
& .\gradlew.bat --stop
& .\gradlew.bat clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "gradlew clean failed" -ForegroundColor Red
    Pop-Location
    exit $LASTEXITCODE
}
Pop-Location

Write-Host "`n=== npm run android ===" -ForegroundColor Cyan
Set-Location $WinMobile
npm run android
