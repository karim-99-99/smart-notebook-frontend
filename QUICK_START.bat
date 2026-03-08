@echo off
REM Quick Start Script for Smart Notebook Mobile App
REM Run this from: C:\Users\DELL\SmartNotebook\mobile

echo.
echo ========================================
echo   Smart Notebook - Quick Start
echo ========================================
echo.

REM Check if phone is connected
echo Checking phone connection...
adb devices | findstr "device$" >nul
if errorlevel 1 (
    echo [ERROR] Phone not detected!
    echo Please connect your phone via USB and enable USB debugging.
    pause
    exit /b 1
)
echo [OK] Phone connected!
echo.

REM Create assets directory if it doesn't exist
if not exist "android\app\src\main\assets" (
    echo Creating assets directory...
    mkdir "android\app\src\main\assets"
)

REM Bundle JavaScript
echo ========================================
echo Step 1: Bundling JavaScript...
echo ========================================
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

if errorlevel 1 (
    echo [ERROR] Bundle failed!
    pause
    exit /b 1
)
echo [OK] Bundle created successfully!
echo.

REM Install app
echo ========================================
echo Step 2: Installing app on phone...
echo ========================================
call npx react-native run-android --no-packager

if errorlevel 1 (
    echo [ERROR] Installation failed!
    pause
    exit /b 1
)
echo.
echo ========================================
echo   SUCCESS! App installed on phone!
echo ========================================
echo.
pause

