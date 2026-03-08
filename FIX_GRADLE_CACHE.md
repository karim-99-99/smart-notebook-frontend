# Fix Gradle Cache Error & Make Code Changes Appear

## The Problem

- **Gradle cache error** - Corrupted cache file (doesn't stop the app, but can cause build issues)
- **Code changes not appearing** - App runs old code because it's not rebuilding properly

## Quick Fix (Do This First)

### Step 1: Clean Gradle Cache

**In Android Studio:**
1. Click **File** → **Invalidate Caches / Restart**
2. Select **Invalidate and Restart**
3. Wait for Android Studio to restart

**Or manually (PowerShell/CMD):**
```powershell
# Stop Gradle daemon
cd C:\Users\DELL\SmartNotebook\android
.\gradlew --stop

# Delete corrupted cache
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches\8.13\transforms\ab9f8198d58bc47ced068fac434192c3" -ErrorAction SilentlyContinue

# Clean build
.\gradlew clean
```

### Step 2: Rebuild App

**In Android Studio:**
1. **Build** → **Clean Project**
2. **Build** → **Rebuild Project**
3. **Run** → **Run 'app'** (or Shift+F10)

**Or command line:**
```powershell
cd C:\Users\DELL\SmartNotebook\android
.\gradlew clean
.\gradlew assembleDebug
```

### Step 3: Verify Code Files Are Updated

Make sure these files have the navigation fixes:

- `C:\Users\DELL\SmartNotebook\mobile\src\screens\PreviewScreen.tsx` - Retake button
- `C:\Users\DELL\SmartNotebook\mobile\src\screens\EditNoteScreen.tsx` - Navigation header
- `C:\Users\DELL\SmartNotebook\mobile\src\navigation\AppNavigator.tsx` - Back button enabled

## Why Changes Don't Appear

1. **App is using cached build** - Old JavaScript bundle is cached
2. **Metro bundler not reloading** - Need to reload JavaScript
3. **Files not synced** - Changes in WSL path not copied to Windows path

## Force Reload JavaScript Bundle

**On your phone/emulator:**
- Shake device → **Reload** (or press `R` twice in Metro terminal)
- Or: **Ctrl+M** (emulator) → **Reload**

**Or restart Metro:**
```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npm start -- --reset-cache
```

Then rebuild the app.

## Check If Files Are Synced

Compare these files to make sure they match:

**WSL path:** `\\wsl.localhost\Ubuntu\home\karim\smart-notebook\mobile\src\screens\PreviewScreen.tsx`
**Windows path:** `C:\Users\DELL\SmartNotebook\mobile\src\screens\PreviewScreen.tsx`

If they're different, copy from WSL to Windows, or edit directly in Windows path.
