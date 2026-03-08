@echo off
REM Copy all updated files from WSL to Windows path
REM Run this from: C:\Users\DELL\SmartNotebook\mobile

echo 📋 Copying all updated files to Windows path...
echo.

REM Use WSL to copy files
wsl bash -c "cp /home/karim/smart-notebook/mobile/src/lib/supabase.ts /mnt/c/Users/DELL/SmartNotebook/mobile/src/lib/supabase.ts && echo '✓ Copied supabase.ts' || echo '❌ Failed to copy supabase.ts'"

wsl bash -c "cp /home/karim/smart-notebook/mobile/src/screens/LoginScreen.tsx /mnt/c/Users/DELL/SmartNotebook/mobile/src/screens/LoginScreen.tsx && echo '✓ Copied LoginScreen.tsx' || echo '❌ Failed to copy LoginScreen.tsx'"

wsl bash -c "cp /home/karim/smart-notebook/mobile/index.js /mnt/c/Users/DELL/SmartNotebook/mobile/index.js && echo '✓ Copied index.js' || echo '❌ Failed to copy index.js'"

wsl bash -c "cp /home/karim/smart-notebook/mobile/package.json /mnt/c/Users/DELL/SmartNotebook/mobile/package.json && echo '✓ Copied package.json' || echo '❌ Failed to copy package.json'"

echo.
echo ✅ Copy process completed!
echo.
echo 📦 Next steps:
echo    1. Install the new package: npm install react-native-url-polyfill
echo    2. Rebuild the app: npx react-native run-android
echo.
pause

