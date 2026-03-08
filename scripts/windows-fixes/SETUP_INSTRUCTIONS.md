# 🔧 Setup Instructions - Fix Both Errors

## Problems to Fix:
1. ❌ "url.protocol is not implemented" 
2. ❌ "Could not connect to development server"

## ✅ Solution:

### Step 1: Copy Fixed Files

**Option A: Use PowerShell Script**
```powershell
cd C:\Users\DELL\SmartNotebook\mobile
# If you have the WINDOWS_FIXES folder, run:
.\WINDOWS_FIXES\copy-to-windows.ps1
```

**Option B: Manual Copy**
Copy these files from `WINDOWS_FIXES/` to `C:\Users\DELL\SmartNotebook\mobile\`:
- `index.js`
- `metro.config.js`
- `package.json`

### Step 2: Install Dependencies

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npm install
```

**Important:** Make sure `react-native-url-polyfill` is installed:
```powershell
npm install react-native-url-polyfill
```

### Step 3: Find Your Computer's IP Address

```powershell
ipconfig
```

Look for **"IPv4 Address"** under your WiFi adapter (usually something like `192.168.1.xxx` or `172.20.10.xxx`)

### Step 4: Update IP Address in Android Config

Edit: `C:\Users\DELL\SmartNotebook\mobile\android\gradle.properties`

Find this line:
```
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.112
```

Replace `192.168.1.112` with **YOUR IP address** from Step 3.

Also edit: `C:\Users\DELL\SmartNotebook\mobile\android\app\build.gradle`

Find this line (around line 32):
```gradle
buildConfigField "String", "PACKAGER_HOSTNAME", "\"192.168.1.112\""
```

Replace `192.168.1.112` with **YOUR IP address**.

And this line (around line 46):
```gradle
resValue "string", "react_native_packager_hostname", "192.168.1.112"
```

Replace `192.168.1.112` with **YOUR IP address**.

### Step 5: Start Metro Bundler (Terminal 1)

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npx react-native start --reset-cache
```

**Wait for:** "Metro waiting on..."

### Step 6: Run Android App (Terminal 2)

Open a **NEW PowerShell window**:

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npx react-native run-android
```

### Step 7: If Still Can't Connect to Dev Server

On your Android device:
1. Shake the device (or press `Ctrl+M` in emulator)
2. Tap **"Dev Settings"**
3. Tap **"Debug server host & port for device"**
4. Enter: `YOUR_IP:8081` (e.g., `192.168.1.112:8081`)
5. Go back and tap **"Reload"**

## ✅ Verification:

After setup, you should see:
- ✅ No "url.protocol" error
- ✅ Metro bundler connects successfully
- ✅ App loads without errors
- ✅ "Test Connection" button works in login screen

## 🐛 Still Having Issues?

### Error: "url.protocol is not implemented"
- ✅ Run: `npm install react-native-url-polyfill`
- ✅ Verify `index.js` imports polyfill FIRST
- ✅ Clear cache: `npx react-native start --reset-cache`

### Error: "Could not connect to development server"
- ✅ Make sure Metro is running (Step 5)
- ✅ Verify IP address is correct in gradle.properties
- ✅ Phone and computer on same WiFi
- ✅ Try manual IP entry in Dev Settings (Step 7)

## 📝 Quick Checklist:

- [ ] Copied fixed files (index.js, metro.config.js, package.json)
- [ ] Ran `npm install`
- [ ] Found computer IP address
- [ ] Updated IP in gradle.properties (3 places)
- [ ] Started Metro bundler with `--reset-cache`
- [ ] Ran `npx react-native run-android` in separate terminal
- [ ] Set dev server IP manually if needed

