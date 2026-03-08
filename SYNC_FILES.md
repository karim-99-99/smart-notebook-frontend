# Sync Code Files Between WSL and Windows

Since Android Studio uses Windows path (`C:\Users\DELL\SmartNotebook`), make sure code changes are in that path.

## Quick Sync Script (PowerShell)

Run this in PowerShell to copy files from WSL to Windows:

```powershell
# Copy source files from WSL to Windows
$wslPath = "\\wsl.localhost\Ubuntu\home\karim\smart-notebook\mobile\src"
$winPath = "C:\Users\DELL\SmartNotebook\mobile\src"

# Copy all TypeScript/TSX files
Copy-Item -Path "$wslPath\**\*.tsx" -Destination $winPath -Recurse -Force
Copy-Item -Path "$wslPath\**\*.ts" -Destination $winPath -Recurse -Force

Write-Host "Files synced!"
```

## Manual Check

Verify these files have the fixes:

1. **PreviewScreen.tsx** - Line 32 should be: `navigation.navigate('Scan');`
2. **EditNoteScreen.tsx** - Should have SafeAreaView header with Scan/Folders/History buttons
3. **AppNavigator.tsx** - EditNote screen should NOT have `headerLeft: () => null`

## After Syncing

1. **Clean build:** `.\gradlew clean` (in android folder)
2. **Rebuild:** `.\gradlew assembleDebug`
3. **Reload Metro:** Shake device → Reload
