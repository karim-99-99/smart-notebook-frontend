# Windows Path Fixes

## Files to Update in Windows Path

Copy these files to: `C:\Users\DELL\SmartNotebook\mobile\`

### 1. `index.js`
- ✅ Fixed URL polyfill import (must be first)
- ✅ Added error checking for polyfill
- ✅ Added debug logging

### 2. `metro.config.js`
- ✅ Improved Metro bundler configuration
- ✅ Better source resolution
- ✅ Enhanced middleware support

### 3. `package.json`
- ✅ Added `--reset-cache` to start scripts
- ✅ Ensures react-native-url-polyfill is listed

### 4. `start-dev-server.ps1`
- ✅ Script to start Metro bundler with cache reset

## Steps to Fix:

### Step 1: Copy Files
Copy all files from `WINDOWS_FIXES/` to `C:\Users\DELL\SmartNotebook\mobile\`

### Step 2: Install Dependencies
```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npm install
```

### Step 3: Clear Cache and Start Metro
```powershell
# Option A: Use the script
.\start-dev-server.ps1

# Option B: Manual command
npx react-native start --reset-cache
```

### Step 4: In Another Terminal, Run Android
```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npx react-native run-android
```

## Troubleshooting:

### "url.protocol is not implemented"
- ✅ Make sure `react-native-url-polyfill` is installed: `npm install react-native-url-polyfill`
- ✅ Verify `index.js` imports polyfill FIRST
- ✅ Clear cache: `npx react-native start --reset-cache`

### "Could not connect to development server"
- ✅ Make sure Metro bundler is running (Step 3)
- ✅ Check your IP in `android/gradle.properties` matches your WiFi IP
- ✅ Find your IP: `ipconfig` (look for IPv4 Address)
- ✅ Update `REACT_NATIVE_PACKAGER_HOSTNAME` in gradle.properties
- ✅ Shake device → Dev Settings → Debug server host → Enter your IP:8081

