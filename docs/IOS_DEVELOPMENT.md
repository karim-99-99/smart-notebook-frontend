# Developing Smart Notebook for iOS and iPhone

You have two ways to develop and run the app on iPhone, depending on whether you have a Mac or only Windows.

---

## Option A: You have a Mac (Xcode + Simulator or real iPhone)

Use this for **local** iOS development: run the app in the iOS Simulator or on a physical iPhone connected by USB.

### 1. Install required tools (one-time)

- **Xcode** – from the Mac App Store. After install, open Xcode once and accept the license; then run:
  ```bash
  xcode-select --install
  ```
  if the command-line tools are not already installed.
- **CocoaPods** – in Terminal:
  ```bash
  sudo gem install cocoapods
  ```
- **Node.js** – e.g. from [nodejs.org](https://nodejs.org) or `nvm`.

### 2. Get the project on your Mac

- Clone the repo to your Mac, or copy the project folder (e.g. from Windows/WSL) so you have the **mobile** folder on the Mac.

### 3. Install dependencies and pods

In Terminal:

```bash
cd path/to/smart-notebook/mobile
npm install
cd ios
pod install
cd ..
```

### 4. Run on iOS Simulator

```bash
npx react-native start
```

In a **second** Terminal (same folder):

```bash
npx react-native run-ios
```

This builds and runs the app in the default iOS Simulator. To pick a device:

```bash
npx react-native run-ios --simulator "iPhone 16"
```

(List simulators with `xcrun simctl list devices`.)

### 5. Run on a physical iPhone

1. Connect the iPhone with a USB cable.
2. On the iPhone: **Settings → Developer → Trust this computer** (if asked).
3. In Xcode: open `mobile/ios/SmartNotebook.xcworkspace` (not the `.xcodeproj`), select your iPhone as the run target, then click Run.
4. Or from Terminal (with device connected):
   ```bash
   npx react-native run-ios --device
   ```
5. On the iPhone: **Settings → General → VPN & Device Management** → trust the developer certificate if needed.

You can now develop and test on both simulator and iPhone from the Mac.

---

## Option B: You only have Windows (no Mac)

You **cannot** run Xcode or the iOS Simulator on Windows. You can still:

- **Edit all app code** (JavaScript/TypeScript, React, API URLs, etc.) on Windows.
- **Build the iOS app in the cloud** with **Expo EAS Build** and install it on your iPhone via **TestFlight**.

### 1. Develop on Windows

- Edit the project in `C:\Users\DELL\SmartNotebook\mobile` (or your WSL path) as you do for Android.
- Run the Android app or Metro for Android when you want to test logic; for iOS-specific UI you'll rely on the next step.

### 2. Build iOS in the cloud (EAS) and install on iPhone

From PowerShell (in the **mobile** folder):

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npm run eas:login
npm run eas:build:ios:production
```

- When prompted, use your **Expo** account and **Apple Developer** account (Apple ID). You need an [Apple Developer Program](https://developer.apple.com/programs/) membership ($99/year) for real device / TestFlight.
- The build runs on Expo's servers (about 10–25 minutes). When it finishes, you get a link to the build.

### 3. Install on your iPhone

- **TestFlight (recommended):** After the build, run:
  ```powershell
  npm run eas:submit:ios:latest
  ```
  Then on your iPhone install the **TestFlight** app from the App Store, open it, and install **Smart Notebook** from the TestFlight build.
- Or use the **install link** EAS gives you (internal distribution) if you've set that up.

### 4. When you change only JS/UI (no native changes)

You don't need a new iOS build. From the **mobile** folder:

```powershell
npm run eas:update
```

Existing installs (e.g. from TestFlight) will get the update the next time they open the app.

---

## Summary

| Goal                         | Have Mac? | What to do |
|-----------------------------|-----------|------------|
| Run on iPhone daily, fast   | Yes       | Option A: Xcode + `run-ios` (simulator or device). |
| Run on iPhone, no Mac       | No        | Option B: EAS Build → TestFlight → install on iPhone. |
| Change JS/UI only           | Any       | Edit on Windows; for iOS installs use `npm run eas:update` (no new build). |

For full EAS build/submit/update steps and troubleshooting, see **IOS_BUILD_STEPS.md** in the mobile folder.
